const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const pool = require('../config/db');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder'
});

const paymentController = {
    // Render payment checkout page
    checkoutPage: async (req, res) => {
        try {
            const orderId = req.params.orderId;
            const order = await Order.getById(orderId);
            const userId = req.session.user.id;

            if (!order || order.user_id !== userId) {
                req.flash('error', 'Order not found or unauthorized');
                return res.redirect('/orders');
            }

            if (order.payment_status === 'paid') {
                req.flash('info', 'This order is already paid.');
                return res.redirect('/orders');
            }

            res.render('pages/checkout-payment', {
                title: 'Complete Payment - PlayNova',
                layout: 'layouts/main',
                order: order,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
            });
        } catch (error) {
            console.error('Checkout page error:', error);
            res.redirect('/orders');
        }
    },

    // Create Razorpay Order
    createRazorpayOrder: async (req, res) => {
        try {
            const { orderId } = req.body;
            const dbOrder = await Order.getById(orderId);

            if (!dbOrder) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const options = {
                amount: Math.round(dbOrder.total * 100), // amount in paise
                currency: "INR",
                receipt: "receipt_order_" + orderId
            };

            const rpOrder = await razorpay.orders.create(options);

            // Update DB with payment_id
            await pool.query('UPDATE orders SET payment_id = $1 WHERE id = $2', [rpOrder.id, orderId]);

            res.json({ success: true, order: rpOrder });
        } catch (error) {
            console.error('Create razorpay order error:', error);
            res.status(500).json({ error: 'Failed to create payment order' });
        }
    },

    // Verify Payment Signature
    verifyPayment: async (req, res) => {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, db_order_id } = req.body;

            const sign = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSign = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder')
                .update(sign.toString())
                .digest("hex");

            if (razorpay_signature === expectedSign) {
                // Payment is successful
                await Order.updatePaymentStatus(db_order_id, 'paid');
                
                // Fetch order and mark items as sold since payment is verified automatically
                const order = await Order.getById(db_order_id);
                for (let item of order.items) {
                    if (item.product_id) {
                        await Product.markSold(item.product_id);
                    }
                }

                // Send Email Notification to Admin
                const mailer = require('../utils/mailer');
                await mailer.sendNewOrderEmail(order, true);

                // Auto-confirm order if strictly automated
                await Order.updateStatus(db_order_id, 'confirmed');

                return res.json({ success: true, redirectUrl: `/payment/thank-you/${db_order_id}` });
            } else {
                await Order.updatePaymentStatus(db_order_id, 'failed');
                return res.status(400).json({ success: false, message: 'Invalid payment signature!' });
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            res.status(500).json({ message: "Internal Server Error!" });
        }
    },

    // Render Thank You Page
    thankYouPage: async (req, res) => {
        try {
            const orderId = req.params.orderId;
            const order = await Order.getById(orderId);
            const userId = req.session.user.id;
            
            if (!order || order.user_id !== userId) {
                return res.redirect('/orders');
            }

            res.render('pages/thank-you', {
                title: 'Payment Successful - PlayNova',
                layout: 'layouts/main',
                order: order
            });
        } catch (error) {
            res.redirect('/orders');
        }
    }
};

module.exports = paymentController;
