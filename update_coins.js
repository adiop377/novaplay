require('dotenv').config();
const pool = require('./src/config/db');

async function updateCoins() {
    try {
        console.log('Searching for users...');
        const res = await pool.query("SELECT id, name, email, role, is_vip, nova_coins FROM users WHERE LOWER(name) LIKE '%adi%' OR id = 15 OR id = 1");
        console.log('Matching users:', res.rows);

        // Update all users matching ADI or update users to 5000 coins
        const updateRes = await pool.query(`
            UPDATE users 
            SET nova_coins = 5000 
            WHERE LOWER(name) LIKE '%adi%' OR id = 15 OR id = 1
            RETURNING id, name, email, nova_coins, is_vip
        `);
        console.log('Updated users:', updateRes.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error updating coins:', err);
        process.exit(1);
    }
}

updateCoins();
