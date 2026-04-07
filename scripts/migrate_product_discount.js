require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool(process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
} : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ff_marketplace'
});

async function migrate() {
    try {
        console.log('🔄 Adding discount column to products...');
        await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0');
        console.log('✅ Column discount added successfully to products!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
