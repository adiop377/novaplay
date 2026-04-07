require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_BL50dWwVCZzh@ep-orange-cell-a1nqg4em-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    ssl: { rejectUnauthorized: false }
});

async function resetAdmin() {
    try {
        const email = 'mail-adityasinha.1444@gmail.com';
        const rawPassword = 'adiop@37';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        console.log(`Attempting to reset admin: ${email}`);

        // Check if user exists
        const checkQuery = 'SELECT id FROM users WHERE email = $1';
        const userResult = await pool.query(checkQuery, [email]);

        if (userResult.rows.length > 0) {
            // Update existing user
            const updateQuery = 'UPDATE users SET password = $1, role = \'admin\' WHERE email = $2';
            await pool.query(updateQuery, [hashedPassword, email]);
            console.log('✅ Success: Admin password updated and role set to admin.');
        } else {
            // Create new admin user
            const insertQuery = `
                INSERT INTO users (name, email, password, role)
                VALUES ($1, $2, $3, $4)
            `;
            await pool.query(insertQuery, ['Aditya Sinha', email, hashedPassword, 'admin']);
            console.log('✅ Success: New admin user created.');
        }

    } catch (err) {
        console.error('❌ Error updating database:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

resetAdmin();
