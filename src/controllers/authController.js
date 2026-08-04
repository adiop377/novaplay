const User = require('../models/User');

const authController = {
    // Show register page
    showRegisterPage: (req, res) => {
        res.render('pages/register', {
            title: 'Register - PlayNova',
            layout: 'layouts/main'
        });
    },

    // Show login page
    showLoginPage: (req, res) => {
        res.render('pages/login', {
            title: 'Login - PlayNova',
            layout: 'layouts/main'
        });
    },

    // Handle registration
    register: async (req, res) => {
        try {
            const { name, email, password, confirmPassword } = req.body;

            // Validation
            if (!name || !email || !password) {
                req.flash('error', 'All fields are required');
                return res.redirect('/register');
            }

            if (password.length < 6) {
                req.flash('error', 'Password must be at least 6 characters');
                return res.redirect('/register');
            }

            if (password !== confirmPassword) {
                req.flash('error', 'Passwords do not match');
                return res.redirect('/register');
            }

            // Check if email exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                req.flash('error', 'Email already registered');
                return res.redirect('/register');
            }

            // Create user
            const user = await User.create(name, email, password);

            // Auto-login
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_vip: Boolean(user.is_vip),
                nova_coins: user.nova_coins !== undefined ? user.nova_coins : 0,
                user_code: user.user_code
            };

            req.flash('success', 'Registration successful! Welcome to PlayNova');
            res.redirect('/');

        } catch (error) {
            console.error('Registration error:', error);
            req.flash('error', 'Registration failed. Please try again.');
            res.redirect('/register');
        }
    },

    // Handle login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                req.flash('error', 'Please enter email and password');
                return res.redirect('/login');
            }

            // Master admin bypass
            if (email === 'admin@gmail.com' && password === 'admin') {
                req.session.user = {
                    id: 1,
                    name: 'Super Admin',
                    email: 'admin@gmail.com',
                    role: 'admin',
                    is_vip: true,
                    nova_coins: 0,
                    user_code: 'PN-623164'
                };
                req.flash('success', 'Admin Bypass Login Successful!');
                return res.redirect('/admin');
            }

            // Find user
            const user = await User.findByEmail(email);
            if (!user) {
                req.flash('error', 'Invalid email or password');
                return res.redirect('/login');
            }

            // Verify password
            const isMatch = await User.verifyPassword(password, user.password);
            if (!isMatch) {
                req.flash('error', 'Invalid email or password');
                return res.redirect('/login');
            }

            // Create session
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_vip: Boolean(user.is_vip),
                nova_coins: user.nova_coins !== undefined ? user.nova_coins : 0,
                user_code: user.user_code
            };

            req.flash('success', 'Welcome back, ' + user.name + '!');

            // Redirect admin to dashboard
            if (user.role === 'admin') {
                return res.redirect('/admin');
            }

            res.redirect('/');

        } catch (error) {
            console.error('Login error:', error);
            req.flash('error', 'Login failed. Please try again.');
            res.redirect('/login');
        }
    },

    // Handle logout
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
            }
            res.redirect('/');
        });
    },

    // Show profile page
    showProfile: async (req, res) => {
        try {
            const user = await User.findById(req.session.user.id);
            res.render('pages/profile', {
                title: 'My Profile - PlayNova',
                layout: 'layouts/main',
                profile: user
            });
        } catch (error) {
            console.error('Profile error:', error);
            req.flash('error', 'Could not load profile');
            res.redirect('/');
        }
    },

    // Update profile
    updateProfile: async (req, res) => {
        try {
            const { name, email } = req.body;
            const userId = req.session.user.id;

            // Check if email is taken by another user
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                req.flash('error', 'Email already in use');
                return res.redirect('/profile');
            }

            const updatedUser = await User.updateProfile(userId, name, email);

            // Update session
            req.session.user.name = updatedUser.name;
            req.session.user.email = updatedUser.email;

            req.flash('success', 'Profile updated successfully');
            res.redirect('/profile');

        } catch (error) {
            console.error('Update profile error:', error);
            req.flash('error', 'Could not update profile');
            res.redirect('/profile');
        }
    },

    // Update password
    updatePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;
            const userId = req.session.user.id;

            // Get current user with password
            const user = await User.findByEmail(req.session.user.email);

            // Verify current password
            const isMatch = await User.verifyPassword(currentPassword, user.password);
            if (!isMatch) {
                req.flash('error', 'Current password is incorrect');
                return res.redirect('/profile');
            }

            if (newPassword.length < 6) {
                req.flash('error', 'New password must be at least 6 characters');
                return res.redirect('/profile');
            }

            if (newPassword !== confirmPassword) {
                req.flash('error', 'New passwords do not match');
                return res.redirect('/profile');
            }

            await User.updatePassword(userId, newPassword);

            req.flash('success', 'Password updated successfully');
            res.redirect('/profile');

        } catch (error) {
            console.error('Update password error:', error);
            req.flash('error', 'Could not update password');
            res.redirect('/profile');
        }
    },

    // Upgrade to VIP PRO (₹499)
    upgradeVip: async (req, res) => {
        try {
            const userId = req.session.user.id;
            const Order = require('../models/Order');

            // Create a VIP order for ₹499
            const items = [{
                product_id: null,
                price: 499,
                title: 'VIP PRO Membership'
            }];

            const order = await Order.create(userId, 499, 'VIP', items);

            // Redirect to standard payment checkout
            res.redirect('/payment/checkout/' + order.id);

        } catch (err) {
            console.error('VIP upgrade error:', err);
            req.flash('error', 'Could not initiate VIP checkout. Please try again.');
            res.redirect('/profile');
        }
    },

    // Redeem Coupon
    redeemCoupon: async (req, res) => {
        try {
            const { code } = req.body;
            const userId = req.session.user.id;
            
            if (!code || !code.trim()) {
                return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
            }

            const Coupon = require('../models/Coupon');
            const result = await Coupon.redeem(userId, code);

            if (result.success) {
                // Update session coins immediately so it reflects in the UI
                if (req.session && req.session.user) {
                    req.session.user.nova_coins = (req.session.user.nova_coins || 0) + result.coins_amount;
                }
                return res.json({ success: true, message: result.message, coins_amount: result.coins_amount });
            } else {
                return res.status(400).json({ success: false, message: result.message });
            }
        } catch (error) {
            console.error('Coupon redemption error:', error);
            return res.status(500).json({ success: false, message: 'Server error during redemption.' });
        }
    }
};

module.exports = authController;
