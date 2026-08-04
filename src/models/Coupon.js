const pool = require('../config/db');

const Coupon = {
    // Generate a new coupon code
    async create(code, coins_amount, max_uses) {
        const result = await pool.query(
            `INSERT INTO coupons (code, coins_amount, max_uses) 
             VALUES ($1, $2, $3) RETURNING *`,
            [code, coins_amount, max_uses]
        );
        return result.rows[0];
    },

    // Get all coupons for Admin Dashboard
    async getAll() {
        const result = await pool.query(
            'SELECT * FROM coupons ORDER BY created_at DESC'
        );
        return result.rows;
    },

    // Find coupon by code
    async findByCode(code) {
        const result = await pool.query(
            'SELECT * FROM coupons WHERE code = $1',
            [code.trim().toUpperCase()]
        );
        return result.rows[0];
    },
    
    // Toggle active status
    async toggleStatus(id) {
        const result = await pool.query(
            'UPDATE coupons SET is_active = NOT is_active WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    },

    // Redeem a coupon
    async redeem(userId, code) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // 1. Get the coupon with an exclusive lock
            const couponResult = await client.query(
                'SELECT * FROM coupons WHERE code = $1 FOR UPDATE',
                [code.trim().toUpperCase()]
            );

            const coupon = couponResult.rows[0];

            // Validations
            if (!coupon) throw new Error('Invalid coupon code.');
            if (!coupon.is_active) throw new Error('This coupon is currently disabled.');
            if (coupon.current_uses >= coupon.max_uses) throw new Error('This coupon has reached its maximum usage limit.');

            // 2. Check if user already redeemed it
            const redemptionResult = await client.query(
                'SELECT id FROM coupon_redemptions WHERE user_id = $1 AND coupon_id = $2',
                [userId, coupon.id]
            );

            if (redemptionResult.rows.length > 0) {
                throw new Error('You have already redeemed this coupon code.');
            }

            // 3. Mark as redeemed for this user
            await client.query(
                'INSERT INTO coupon_redemptions (user_id, coupon_id) VALUES ($1, $2)',
                [userId, coupon.id]
            );

            // 4. Update coupon usage count
            await client.query(
                'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = $1',
                [coupon.id]
            );

            // 5. Add Nova Coins to the user
            await client.query(
                'UPDATE users SET nova_coins = COALESCE(nova_coins, 0) + $1 WHERE id = $2',
                [coupon.coins_amount, userId]
            );

            await client.query('COMMIT');
            
            return {
                success: true,
                message: `Successfully redeemed! Added ${coupon.coins_amount} Nova Coins to your wallet.`,
                coins_amount: coupon.coins_amount
            };
        } catch (error) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: error.message
            };
        } finally {
            client.release();
        }
    }
};

module.exports = Coupon;
