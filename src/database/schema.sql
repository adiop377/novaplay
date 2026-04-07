-- FF Marketplace Database Schema
-- Run this in PostgreSQL to create all tables

-- Drop existing tables (for fresh setup)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table (FF IDs)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    rank VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    skins TEXT[], -- Array of skin names
    images TEXT[], -- Array of image URLs
    videos TEXT[], -- Array of video URLs
    tag VARCHAR(50),
    is_sold BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items Table
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    price DECIMAL(10, 2) NOT NULL,
    product_title VARCHAR(255) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_products_rank ON products(rank);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_is_sold ON products(is_sold);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (name, email, password, role) VALUES 
('Admin', 'admin@ffmarket.com', '$2a$10$8G5PqzDKNvDqZqQCFx5.Ru0xKpJxE8QVvJv0mMYY8TkxN5RJyFqKK', 'admin');

-- Insert sample products
INSERT INTO products (title, description, rank, level, price, skins, images, tag) VALUES 
('Grandmaster Pro | Level 78', 'Premium Grandmaster account with rare bundles and max level characters.', 'Grandmaster', 78, 12499, 
 ARRAY['Sakura Bundle', 'Hip Hop Bundle', 'M1014 Green Flame'], 
 ARRAY['/uploads/images/sample1.jpg'], 
 'RARE BUNDLE'),
 
('Master Elite | Level 72', 'High rank Master account with exclusive gun skins and emotes.', 'Master', 72, 8999, 
 ARRAY['AK Blue Flame', 'MP40 Cobra', 'Arctic Blue'], 
 ARRAY['/uploads/images/sample2.jpg'], 
 'EVO GUN MAX'),
 
('OG Legend | Season 1-5', 'Original OG account from Season 1 with all legacy items.', 'Diamond', 65, 15000, 
 ARRAY['S1 Jacket', 'Criminal Bundle', 'Angelical Pant'], 
 ARRAY['/uploads/images/sample3.jpg'], 
 'LEGACY ID');

SELECT 'Database setup complete!' AS status;
