// Authentication Middleware

// Check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
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

// Add user to locals for all routes
const addUserToLocals = (req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isGuest,
    addUserToLocals
};
