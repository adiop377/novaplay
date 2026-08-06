require('dotenv').config();
const pool = require('./src/config/db');

async function optimizeDatabase() {
    try {
        console.log('Adding database indexes...');
        
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_is_sold ON products(is_sold);`);
        console.log('Index created: idx_products_is_sold');
        
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);
        console.log('Index created: idx_orders_status');
        
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);`);
        console.log('Index created: idx_orders_payment_status');
        
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);`);
        console.log('Index created: idx_orders_created_at');

        console.log('All indexes created successfully!');
    } catch (error) {
        console.error('Error adding indexes:', error);
    } finally {
        pool.end();
    }
}

optimizeDatabase();
