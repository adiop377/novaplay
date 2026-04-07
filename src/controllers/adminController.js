const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const TopupPackage = require('../models/TopupPackage');
const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../middleware/upload');

const adminController = {
    // Dashboard
    dashboard: async (req, res) => {
        try {
            const productStats = await Product.getStats();
            const orderStats = await Order.getStats();

            res.render('admin/dashboard', {
                title: 'Admin Dashboard - PlayNova',
                layout: 'layouts/admin',
                productStats,
                orderStats
            });

        } catch (error) {
            console.error('Admin dashboard error:', error);
            req.flash('error', 'Could not load dashboard');
            res.redirect('/');
        }
    },

    // List all products
    listProducts: async (req, res) => {
        try {
            const products = await Product.getAllAdmin();

            res.render('admin/products', {
                title: 'Manage Products - PlayNova',
                layout: 'layouts/admin',
                products
            });

        } catch (error) {
            console.error('Admin list products error:', error);
            req.flash('error', 'Could not load products');
            res.redirect('/admin');
        }
    },

    // Show create product form
    createProductForm: (req, res) => {
        res.render('admin/product-form', {
            title: 'Add New Product - PlayNova',
            layout: 'layouts/admin',
            product: null,
            isEdit: false
        });
    },

    // Create product
    createProduct: async (req, res) => {
        try {
            const { title, description, rank, level, price, tag, discount, cover_image } = req.body;
            let skins = req.body.skins || [];

            // Handle skins as comma separated string
            if (typeof skins === 'string') {
                skins = skins.split(',').map(s => s.trim()).filter(s => s);
            }

            // Process uploaded files
            const images = [];
            const videos = [];

            if (req.files) {
                if (req.files.images) {
                    req.files.images.forEach(file => {
                        images.push(file.path);
                    });
                }
                if (req.files.videos) {
                    req.files.videos.forEach(file => {
                        videos.push(file.path);
                    });
                }
            }

            // Handle client-side pre-uploaded files
            if (req.body.uploadedImages) {
                const preImages = Array.isArray(req.body.uploadedImages) ? req.body.uploadedImages : [req.body.uploadedImages];
                preImages.forEach(url => images.push(url));
            }
            if (req.body.uploadedVideos) {
                const preVideos = Array.isArray(req.body.uploadedVideos) ? req.body.uploadedVideos : [req.body.uploadedVideos];
                preVideos.forEach(url => videos.push(url));
            }

            await Product.create({
                title,
                description,
                rank,
                level: parseInt(level),
                price: parseFloat(price),
                skins,
                images,
                videos,
                tag,
                discount: parseInt(discount) || 0,
                cover_image: cover_image || ''
            });

            req.flash('success', 'Product created successfully!');
            res.redirect('/admin/products');

        } catch (error) {
            console.error('Create product error:', error);
            req.flash('error', 'Could not create product');
            res.redirect('/admin/products/new');
        }
    },

    // Show edit product form
    editProductForm: async (req, res) => {
        try {
            const product = await Product.getById(req.params.id);

            if (!product) {
                req.flash('error', 'Product not found');
                return res.redirect('/admin/products');
            }

            res.render('admin/product-form', {
                title: 'Edit Product - PlayNova',
                layout: 'layouts/admin',
                product,
                isEdit: true
            });

        } catch (error) {
            console.error('Edit product form error:', error);
            req.flash('error', 'Could not load product');
            res.redirect('/admin/products');
        }
    },

    // Update product
    updateProduct: async (req, res) => {
        try {
            const productId = req.params.id;
            const { title, description, rank, level, price, tag, discount, cover_image } = req.body;
            let skins = req.body.skins || [];

            if (typeof skins === 'string') {
                skins = skins.split(',').map(s => s.trim()).filter(s => s);
            }

            // Get existing product for images/videos
            const existingProduct = await Product.getById(productId);
            let images = existingProduct.images || [];
            let videos = existingProduct.videos || [];

            // Add new uploads
            if (req.files) {
                if (req.files.images) {
                    req.files.images.forEach(file => {
                        images.push(file.path);
                    });
                }
                if (req.files.videos) {
                    req.files.videos.forEach(file => {
                        videos.push(file.path);
                    });
                }
            }

            // Add new client-side pre-uploaded files
            if (req.body.uploadedImages) {
                const preImages = Array.isArray(req.body.uploadedImages) ? req.body.uploadedImages : [req.body.uploadedImages];
                preImages.forEach(url => images.push(url));
            }
            if (req.body.uploadedVideos) {
                const preVideos = Array.isArray(req.body.uploadedVideos) ? req.body.uploadedVideos : [req.body.uploadedVideos];
                preVideos.forEach(url => videos.push(url));
            }

            await Product.update(productId, {
                title,
                description,
                rank,
                level: parseInt(level),
                price: parseFloat(price),
                skins,
                images,
                videos,
                tag,
                discount: parseInt(discount) || 0,
                cover_image: cover_image || ''
            });

            req.flash('success', 'Product updated successfully!');
            res.redirect('/admin/products');

        } catch (error) {
            console.error('Update product error:', error);
            req.flash('error', 'Could not update product');
            res.redirect('/admin/products/' + req.params.id + '/edit');
        }
    },

    // Delete product
    deleteProduct: async (req, res) => {
        try {
            const product = await Product.getById(req.params.id);

            if (product) {
                // In Vercel serverless we use Cloudinary, so local unlinking is disabled.
                // Cloudinary cleanup can be done via API if needed in the future.
                /*
                if (product.images) { ... }
                */

                await Product.delete(req.params.id);
            }

            req.flash('success', 'Product deleted successfully');
            res.redirect('/admin/products');

        } catch (error) {
            console.error('Delete product error:', error);
            req.flash('error', 'Could not delete product');
            res.redirect('/admin/products');
        }
    },

    // Get signature for Cloudinary client-side uploads
    getCloudinarySignature: async (req, res) => {
        try {
            const timestamp = Math.round(new Date().getTime() / 1000);
            const folder = req.query.folder || 'ff_marketplace';
            
            const paramsToSign = {
                timestamp: timestamp,
                folder: folder
            };

            const signature = cloudinary.utils.api_sign_request(
                paramsToSign,
                process.env.CLOUDINARY_API_SECRET
            );

            res.json({
                signature,
                timestamp,
                apiKey: process.env.CLOUDINARY_API_KEY,
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                folder: folder
            });
        } catch (error) {
            console.error('Cloudinary signature error:', error);
            res.status(500).json({ error: 'Failed to generate signature' });
        }
    },

    // List orders
    listOrders: async (req, res) => {
        try {
            const orders = await Order.getAll();

            res.render('admin/orders', {
                title: 'Manage Orders - PlayNova',
                layout: 'layouts/admin',
                orders
            });

        } catch (error) {
            console.error('Admin list orders error:', error);
            req.flash('error', 'Could not load orders');
            res.redirect('/admin');
        }
    },

    // Update order status
    updateOrderStatus: async (req, res) => {
        try {
            const { status, paymentStatus } = req.body;
            const orderId = req.params.id;

            const order = await Order.getById(orderId);

            if (status) {
                await Order.updateStatus(orderId, status);
            }
            if (paymentStatus) {
                await Order.updatePaymentStatus(orderId, paymentStatus);
            }

            // Handle availability based on payment status changes
            if (paymentStatus === 'paid' && order.payment_status !== 'paid') {
                // If payment confirmed as paid, mark as sold out
                for (let item of order.items) {
                    await Product.markSold(item.product_id);
                }
            } else if (status === 'cancelled' || status === 'reavailable' || paymentStatus === 'failed') {
                // Return availability if cancelled, failed, or reavailable
                for (let item of order.items) {
                    await Product.markAvailable(item.product_id);
                }
            } else if ((status && status !== 'cancelled' && status !== 'reavailable' && (order.status === 'cancelled' || order.status === 'reavailable')) || 
                       (paymentStatus && paymentStatus !== 'failed' && paymentStatus !== 'paid' && order.payment_status === 'failed')) {
                // If order restored to pending and wasn't paid, we ensure it's available
                for (let item of order.items) {
                    await Product.markAvailable(item.product_id);
                }
            }

            req.flash('success', 'Order updated successfully');
            res.redirect('/admin/orders');

        } catch (error) {
            console.error('Update order status error:', error);
            req.flash('error', 'Could not update order');
            res.redirect('/admin/orders');
        }
    },

    // List topup packages
    listTopups: async (req, res) => {
        try {
            const packages = await TopupPackage.getAll();
            res.render('admin/topups', {
                title: 'Manage Topups - PlayNova',
                layout: 'layouts/admin',
                packages
            });
        } catch (error) {
            console.error('List topups error:', error);
            res.redirect('/admin');
        }
    },

    // Create topup package
    createTopup: async (req, res) => {
        try {
            const { amount, bonus, price, discount } = req.body;
            let image_url = req.body.image_url || '/images/topup/520.png';

            // If a file was uploaded, use its path (Cloudinary URL)
            if (req.file) {
                image_url = req.file.path;
            }

            await TopupPackage.create({
                amount: parseInt(amount),
                bonus: parseInt(bonus) || 0,
                price: parseFloat(price),
                image_url: image_url,
                discount: parseInt(discount) || 0
            });
            req.flash('success', 'Topup package added!');
            res.redirect('/admin/topups');
        } catch (error) {
            console.error('Create topup error:', error);
            req.flash('error', 'Could not create package');
            res.redirect('/admin/topups');
        }
    },

    // Update topup package
    updateTopup: async (req, res) => {
        try {
            const { amount, bonus, price, discount } = req.body;
            const packageId = req.params.id;

            // Get existing package to keep current image if no new one is uploaded
            const existingPackage = await TopupPackage.getById(packageId);
            let image_url = existingPackage.image_url;

            // If a new file was uploaded, update the image URL
            if (req.file) {
                image_url = req.file.path;
            }

            await TopupPackage.update(packageId, {
                amount: parseInt(amount),
                bonus: parseInt(bonus) || 0,
                price: parseFloat(price),
                image_url: image_url,
                discount: parseInt(discount) || 0
            });

            req.flash('success', 'Package updated successfully!');
            res.redirect('/admin/topups');
        } catch (error) {
            console.error('Update topup error:', error);
            req.flash('error', 'Could not update package');
            res.redirect('/admin/topups');
        }
    },

    // Delete topup package
    deleteTopup: async (req, res) => {
        try {
            await TopupPackage.delete(req.params.id);
            req.flash('success', 'Package deleted');
            res.redirect('/admin/topups');
        } catch (error) {
            console.error('Delete topup error:', error);
            res.redirect('/admin/topups');
        }
    }
};

module.exports = adminController;
