require('dotenv').config();
const pool = require('./src/config/db');

function generateRandomCode(id) {
    // Generate a realistic, non-sequential 6-digit gaming UID
    // Using a seed-based shuffle algorithm to ensure high spread and realism (e.g. 784291, 914203)
    const base = 500000 + ((id * 179424673 + 38491) % 490000);
    return `PN-${Math.abs(base)}`;
}

async function migrateUserCodes() {
    try {
        console.log('Adding user_code column if not exists...');
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='user_code') THEN
                    ALTER TABLE users ADD COLUMN user_code VARCHAR(30) UNIQUE;
                END IF;
            END $$;
        `);

        const users = await pool.query('SELECT id, name, email, user_code FROM users ORDER BY id ASC');
        console.log(`Found ${users.rows.length} users. Assigning complicated gaming IDs...`);

        const usedCodes = new Set();
        for (const u of users.rows) {
            let code = generateRandomCode(u.id);
            // Ensure uniqueness
            while (usedCodes.has(code)) {
                code = `PN-${Math.floor(500000 + Math.random() * 490000)}`;
            }
            usedCodes.add(code);

            await pool.query('UPDATE users SET user_code = $1 WHERE id = $2', [code, u.id]);
            console.log(`User ID ${u.id} (${u.name}) => ${code}`);
        }

        const verify = await pool.query('SELECT id, name, email, user_code, is_vip, nova_coins FROM users ORDER BY id DESC');
        console.log('\n--- VERIFICATION RESULT ---');
        console.table(verify.rows);
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrateUserCodes();
