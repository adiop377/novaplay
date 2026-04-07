require('dotenv').config();
const pool = require('../src/config/db');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');

async function confirmAllOrders() {
    console.log('🚀 Starting bulk order confirmation...');
    
    try {
        // 1. Get all orders that are NOT yet fully confirmed/paid
        const orders = await Order.getAll();
        const pendingOrders = orders.filter(o => o.status !== 'confirmed' || o.payment_status !== 'paid');
        
        console.log(`📋 Found ${pendingOrders.length} orders to update.`);

        for (const order of pendingOrders) {
            console.log(`🔄 Updating Order #${order.id}...`);
            
            // 2. Update status and payment status
            await Order.updateStatus(order.id, 'confirmed');
            await Order.updatePaymentStatus(order.id, 'paid');
            
            // 3. Mark associated products as sold
            // We need to get the order items for this order
            const fullOrder = await Order.getById(order.id);
            if (fullOrder && fullOrder.items) {
                for (const item of fullOrder.items) {
                    if (item.product_id) {
                        console.log(`   - Marking product #${item.product_id} as SOLD`);
                        await Product.markSold(item.product_id);
                    }
                }
            }
        }

        console.log('✅ Bulk update completed successfully!');
    } catch (err) {
        console.error('❌ Bulk update failed:', err.message);
    } finally {
        await pool.end();
    }
}

confirmAllOrders();
