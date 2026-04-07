const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim()
});

async function testCloudinary() {
    try {
        console.log('Testing Cloudinary config with:', {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: '***'
        });
        const result = await cloudinary.api.ping();
        console.log('Ping Result:', result);
        const account = await cloudinary.api.usage();
        console.log('Account usage (to verify it works):', account);
    } catch (error) {
        console.log('Cloudinary Test Failed:', error.message);
        console.log('HTTP Code:', error.http_code);
    }
}

testCloudinary();
