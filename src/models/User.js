const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
    // Create new user
    async create(name, email, password, role = 'user') {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (name, email, password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, role, created_at
        `;
        const result = await pool.query(query, [name, email, hashedPassword, role]);
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
        const query = 'SELECT id, name, email, role, created_at FROM users WHERE id = $1';
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
            UPDATE users SET name = $1, email = $2
            WHERE id = $3
            RETURNING id, name, email, role
        `;
        const result = await pool.query(query, [name, email, id]);
        return result.rows[0];
    },

    // Update password
    async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const query = 'UPDATE users SET password = $1 WHERE id = $2';
        await pool.query(query, [hashedPassword, id]);
        return true;
    },

    // Get all users (admin)
    async getAll() {
        const query = 'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    }
};

module.exports = User;
