const pool = require('../config/db');

let statsCache = null;
let statsCacheTime = null;

const Product = {
    // Get all products with optional filters
    async getAll(filters = {}) {
        let query = `
            SELECT * FROM products 
            WHERE is_sold = false
        `;
        const params = [];
        let paramCount = 0;

        // Search filter
        if (filters.search) {
            paramCount++;
            query += ` AND (LOWER(title) LIKE $${paramCount} OR LOWER(rank) LIKE $${paramCount})`;
            params.push(`%${filters.search.toLowerCase()}%`);
        }

        // Rank filter
        if (filters.rank && filters.rank !== 'all') {
            paramCount++;
            query += ` AND rank = $${paramCount}`;
            params.push(filters.rank);
        }

        // Max price filter
        if (filters.maxPrice) {
            paramCount++;
            query += ` AND price <= $${paramCount}`;
            params.push(filters.maxPrice);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        return result.rows;
    },

    // Get sold products
    async getSoldProducts() {
        const query = `
            SELECT * FROM products 
            WHERE is_sold = true 
            ORDER BY updated_at DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    // Get all products including sold (admin)
    async getAllAdmin() {
        const query = 'SELECT * FROM products ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    },

    // Get product by ID
    async getById(id) {
        const query = 'SELECT * FROM products WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // Create new product
    async create(data) {
        const query = `
            INSERT INTO products (title, description, rank, level, price, skins, images, videos, tag, discount, cover_image)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;
        const params = [
            data.title,
            data.description || '',
            data.rank,
            data.level,
            data.price,
            data.skins || [],
            data.images || [],
            data.videos || [],
            data.tag || '',
            data.discount || 0,
            data.cover_image || ''
        ];
        const result = await pool.query(query, params);
        return result.rows[0];
    },

    // Update product
    async update(id, data) {
        const query = `
            UPDATE products SET
                title = $1,
                description = $2,
                rank = $3,
                level = $4,
                price = $5,
                skins = $6,
                images = $7,
                videos = $8,
                tag = $9,
                discount = $10,
                cover_image = $11,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $12
            RETURNING *
        `;
        const params = [
            data.title,
            data.description || '',
            data.rank,
            data.level,
            data.price,
            data.skins || [],
            data.images || [],
            data.videos || [],
            data.tag || '',
            data.discount || 0,
            data.cover_image || '',
            id
        ];
        const result = await pool.query(query, params);
        return result.rows[0];
    },

    // Mark as sold
    async markSold(id) {
        const query = 'UPDATE products SET is_sold = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
        await pool.query(query, [id]);
        return true;
    },

    // Mark as available
    async markAvailable(id) {
        const query = 'UPDATE products SET is_sold = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
        await pool.query(query, [id]);
        return true;
    },

    // Delete product
    async delete(id) {
        const query = 'DELETE FROM products WHERE id = $1';
        await pool.query(query, [id]);
        return true;
    },

    // Get stats for admin dashboard
    async getStats() {
        if (statsCache && statsCacheTime && (Date.now() - statsCacheTime < 60000)) {
            return statsCache;
        }

        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_products,
                COUNT(*) FILTER (WHERE is_sold = true) as sold_products,
                COALESCE(SUM(price) FILTER (WHERE is_sold = false), 0) as available_value
            FROM products
        `);
        
        statsCache = result.rows[0];
        statsCacheTime = Date.now();
        return statsCache;
    }
};

module.exports = Product;
