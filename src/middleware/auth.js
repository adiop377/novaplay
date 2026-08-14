// Authentication Middleware

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json')) || req.path.includes('/apply-coins') || req.path.includes('/order') || req.path.includes('/payment')) {
        return res.status(401).json({ success: false, message: 'Please login to continue' });
    }
    req.flash('error', 'Please login to access this page');
    res.redirect('/login');
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    req.flash('error', 'Access denied. Admin only.');
    res.redirect('/');
};

// Check if user is NOT logged in (for login/register pages)
const isGuest = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect('/');
    }
    next();
};

const pool = require('../config/db');

// Add user to locals for all routes
const addUserToLocals = async (req, res, next) => {
    // Only pass the session data to locals, do not query DB on every single request
    // The session should be updated in the controllers when coins or VIP status changes.
    res.locals.user = req.session && req.session.user ? req.session.user : null;
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isGuest,
    addUserToLocals
};
