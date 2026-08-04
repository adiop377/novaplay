const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Ensure is_vip, nova_coins, and user_code columns exist
pool.query(`
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_vip') THEN
            ALTER TABLE users ADD COLUMN is_vip BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='nova_coins') THEN
            ALTER TABLE users ADD COLUMN nova_coins INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='user_code') THEN
            ALTER TABLE users ADD COLUMN user_code VARCHAR(30) UNIQUE;
        END IF;
    END $$;
`).catch(err => console.log('column check:', err.message));

const User = {
    // Create new user
    async create(name, email, password, role = 'user') {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userCode = `PN-${Math.floor(500000 + Math.random() * 490000)}`;
        const query = `
            INSERT INTO users (name, email, password, role, is_vip, nova_coins, user_code)
            VALUES ($1, $2, $3, $4, FALSE, 0, $5)
            RETURNING id, name, email, role, is_vip, nova_coins, user_code, created_at
        `;
        const result = await pool.query(query, [name, email, hashedPassword, role, userCode]);
        return result.rows[0];
    },

    // Find user by email
    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    },

    // Find user by ID
    async findById(id) {
        const query = 'SELECT id, name, email, role, is_vip, COALESCE(nova_coins, 0) AS nova_coins, user_code, created_at FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // Verify password
    async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    },

    // Update profile
    async updateProfile(id, name, email) {
        const query = `
            UPDATE users 
            SET name = $1, email = $2 
            WHERE id = $3 
            RETURNING id, name, email, role, is_vip, nova_coins, user_code, created_at
        `;
        const result = await pool.query(query, [name, email, id]);
        return result.rows[0];
    },

    // Upgrade to VIP
    async upgradeToVip(id) {
        const query = `
            UPDATE users SET is_vip = TRUE
            WHERE id = $1
            RETURNING id, name, email, role, is_vip, COALESCE(nova_coins, 0) AS nova_coins, user_code
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // Add Nova Coins (Cashback / Reward)
    async addNovaCoins(id, amount = 125) {
        const query = `
            UPDATE users 
            SET nova_coins = COALESCE(nova_coins, 0) + $1
            WHERE id = $2
            RETURNING id, name, email, is_vip, nova_coins, user_code
        `;
        const result = await pool.query(query, [parseInt(amount) || 0, id]);
        return result.rows[0];
    },

    // Deduct Nova Coins (Discount used)
    async deductNovaCoins(id, amount) {
        const query = `
            UPDATE users 
            SET nova_coins = GREATEST(0, COALESCE(nova_coins, 0) - $1)
            WHERE id = $2
            RETURNING id, name, email, is_vip, nova_coins, user_code
        `;
        const result = await pool.query(query, [parseInt(amount) || 0, id]);
        return result.rows[0];
    },

    // Update password
    async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const query = 'UPDATE users SET password = $1 WHERE id = $2';
        await pool.query(query, [hashedPassword, id]);
        return true;
    },

    // Set exact Nova Coins
    async setNovaCoins(id, amount) {
        const query = `
            UPDATE users 
            SET nova_coins = GREATEST(0, $1)
            WHERE id = $2
            RETURNING id, name, email, is_vip, nova_coins, user_code
        `;
        const result = await pool.query(query, [parseInt(amount) || 0, id]);
        return result.rows[0];
    },

    // Toggle VIP Status
    async toggleVip(id) {
        const query = `
            UPDATE users 
            SET is_vip = NOT COALESCE(is_vip, FALSE)
            WHERE id = $1
            RETURNING id, name, email, is_vip, nova_coins, user_code
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // Find user by search term (User Code PN-828586, numeric ID, name, email)
    async findByIdOrSearch(term) {
        if (!term) return [];
        let cleanTerm = term.toString().trim();
        let numericId = null;

        // Clean any leading #
        const noHash = cleanTerm.replace(/^#/, '').trim();
        const pnPrefixed = noHash.toUpperCase().startsWith('PN-') ? noHash.toUpperCase() : `PN-${noHash}`;

        if (/^\d+$/.test(noHash)) {
            numericId = parseInt(noHash);
            // Support legacy 10000+ offset search if entered
            if (numericId >= 10000 && numericId < 500000) {
                numericId = numericId - 10000;
            }
        } else if (noHash.toUpperCase().startsWith('PN-')) {
            const rawDigits = parseInt(noHash.replace(/[^0-9]/g, ''));
            if (rawDigits >= 10000 && rawDigits < 500000) {
                numericId = rawDigits - 10000;
            }
        }

        const query = `
            SELECT id, name, email, role, is_vip, COALESCE(nova_coins, 0) AS nova_coins, user_code, created_at 
            FROM users 
            WHERE LOWER(user_code) = LOWER($1) 
               OR LOWER(user_code) = LOWER($2)
               OR id = $3
               OR LOWER(email) = LOWER($4) 
               OR LOWER(name) = LOWER($4)
               OR user_code ILIKE $5
               OR LOWER(email) ILIKE $6
               OR LOWER(name) ILIKE $7
            ORDER BY 
                CASE 
                    WHEN LOWER(user_code) = LOWER($1) THEN 1
                    WHEN LOWER(user_code) = LOWER($2) THEN 2
                    WHEN id = $3 THEN 3
                    WHEN LOWER(email) = LOWER($4) THEN 4
                    WHEN LOWER(name) = LOWER($4) THEN 5
                    WHEN user_code ILIKE $5 THEN 6
                    ELSE 7
                END ASC,
                id ASC
            LIMIT 15
        `;
        const result = await pool.query(query, [
            noHash,
            pnPrefixed,
            numericId || 0,
            cleanTerm,
            `%${noHash}%`,
            `%${cleanTerm}%`,
            `%${cleanTerm}%`
        ]);
        return result.rows;
    },

    // Get all users (admin)
    async getAll() {
        const query = 'SELECT id, name, email, role, is_vip, COALESCE(nova_coins, 0) AS nova_coins, user_code, created_at FROM users ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    }
};

module.exports = User;


