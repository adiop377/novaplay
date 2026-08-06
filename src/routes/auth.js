const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, isGuest } = require('../middleware/auth');
const passport = require('passport');

// Register
router.get('/register', isGuest, authController.showRegisterPage);
router.post('/register', isGuest, authController.register);

// OTP Verification
router.get('/verify-otp', isGuest, authController.showVerifyOtp);
router.post('/verify-otp', isGuest, authController.verifyOtp);
router.post('/resend-otp', isGuest, authController.resendOtp);

// Login
router.get('/login', isGuest, authController.showLoginPage);
router.post('/login', isGuest, authController.login);

// Google OAuth Routes
router.get('/auth/google', isGuest, passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
    function(req, res) {
        // Successful authentication, set up user session
        if (req.user) {
            req.session.user = {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                is_vip: Boolean(req.user.is_vip),
                nova_coins: req.user.nova_coins !== undefined ? req.user.nova_coins : 0,
                user_code: req.user.user_code
            };
            req.flash('success', 'Successfully logged in with Google!');
            res.redirect('/');
        } else {
            req.flash('error', 'Google Authentication failed.');
            res.redirect('/login');
        }
    }
);

// Logout
router.get('/logout', authController.logout);

// Profile (protected)
router.get('/profile', isAuthenticated, authController.showProfile);
router.post('/profile', isAuthenticated, authController.updateProfile);
router.post('/profile/password', isAuthenticated, authController.updatePassword);
router.post('/vip/upgrade', isAuthenticated, authController.upgradeVip);
router.post('/user/redeem-coupon', isAuthenticated, authController.redeemCoupon);

module.exports = router;
