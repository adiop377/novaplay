const pool = require('../config/db');

const Cart = {
    // Get user's cart with product details
    async getByUser(userId) {
        const query = `
            SELECT c.id, c.product_id, c.created_at,
                   p.title, p.rank, p.level, p.price, p.discount, p.images, p.tag, p.is_sold
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = $1
            ORDER BY c.created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    },

    // Add item to cart
    async addItem(userId, productId) {
        // Check if product exists and not sold
        const productCheck = await pool.query(
            'SELECT id FROM products WHERE id = $1 AND is_sold = false',
            [productId]
        );
        if (productCheck.rows.length === 0) {
            throw new Error('Product not available');
        }

        // Check if already in cart
        const existingCheck = await pool.query(
            'SELECT id FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );
        if (existingCheck.rows.length > 0) {
            throw new Error('Already in cart');
        }

        const query = `
            INSERT INTO cart_items (user_id, product_id)
            VALUES ($1, $2)
            RETURNING *
        `;
        const result = await pool.query(query, [userId, productId]);
        return result.rows[0];
    },

    // Remove item from cart
    async removeItem(userId, productId) {
        const query = 'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2';
        await pool.query(query, [userId, productId]);
        return true;
    },

    // Clear user's cart
    async clear(userId) {
        const query = 'DELETE FROM cart_items WHERE user_id = $1';
        await pool.query(query, [userId]);
        return true;
    },

    // Get cart count
    async getCount(userId) {
        const query = 'SELECT COUNT(*) as count FROM cart_items WHERE user_id = $1';
        const result = await pool.query(query, [userId]);
        return parseInt(result.rows[0].count);
    },

    // Get cart total
    async getTotal(userId) {
        const query = `
            SELECT COALESCE(SUM(p.price - p.discount), 0) as total
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = $1 AND p.is_sold = false
        `;
        const result = await pool.query(query, [userId]);
        return parseFloat(result.rows[0].total);
    }
};

module.exports = Cart;
