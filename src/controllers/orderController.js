const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');

const orderController = {
    // Checkout - Create order from cart
    checkout: async (req, res) => {
        try {
            const userId = req.session.user.id;
            const useCoins = (
                req.query.use_coins === '1' || 
                req.query.use_coins === 'true' || 
                req.query.use_coins === true ||
                (req.body && (req.body.use_coins === '1' || req.body.use_coins === 'true' || req.body.use_coins === true))
            );

            // Get cart items
            const cartItems = await Cart.getByUser(userId);

            if (cartItems.length === 0) {
                req.flash('error', 'Your cart is empty');
                return res.redirect('/cart');
            }

            // Check if any product is already sold
            const soldItems = cartItems.filter(item => item.is_sold);
            if (soldItems.length > 0) {
                req.flash('error', 'Some items in your cart are no longer available');
                return res.redirect('/cart');
            }

            // Calculate total
            let total = await Cart.getTotal(userId);
            let coinsDeducted = 0;

            if (useCoins) {
                const freshUser = await User.findById(userId);
                const userCoins = freshUser ? (freshUser.nova_coins || 0) : 0;
                coinsDeducted = Math.min(userCoins, Math.floor(total - 1));
                if (coinsDeducted > 0) {
                    total = Math.max(1, total - coinsDeducted);
                    const updated = await User.deductNovaCoins(userId, coinsDeducted);
                    req.session.user.nova_coins = updated ? updated.nova_coins : Math.max(0, userCoins - coinsDeducted);
                }
            }

            // Create order items array
            const orderItems = [...cartItems];
            if (coinsDeducted > 0) {
                orderItems.push({
                    product_id: null,
                    price: -coinsDeducted,
                    title: `🪙 Nova Coins Discount (-${coinsDeducted} Coins)`
                });
            }

            // Create order
            const order = await Order.create(userId, total, null, orderItems);

            if (coinsDeducted > 0) {
                req.flash('success', `Order pre-created! Redeemed 🪙 ${coinsDeducted} Nova Coins (-₹${coinsDeducted} Discount).`);
            } else {
                req.flash('success', 'Order pre-created! You will receive +125 Nova Coins upon purchase confirmation.');
            }
            res.redirect('/payment/checkout/' + order.id);

        } catch (error) {
            console.error('Checkout error:', error);
            req.flash('error', 'Could not process order. Please try again.');
            res.redirect('/cart');
        }
    },

    // View user's orders
    viewOrders: async (req, res) => {
        try {
            const userId = req.session.user.id;
            const orders = await Order.getByUser(userId);

            res.render('pages/orders', {
                title: 'My Orders - PlayNova',
                layout: 'layouts/main',
                orders: orders
            });

        } catch (error) {
            console.error('View orders error:', error);
            req.flash('error', 'Could not load orders');
            res.redirect('/');
        }
    },

    // View single order
    viewOrder: async (req, res) => {
        try {
            const order = await Order.getById(req.params.id);
            const userId = req.session.user.id;

            // Check if order belongs to user (or user is admin)
            if (!order || (order.user_id !== userId && req.session.user.role !== 'admin')) {
                req.flash('error', 'Order not found');
                return res.redirect('/orders');
            }

            res.render('pages/order-detail', {
                title: 'Order #' + order.id + ' - PlayNova',
                layout: 'layouts/main',
                order: order
            });

        } catch (error) {
            console.error('View order error:', error);
            req.flash('error', 'Could not load order');
            res.redirect('/orders');
        }
    }
};

module.exports = orderController;
