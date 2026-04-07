const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
console.log('Cloudinary Config Check:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing'
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folderName = 'ff_marketplace';
        if (file.mimetype.startsWith('video/')) {
            return {
                folder: folderName + '/videos',
                resource_type: 'video',
                public_id: Date.now() + '-' + Math.round(Math.random() * 1E9)
            };
        }
        return {
            folder: folderName + '/images',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            public_id: Date.now() + '-' + Math.round(Math.random() * 1E9)
        };
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images (jpg, png, webp) and videos (mp4, webm) are allowed'), false);
    }
};

// Multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024 // 5GB max
    }
});

// Export upload middleware
module.exports = {
    cloudinary: cloudinary, // Exported for signing
    uploadProductMedia: upload.fields([
        { name: 'images', maxCount: 100 },
        { name: 'videos', maxCount: 10 }
    ]),
    uploadSingle: upload.single('image'),
    upload: upload
};
