const https = require('https');

const ENV_VARS = [
  { key: 'DATABASE_URL', value: process.env.DATABASE_URL },
  { key: 'CLOUDINARY_CLOUD_NAME', value: process.env.CLOUDINARY_CLOUD_NAME },
  { key: 'CLOUDINARY_API_KEY', value: process.env.CLOUDINARY_API_KEY },
  { key: 'CLOUDINARY_API_SECRET', value: process.env.CLOUDINARY_API_SECRET },
  { key: 'SESSION_SECRET', value: process.env.SESSION_SECRET },
];

const reqOptions = {
    hostname: 'api.vercel.com',
    port: 443,
    path: '/v10/projects/prj_jhVuGgaFEhJLLl9U7YqgbY9jO1aT/env', // Note: This Project ID might need to be updated for a new project
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
    }
};

async function pushEnv() {
    for (const v of ENV_VARS) {
        const payload = JSON.stringify({
            key: v.key,
            value: v.value,
            target: ["production", "preview", "development"],
            type: "encrypted"
        });

        await new Promise((resolve) => {
            const req = https.request(reqOptions, (res) => {
                let data = '';
                res.on('data', d => data += d);
                res.on('end', () => resolve(data));
            });
            req.write(payload);
            req.end();
        });
        console.log(`Added ${v.key}`);
    }
}

pushEnv();
