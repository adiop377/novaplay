const Order = require('../models/Order');
const User = require('../models/User');

const topupController = {
    // Create a new topup order
    createOrder: async (req, res) => {
        try {
            if (!req.session.user) {
                return res.status(401).json({ success: false, message: 'Please login to topup.' });
            }

            const { amount, price, uid, use_coins } = req.body;
            const userId = req.session.user.id;

            if (!uid || !amount || !price) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const basePrice = parseFloat(price);
            let finalPrice = basePrice;
            let coinsDeducted = 0;

            const shouldUseCoins = (use_coins === true || use_coins === 'true' || use_coins === 1 || use_coins === '1');

            if (shouldUseCoins) {
                const freshUser = await User.findById(userId);
                const userCoins = freshUser ? (freshUser.nova_coins || 0) : 0;
                coinsDeducted = Math.min(userCoins, Math.floor(basePrice - 1));
                if (coinsDeducted > 0) {
                    finalPrice = Math.max(1, basePrice - coinsDeducted);
                    const updated = await User.deductNovaCoins(userId, coinsDeducted);
                    req.session.user.nova_coins = updated ? updated.nova_coins : Math.max(0, userCoins - coinsDeducted);
                }
            }

            // Create items breakdown with discount line item
            const items = [
                {
                    product_id: null,
                    price: basePrice,
                    title: `💎 Free Fire Topup: ${amount} Diamonds (UID: ${uid})`
                }
            ];

            if (coinsDeducted > 0) {
                items.push({
                    product_id: null,
                    price: -coinsDeducted,
                    title: `🪙 Nova Coins Discount (-${coinsDeducted} Coins)`
                });
            }

            const order = await Order.create(userId, finalPrice, uid, items);

            res.json({ 
                success: true, 
                orderId: order.id,
                coinsDeducted: coinsDeducted,
                finalPrice: finalPrice
            });
        } catch (error) {
            console.error('Create topup order error:', error);
            res.status(500).json({ success: false, message: 'Failed to create topup order' });
        }
    }
};

module.exports = topupController;
