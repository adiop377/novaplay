const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticated } = require('../middleware/auth');

// Checkout
router.post('/checkout', isAuthenticated, orderController.checkout);
router.get('/checkout', isAuthenticated, orderController.checkout);

// View orders
router.get('/', isAuthenticated, orderController.viewOrders);

// View single order
router.get('/:id', isAuthenticated, orderController.viewOrder);

module.exports = router;
