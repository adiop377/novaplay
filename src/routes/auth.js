const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, isGuest } = require('../middleware/auth');

// Register
router.get('/register', isGuest, authController.showRegisterPage);
router.post('/register', isGuest, authController.register);

// Login
router.get('/login', isGuest, authController.showLoginPage);
router.post('/login', isGuest, authController.login);

// Logout
router.get('/logout', authController.logout);

// Profile (protected)
router.get('/profile', isAuthenticated, authController.showProfile);
router.post('/profile', isAuthenticated, authController.updateProfile);
router.post('/profile/password', isAuthenticated, authController.updatePassword);

module.exports = router;
