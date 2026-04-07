const Cart = require('../models/Cart');

const cartController = {
    // View cart page
    viewCart: async (req, res) => {
        try {
            const userId = req.session.user.id;
            const cartItems = await Cart.getByUser(userId);
            const total = await Cart.getTotal(userId);

            res.render('pages/cart', {
                title: 'Shopping Cart - PlayNova',
                layout: 'layouts/main',
                cartItems: cartItems,
                total: total
            });

        } catch (error) {
            console.error('View cart error:', error);
            req.flash('error', 'Could not load cart');
            res.redirect('/');
        }
    },

    // Add to cart
    addToCart: async (req, res) => {
        try {
            const userId = req.session.user.id;
            const productId = parseInt(req.params.productId);

            await Cart.addItem(userId, productId);
            req.flash('success', 'Added to cart!');

            // Check if AJAX request
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                const count = await Cart.getCount(userId);
                return res.json({ success: true, cartCount: count });
            }

            res.redirect('back');

        } catch (error) {
            console.error('Add to cart error:', error);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({ success: false, error: error.message });
            }

            req.flash('error', error.message || 'Could not add to cart');
            res.redirect('back');
        }
    },

    // Remove from cart
    removeFromCart: async (req, res) => {
        try {
            const userId = req.session.user.id;
            const productId = parseInt(req.params.productId);

            await Cart.removeItem(userId, productId);
            req.flash('success', 'Removed from cart');

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                const count = await Cart.getCount(userId);
                const total = await Cart.getTotal(userId);
                return res.json({ success: true, cartCount: count, total: total });
            }

            res.redirect('/cart');

        } catch (error) {
            console.error('Remove from cart error:', error);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({ success: false, error: error.message });
            }

            req.flash('error', 'Could not remove item');
            res.redirect('/cart');
        }
    },

    // Clear cart
    clearCart: async (req, res) => {
        try {
            const userId = req.session.user.id;
            await Cart.clear(userId);

            req.flash('success', 'Cart cleared');
            res.redirect('/cart');

        } catch (error) {
            console.error('Clear cart error:', error);
            req.flash('error', 'Could not clear cart');
            res.redirect('/cart');
        }
    },

    // Get cart count (API)
    getCartCount: async (req, res) => {
        try {
            if (!req.session.user) {
                return res.json({ count: 0 });
            }
            const count = await Cart.getCount(req.session.user.id);
            res.json({ count: count });
        } catch (error) {
            res.json({ count: 0 });
        }
    }
};

module.exports = cartController;
