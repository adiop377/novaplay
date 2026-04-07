require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initRemote() {
    try {
        console.log('Reading schema.sql...');
        const schema = fs.readFileSync(path.join(__dirname, 'src/database/schema.sql'), 'utf-8');
        
        console.log('Executing base schema...');
        await pool.query(schema);
        
        console.log('Adding payment_id column...');
        await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255)');
        
        console.log('Fixing orders_status_check for reavailable...');
        await pool.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check');
        await pool.query("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled', 'reavailable'))");
        
        console.log('Adding session table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "session" (
              "sid" varchar NOT NULL COLLATE "default",
              "sess" json NOT NULL,
              "expire" timestamp(6) NOT NULL,
              CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
            );
            CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
        `);
        
        console.log('✅ Remote DB successfully initialized!');
    } catch(err) {
        console.error('❌ Failed:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

initRemote();
