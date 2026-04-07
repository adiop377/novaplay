const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');
const { uploadProductMedia, uploadSingle } = require('../middleware/upload');

// Wrapper for upload middleware to handle errors
const handleUpload = (req, res, next) => {
    uploadProductMedia(req, res, (err) => {
        if (err) {
            console.error('Upload Error:', err);
            // Handle Multer specific errors
            if (err.code === 'LIMIT_FILE_SIZE') {
                req.flash('error', 'File too large! Max size is 5GB for videos and 500MB for images.');
            } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                req.flash('error', 'Too many files or invalid file type!');
            } else {
                req.flash('error', 'Error uploading files: ' + err.message);
            }
            return res.redirect('back');
        }
        next();
    });
};

// All admin routes require admin role
router.use(isAdmin);

// Dashboard
router.get('/', adminController.dashboard);

// Products management
router.get('/products', adminController.listProducts);
router.get('/products/new', adminController.createProductForm);
router.post('/products', handleUpload, adminController.createProduct);
router.get('/products/:id/edit', adminController.editProductForm);
router.post('/products/:id', handleUpload, adminController.updateProduct);
router.post('/products/:id/delete', adminController.deleteProduct);

// Cloudinary Signature for client-side uploads
router.get('/cloudinary-sign', adminController.getCloudinarySignature);

// Orders management
router.get('/orders', adminController.listOrders);
router.post('/orders/:id/status', adminController.updateOrderStatus);

// Topup management
router.get('/topups', adminController.listTopups);
router.post('/topups', uploadSingle, adminController.createTopup);
router.post('/topups/:id', uploadSingle, adminController.updateTopup);
router.post('/topups/:id/delete', adminController.deleteTopup);

module.exports = router;
