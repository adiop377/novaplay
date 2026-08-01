require('dotenv').config();
// Use environment variables from .env or Vercel dashboard
// Environment variables like DATABASE_URL, CLOUDINARY_*, and SESSION_SECRET 
// should be set in the Vercel dashboard for production.
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./src/config/db');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const path = require('path');

const app = express();

// View Engine Setup - EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'ff_marketplace_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Flash Messages
app.use(flash());

// Global Variables (accessible in all EJS templates)
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    next();
});

// Routes
const indexRoutes = require('./src/routes/index');
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const cartRoutes = require('./src/routes/cart');
const orderRoutes = require('./src/routes/orders');
const adminRoutes = require('./src/routes/admin');
const paymentRoutes = require('./src/routes/payment');

const TopupPackage = require('./src/models/TopupPackage');

// Backend Proxy for UID Verification (To avoid Mixed Content HTTPS/HTTP errors)
app.get('/api/verify-uid/:uid', async (req, res) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12 second timeout

    try {
        const { uid } = req.params;
        console.log(`[UID Proxy] Proxying player info for input: ${uid}`);
        
        let finalUid = uid;
        
        // If input contains letters, it's a Name. Search for the Name to get the correct UID.
        if (!/^\d+$/.test(uid)) {
            console.log(`Searching API by name: ${uid}`);
            try {
                const searchRes = await fetch(`http://raw.sukhdaku.eu.cc/search/?name=${encodeURIComponent(uid)}&region=IND`, { signal: controller.signal });
                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    if (searchData.result && searchData.result.length > 0) {
                        finalUid = searchData.result[0].Uid;
                        console.log(`Found UID via Name Search: ${finalUid}`);
                    }
                }
            } catch (searchErr) {
                console.warn('[UID Name Search Failed]:', searchErr.message);
            }
        }
        
        // Fetch the player info as JSON to get the Name and Likes
        const response = await fetch(`http://raw.sukhdaku.eu.cc/info/?uid=${finalUid}&region=IND`, { signal: controller.signal });

        if (!response.ok) {
            console.error(`[UID Proxy] Upstream API returned status ${response.status}. Falling back to mock data.`);
            clearTimeout(timeout);
            return res.json({
                success: true,
                name: 'Player',
                uid: finalUid,
                level: 0,
                likes: 0,
                avatar_img: `https://raw.githubusercontent.com/adiv222/ff-logos/main/avatar/1.png`,
                imagePath: `https://raw.sukhdaku.eu.cc/profile/profile?uid=${finalUid}`
            });
        }

        const data = await response.json();
        clearTimeout(timeout);

        if (data && (data.status === 'success' || data.player_data)) {
            console.log(`[UID Proxy] Success for UID: ${finalUid} (${data.player_data?.nickname})`);
            res.json({
                success: true,
                name: data.player_data?.nickname || 'Unknown',
                uid: finalUid,
                level: data.player_data?.level || 0,
                likes: data.player_data?.liked || 0,
                avatar_img: `https://raw.githubusercontent.com/adiv222/ff-logos/main/avatar/${data.profile_info?.avatar_id}.png`,
                imagePath: `https://raw.sukhdaku.eu.cc/profile/profile?uid=${finalUid}`
            });
        } else {
             console.warn(`[UID Proxy] Player not found in API response for UID: ${finalUid}. Falling back to mock.`);
             return res.json({
                success: true,
                name: 'Player',
                uid: finalUid,
                level: 0,
                likes: 0,
                avatar_img: `https://raw.githubusercontent.com/adiv222/ff-logos/main/avatar/1.png`,
                imagePath: `https://raw.sukhdaku.eu.cc/profile/profile?uid=${finalUid}`
            });
        }
    } catch (error) {
        clearTimeout(timeout);
        console.error('[UID Proxy Error]:', error.message);
        // Fallback to mock data on network error as well
        res.json({
            success: true,
            name: 'Player',
            uid: finalUid,
            level: 0,
            likes: 0,
            avatar_img: `https://raw.githubusercontent.com/adiv222/ff-logos/main/avatar/1.png`,
            imagePath: `https://raw.sukhdaku.eu.cc/profile/profile?uid=${finalUid}`
        });
    }
});

// New Proxy Route just for the actual Image Card
app.get('/api/profile-image/:uid', async (req, res) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout for image

    try {
        const uid = req.params.uid;
        const response = await fetch(`http://raw.sukhdaku.eu.cc/profile/profile?uid=${uid}`, { signal: controller.signal });
        
        if (!response.ok) throw new Error('Proxy Image Error');
        
        const buffer = await response.arrayBuffer();
        clearTimeout(timeout);
        res.setHeader('Content-Type', 'image/png');
        res.send(Buffer.from(buffer));
    } catch (error) {
        clearTimeout(timeout);
        console.error('[Profile Image Proxy Error]:', error.message);
        res.status(500).end();
    }
});

// Topup Routes (Direct)
app.get('/topup', async (req, res) => {
    try {
        const packages = await TopupPackage.getAll();
        res.render('pages/topup', { 
            title: 'Free Fire Diamond Topup', 
            filters: {},
            packages
        });
    } catch (error) {
        console.error('Topup page error:', error);
        res.render('pages/topup', { title: 'Free Fire Diamond Topup', filters: {}, packages: [] });
    }
});

app.post('/topup/order', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'Please login to topup.' });
        }
        
        const userId = req.session.user.id;
        
        // Verify user exists in database to avoid foreign key errors
        const User = require('./src/models/User');
        const userExists = await User.findById(userId);
        if(!userExists) {
            req.session.destroy();
            return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
        }
        
        const { amount, price, uid } = req.body;
        const Order = require('./src/models/Order');

        // Create the topup order
        const order = await Order.create(userId, price, uid, [{
            product_id: null, // null for topup rather than 0 which violates foreign key
            price: price,
            title: `${amount} Diamonds Topup`
        }]);

        // Razorpay integration skipped as per user request for manual QR payment
        /*
        const options = {
            amount: Math.round(parsedPrice * 100), // convert to paise
            currency: 'INR',
            receipt: `order_rcptid_${order.id}`,
        };

        let rzpOrder;
        try {
            rzpOrder = await rzp.orders.create(options);
        } catch (rzpErr) {
            console.error('Razorpay Order Creation Failed:', rzpErr);
            throw new Error('Payment Gateway Error: ' + (rzpErr.error ? rzpErr.error.description : rzpErr.message));
        }
        
        // Update order with razorpay order id
        await Order.updateStatus(order.id, 'pending'); // Ensure status is pending
        */

        res.json({ success: true, orderId: order.id });
    } catch (error) {
        console.error('Topup Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create order: ' + error.message
        });
    }
});

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/payment', paymentRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).render('pages/404', { title: 'Page Not Found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('pages/error', { 
        title: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start Server (only if not running in Vercel)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 PlayNova running at http://localhost:${PORT}`);
    });
}

// Export for Vercel Serverless
module.exports = app;
