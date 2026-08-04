const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const topupController = require('../controllers/topupController');
const { isAuthenticated } = require('../middleware/auth');

// Home page - Products listing
router.get('/', productController.getAllProducts);
router.get('/sold', (req, res) => res.redirect('/'));
router.get('/topup', (req, res) => {
    res.render('pages/topup', { title: 'Free Fire Diamond Topup', filters: {} });
});

// Topup Order creation
router.post('/topup/order', topupController.createOrder);

// Policy Pages
router.get('/terms', (req, res) => {
    res.render('pages/terms', { title: 'Terms of Service' });
});

router.get('/privacy', (req, res) => {
    res.render('pages/privacy', { title: 'Privacy Policy' });
});

router.get('/refund', (req, res) => {
    res.render('pages/refund', { title: 'Refund Policy' });
});

module.exports = router;
