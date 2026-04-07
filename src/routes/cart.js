const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticated } = require('../middleware/auth');

// View cart
router.get('/', isAuthenticated, cartController.viewCart);

// Add to cart
router.post('/add/:productId', isAuthenticated, cartController.addToCart);
router.get('/add/:productId', isAuthenticated, cartController.addToCart);

// Remove from cart
router.post('/remove/:productId', isAuthenticated, cartController.removeFromCart);
router.get('/remove/:productId', isAuthenticated, cartController.removeFromCart);

// Clear cart
router.post('/clear', isAuthenticated, cartController.clearCart);

// Get cart count (API)
router.get('/api/count', cartController.getCartCount);

module.exports = router;
