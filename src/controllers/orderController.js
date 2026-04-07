const Order = require('../models/Order');
const Cart = require('../models/Cart');

const orderController = {
    // Checkout - Create order from cart
    checkout: async (req, res) => {
        try {
            const userId = req.session.user.id;

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
            const total = await Cart.getTotal(userId);

            // Create order
            const order = await Order.create(userId, total, null, cartItems);

            req.flash('success', 'Order pre-created! Please complete your payment.');
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
