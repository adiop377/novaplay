const pool = require('../config/db');

const TopupPackage = {
    // Get all topup packages
    async getAll() {
        const query = 'SELECT * FROM topup_packages ORDER BY price ASC';
        const result = await pool.query(query);
        return result.rows;
    },

    // Get package by ID
    async getById(id) {
        const query = 'SELECT * FROM topup_packages WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // Create new topup package
    async create(data) {
        const query = `
            INSERT INTO topup_packages (amount, bonus, price, image_url, discount)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const params = [
            data.amount,
            data.bonus || 0,
            data.price,
            data.image_url || '/images/topup/520.png',
            data.discount || 0
        ];
        const result = await pool.query(query, params);
        return result.rows[0];
    },

    // Update topup package
    async update(id, data) {
        const query = `
            UPDATE topup_packages SET
                amount = $1,
                bonus = $2,
                price = $3,
                image_url = $4,
                discount = $5
            WHERE id = $6
            RETURNING *
        `;
        const params = [
            data.amount,
            data.bonus || 0,
            data.price,
            data.image_url,
            data.discount || 0,
            id
        ];
        const result = await pool.query(query, params);
        return result.rows[0];
    },

    // Delete topup package
    async delete(id) {
        const query = 'DELETE FROM topup_packages WHERE id = $1';
        await pool.query(query, [id]);
        return true;
    }
};

module.exports = TopupPackage;
