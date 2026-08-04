require('dotenv').config();
const pool = require('./src/config/db');

async function resetAll() {
    try {
        // Set all users' nova_coins to 0
        await pool.query('UPDATE users SET nova_coins = 0 WHERE id != 15');
        // Ensure user 15 has 5000
        await pool.query('UPDATE users SET nova_coins = 5000 WHERE id = 15');
        
        const res = await pool.query('SELECT id, name, email, is_vip, nova_coins FROM users ORDER BY id DESC');
        console.log('Users after reset:', res.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error resetting coins:', err);
        process.exit(1);
    }
}

resetAll();
