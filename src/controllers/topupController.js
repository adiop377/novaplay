const Order = require('../models/Order');

const topupController = {
    // Create a new topup order
    createOrder: async (req, res) => {
        try {
            if (!req.session.user) {
                return res.status(401).json({ success: false, message: 'Please login to topup.' });
            }

            const { amount, price, uid } = req.body;
            const userId = req.session.user.id;

            if (!uid || !amount || !price) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            // Create a pseudo-cart item for the topup
            const topupItem = {
                product_id: null,
                price: price,
                title: `💎 Free Fire Topup: ${amount} Diamonds (UID: ${uid})`
            };

            const order = await Order.create(userId, price, uid, [topupItem]);

            res.json({ success: true, orderId: order.id });
        } catch (error) {
            console.error('Create topup order error:', error);
            res.status(500).json({ success: false, message: 'Failed to create topup order' });
        }
    }
};

module.exports = topupController;
