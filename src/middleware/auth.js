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
    if (req.session && req.session.user) {
        try {
            const result = await pool.query(
                'SELECT id, name, email, role, is_vip, COALESCE(nova_coins, 0) as nova_coins, user_code FROM users WHERE id = $1',
                [req.session.user.id]
            );
            if (result.rows.length > 0) {
                const freshData = result.rows[0];
                // Sync all important fields from DB into session
                req.session.user.is_vip     = freshData.is_vip;
                req.session.user.nova_coins = freshData.nova_coins;
                req.session.user.user_code  = freshData.user_code;
                req.session.user.name       = freshData.name;
                req.session.user.email      = freshData.email;
                req.session.user.role       = freshData.role;
                // Persist session so next request has fresh data
                req.session.save(() => {});
            }
        } catch (e) {
            // ignore DB sync error silently
        }
    }
    res.locals.user = req.session.user || null;
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isGuest,
    addUserToLocals
};
