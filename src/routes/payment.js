const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/checkout/:orderId', isAuthenticated, paymentController.checkoutPage);
router.post('/apply-coins/:orderId', isAuthenticated, paymentController.applyCoinsToOrder);
router.post('/create-razorpay-order', isAuthenticated, paymentController.createRazorpayOrder);
router.post('/verify', isAuthenticated, paymentController.verifyPayment);
router.get('/thank-you/:orderId', isAuthenticated, paymentController.thankYouPage);

module.exports = router;
