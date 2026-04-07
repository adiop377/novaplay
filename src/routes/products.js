const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Get single product
router.get('/:id', productController.getProductById);

// API: Get products as JSON
router.get('/api/list', productController.getProductsAPI);

module.exports = router;
