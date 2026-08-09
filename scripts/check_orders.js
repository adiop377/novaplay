require('dotenv').config();
const pool = require('./src/config/db');

async function check() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'");
        console.log("Columns in 'orders':");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

check();
