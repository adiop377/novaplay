require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_BL50dWwVCZzh@ep-orange-cell-a1nqg4em-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    ssl: { rejectUnauthorized: false }
});

async function getUsers() {
    try {
        console.log('Fetching users from production database...');
        const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
        
        if (result.rows.length === 0) {
            console.log('No users found in database.');
        } else {
            console.log('--- USER LIST ---');
            result.rows.forEach(user => {
                console.log(`[${user.id}] Name: ${user.name} | Email: ${user.email} | Role: ${user.role} | Joined: ${user.created_at}`);
            });
            console.log('-----------------');
        }
    } catch (err) {
        console.error('❌ Error fetching users:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

getUsers();
