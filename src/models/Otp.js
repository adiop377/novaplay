const pool = require('../config/db');

// Ensure otps table exists
pool.query(`
    CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        attempts INTEGER DEFAULT 0
    );
`).catch(err => console.log('otps table check:', err.message));

const Otp = {
    // Create or update OTP for an email
    async upsert(email, name, passwordHash, otpHash) {
        // Expire in 10 minutes
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        // Delete any existing OTP for this email to prevent duplicates/spam
        await pool.query('DELETE FROM otps WHERE email = $1', [email]);
        
        const query = `
            INSERT INTO otps (email, name, password_hash, otp_hash, expires_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await pool.query(query, [email, name, passwordHash, otpHash, expiresAt]);
        return result.rows[0];
    },

    // Get OTP record by email
    async findByEmail(email) {
        const query = 'SELECT * FROM otps WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    },

    // Increment attempt count
    async incrementAttempts(email) {
        const query = `
            UPDATE otps 
            SET attempts = attempts + 1 
            WHERE email = $1 
            RETURNING attempts
        `;
        const result = await pool.query(query, [email]);
        return result.rows[0];
    },

    // Delete OTP record (after success)
    async deleteByEmail(email) {
        const query = 'DELETE FROM otps WHERE email = $1';
        await pool.query(query, [email]);
        return true;
    },

    // Delete expired OTPs (cleanup)
    async deleteExpired() {
        const query = 'DELETE FROM otps WHERE expires_at < NOW()';
        await pool.query(query);
    }
};

module.exports = Otp;
