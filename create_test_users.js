require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_BL50dWwVCZzh@ep-orange-cell-a1nqg4em-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    ssl: { rejectUnauthorized: false }
});

async function createCredentials() {
    try {
        console.log('--- CREATING NEW CREDENTIALS ---');

        // 1. FRESH ADMIN
        const adminEmail = 'new-admin@gmail.com';
        const adminPass = 'admin-final-37';
        const hashedAdmin = await bcrypt.hash(adminPass, 10);
        
        await pool.query('DELETE FROM users WHERE email = $1', [adminEmail]);
        await pool.query(`
            INSERT INTO users (name, email, password, role)
            VALUES ($1, $2, $3, $4)
        `, ['Super Admin', adminEmail, hashedAdmin, 'admin']);

        // 2. FRESH USER
        const userEmail = 'new-user@gmail.com';
        const userPass = 'user-test-37';
        const hashedUser = await bcrypt.hash(userPass, 10);

        await pool.query('DELETE FROM users WHERE email = $1', [userEmail]);
        await pool.query(`
            INSERT INTO users (name, email, password, role)
            VALUES ($1, $2, $3, $4)
        `, ['Test User', userEmail, hashedUser, 'user']);

        console.log('--- ✅ SUCCESS ---');
        console.log(`Admin ID: ${adminEmail} | Pass: ${adminPass}`);
        console.log(`User ID: ${userEmail} | Pass: ${userPass}`);

    } catch (err) {
        console.error('❌ DB ERROR:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

createCredentials();
