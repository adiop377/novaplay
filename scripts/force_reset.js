require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// PRODUCTION DB URL FROM .ENV
const prodUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_BL50dWwVCZzh@ep-orange-cell-a1nqg4em-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
    connectionString: prodUrl,
    ssl: { rejectUnauthorized: false }
});

async function verifyAndReset() {
    try {
        const email = 'mail-adityasinha.1444@gmail.com';
        const rawPassword = 'adiop@37';
        
        console.log('--- DB CONNECTION TEST ---');
        const test = await pool.query('SELECT NOW()');
        console.log('DB Time:', test.rows[0].now);

        // 1. Delete user if exists to be 100% clean
        await pool.query('DELETE FROM users WHERE email = $1', [email]);
        console.log('Cleaned existing user if any.');

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 3. Insert fresh admin
        const query = `
            INSERT INTO users (name, email, password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, role
        `;
        const result = await pool.query(query, ['Aditya Sinha', email, hashedPassword, 'admin']);
        
        console.log('--- SUCCESS ---');
        console.log('User Created ID:', result.rows[0].id);
        console.log('Assigned Role:', result.rows[0].role);
        console.log('Login with:', email, '/', rawPassword);

    } catch (err) {
        console.error('❌ DB ERROR:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

verifyAndReset();
