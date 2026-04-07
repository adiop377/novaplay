require('dotenv').config();
const pool = require('./src/config/db');

async function fix() {
    try {
        await pool.query("ALTER TABLE orders DROP CONSTRAINT orders_status_check;");
        await pool.query("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled', 'reavailable'));");
        console.log(`Constraint updated!`);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
fix();
