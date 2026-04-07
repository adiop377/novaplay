require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ff_marketplace',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function resetAdmin() {
    try {
        console.log('🔄 Connecting to database...');

        const email = 'admin@ffmarket.com';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if admin exists
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (res.rows.length > 0) {
            console.log('👤 Admin user exists. Updating password...');
            await pool.query(
                'UPDATE users SET password = $1, role = $2 WHERE email = $3',
                [hashedPassword, 'admin', email]
            );
            console.log('✅ Admin password updated to: admin123');
        } else {
            console.log('👤 Creating new admin user...');
            await pool.query(
                'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
                ['Admin', email, hashedPassword, 'admin']
            );
            console.log('✅ Admin user created with password: admin123');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

resetAdmin();
