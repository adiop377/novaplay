const pool = require('../config/db');

let statsCache = null;
let statsCacheTime = null;

const Order = {
    // Create new order (can be from cart or direct topup)
    async create(userId, total, player_id = null, items = []) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Create order
            const orderResult = await client.query(`
                INSERT INTO orders (user_id, total, player_id)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [userId, total, player_id]);

            const order = orderResult.rows[0];

            // Add order items
            for (const item of items) {
                await client.query(`
                    INSERT INTO order_items (order_id, product_id, price, product_title)
                    VALUES ($1, $2, $3, $4)
                `, [order.id, item.product_id, item.price, item.title]);
            }

            // Clear user's cart if this is a cart order
            if (items.length > 0 && !player_id) {
                await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
            }

            await client.query('COMMIT');

            // Fetch the fully formed order details including user info for the email
            try {
                const fullOrder = await Order.getById(order.id);
                const mailer = require('../utils/mailer');
                await mailer.sendNewOrderEmail(fullOrder);
            } catch (err) {
                console.error('[MAILER] Error triggering new order email:', err);
            }

            return order;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Get user's orders
    async getByUser(userId) {
        const query = `
            SELECT o.*, 
                   json_agg(json_build_object(
                       'id', oi.id,
                       'product_id', oi.product_id,
                       'price', oi.price,
                       'title', oi.product_title
                   )) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1 AND o.status NOT IN ('cancelled', 'reavailable')
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    },

    // Get order by ID
    async getById(orderId) {
        const query = `
            SELECT o.*, 
                   u.name as user_name, u.email as user_email,
                   json_agg(json_build_object(
                       'id', oi.id,
                       'product_id', oi.product_id,
                       'price', oi.price,
                       'title', oi.product_title
                   )) as items
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = $1
            GROUP BY o.id, u.name, u.email
        `;
        const result = await pool.query(query, [orderId]);
        return result.rows[0];
    },

    // Get all orders (admin)
    async getAll() {
        const query = `
            SELECT o.*, 
                   u.name as user_name, u.email as user_email,
                   COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id, u.name, u.email
            ORDER BY o.created_at DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    // Update order status
    async updateStatus(orderId, status) {
        const query = `
            UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const result = await pool.query(query, [status, orderId]);
        return result.rows[0];
    },

    // Update payment status
    async updatePaymentStatus(orderId, paymentStatus) {
        const query = `
            UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const result = await pool.query(query, [paymentStatus, orderId]);
        return result.rows[0];
    },

    // Get order stats (admin)
    async getStats() {
        if (statsCache && statsCacheTime && (Date.now() - statsCacheTime < 60000)) {
            return statsCache;
        }

        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
                COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
                COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
                COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0) as total_revenue
            FROM orders
        `);
        
        statsCache = result.rows[0];
        statsCacheTime = Date.now();
        return statsCache;
    },

    // Get confirmed topup orders for sold history
    async getConfirmedTopups() {
        const query = `
            SELECT o.*, 
                   json_agg(json_build_object(
                       'title', oi.product_title,
                       'price', oi.price
                   )) as packages
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.player_id IS NOT NULL 
            AND o.status IN ('confirmed', 'delivered')
            GROUP BY o.id
            ORDER BY o.updated_at DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    }
};

module.exports = Order;
