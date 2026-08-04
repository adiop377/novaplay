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

    // Apply Nova Coins discount directly from checkout page
    applyCoinsToOrder: async (req, res) => {
        try {
            const orderId = parseInt(req.params.orderId);
            if (!orderId) {
                return res.status(400).json({ success: false, message: 'Invalid order ID' });
            }

            const order = await Order.getById(orderId);
            const userId = req.session && req.session.user ? req.session.user.id : null;

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Please login first' });
            }

            if (!order || parseInt(order.user_id) !== parseInt(userId)) {
                return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
            }

            if (order.payment_status === 'paid') {
                return res.status(400).json({ success: false, message: 'Order is already paid' });
            }

            // Check if coins are already deducted in order.items
            const alreadyHasCoinsDiscount = order.items && Array.isArray(order.items) && order.items.some(it => it && it.title && String(it.title).toLowerCase().includes('nova coins'));
            if (alreadyHasCoinsDiscount) {
                return res.status(400).json({ success: false, message: 'Nova Coins discount is already applied to this order' });
            }

            const User = require('../models/User');
            const freshUser = await User.findById(userId);
            const userCoins = freshUser ? (freshUser.nova_coins || 0) : 0;
            const currentTotal = parseFloat(order.total);
            const coinsToDeduct = Math.min(userCoins, Math.floor(currentTotal - 1));

            if (coinsToDeduct <= 0) {
                return res.status(400).json({ success: false, message: 'No Nova Coins available or total too low' });
            }

            const newTotal = Math.max(1, currentTotal - coinsToDeduct);

            // Deduct user's coins
            let updatedUserCoins = userCoins - coinsToDeduct;
            try {
                const updated = await User.deductNovaCoins(userId, coinsToDeduct);
                if (updated) updatedUserCoins = updated.nova_coins;
            } catch (uErr) {
                console.error('Error in deductNovaCoins:', uErr);
            }
            req.session.user.nova_coins = updatedUserCoins;

            // Update order total and add discount item
            await pool.query('UPDATE orders SET total = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newTotal, orderId]);
            await pool.query(`
                INSERT INTO order_items (order_id, product_id, price, product_title)
                VALUES ($1, NULL, $2, $3)
            `, [orderId, -coinsToDeduct, `🪙 Nova Coins Discount (-${coinsToDeduct} Coins)`]);

            return res.json({ success: true, newTotal: newTotal, coinsDeducted: coinsToDeduct });
        } catch (error) {
            console.error('Apply coins to order error:', error);
            return res.status(500).json({ success: false, message: error.message || 'Failed to apply Nova Coins' });
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
                let isIdPurchase = false;
                let isVipPurchase = false;

                for (let item of order.items) {
                    if (item.product_id) {
                        await Product.markSold(item.product_id);
                        isIdPurchase = true;
                    }
                    if (item.title && item.title.includes('VIP PRO Membership')) {
                        isVipPurchase = true;
                    }
                }

                // Send Email Notification to Admin
                const mailer = require('../utils/mailer');
                await mailer.sendNewOrderEmail(order, true);

                // Auto-confirm order if strictly automated
                await Order.updateStatus(db_order_id, 'confirmed');

                const User = require('../models/User');
                if (order.user_id) {
                    // Reward customer 125 Nova coins ONLY for actual ID purchase
                    if (isIdPurchase) {
                        await User.addNovaCoins(order.user_id, 125);
                        if (req.session.user && req.session.user.id === order.user_id) {
                            req.session.user.nova_coins = (req.session.user.nova_coins || 0) + 125;
                        }
                    }
                    // Upgrade to VIP if it was a VIP order
                    if (isVipPurchase) {
                        await User.upgradeToVip(order.user_id);
                        if (req.session.user && req.session.user.id === order.user_id) {
                            req.session.user.is_vip = true;
                        }
                    }
                }

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
