const Product = require('../models/Product');
const Order = require('../models/Order');

const productController = {
    // List all products with filters
    getAllProducts: async (req, res) => {
        try {
            const filters = {
                search: req.query.search || '',
                rank: req.query.rank || 'all',
                maxPrice: (req.query.maxPrice && !isNaN(parseInt(req.query.maxPrice))) ? parseInt(req.query.maxPrice) : null
            };

            const products = await Product.getAll(filters);

            res.render('pages/home', {
                title: 'PlayNova - Buy Verified Free Fire IDs',
                layout: 'layouts/main',
                products: products,
                filters: filters
            });

        } catch (error) {
            console.error('Get products error:', error);
            res.status(500).send("Critial Database Error: " + error.message + " Stack: " + error.stack);
        }
    },

    // Get single product
    getProductById: async (req, res) => {
        try {
            const product = await Product.getById(req.params.id);

            if (!product) {
                req.flash('error', 'Product not found');
                return res.redirect('/');
            }

            res.render('pages/product', {
                title: product.title + ' - PlayNova',
                layout: 'layouts/main',
                product: product
            });

        } catch (error) {
            console.error('Get product error:', error);
            req.flash('error', 'Could not load product');
            res.redirect('/');
        }
    },

    // Show sold products
    showSoldProducts: async (req, res) => {
        try {
            const soldIds = await Product.getSoldProducts();
            const confirmedTopups = await Order.getConfirmedTopups();
            
            // Normalize and combine data
            const combinedHistory = [
                ...soldIds.map(p => ({ ...p, type: 'id' })),
                ...confirmedTopups.map(o => ({ 
                    id: o.id,
                    title: o.packages[0].title,
                    price: o.total,
                    type: 'topup',
                    updated_at: o.updated_at,
                    player_id: o.player_id
                }))
            ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

            res.render('pages/sold', {
                title: 'Sold Out History - PlayNova',
                layout: 'layouts/main',
                history: combinedHistory
            });
        } catch (error) {
            console.error('Sold history error:', error);
            req.flash('error', 'Could not load sold history');
            res.redirect('/');
        }
    },

    // API: Get products as JSON
    getProductsAPI: async (req, res) => {
        try {
            const filters = {
                search: req.query.search || '',
                rank: req.query.rank || 'all',
                maxPrice: (req.query.maxPrice && !isNaN(parseInt(req.query.maxPrice))) ? parseInt(req.query.maxPrice) : null
            };

            const products = await Product.getAll(filters);
            res.json({ success: true, products });

        } catch (error) {
            console.error('API get products error:', error);
            res.status(500).json({ success: false, error: 'Could not load products' });
        }
    }
};

module.exports = productController;
