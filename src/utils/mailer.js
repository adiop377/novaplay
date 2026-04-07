const nodemailer = require('nodemailer');

// Setup Nodemailer transporter
const createTransporter = () => {
    // Return null if not configured
    if (!process.env.ADMIN_EMAIL || !process.env.SMTP_PASS) {
        console.log('Mailer not configured: ADMIN_EMAIL or SMTP_PASS missing.');
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.SMTP_PASS
        }
    });
};

const sendNewOrderEmail = async (orderInfo, isPaymentUpdate = false) => {
    const transporter = createTransporter();
    if (!transporter) return;

    let itemsText = orderInfo.items ? orderInfo.items.map(i => `- ${i.title} (₹${i.price})`).join('\n') : 'N/A';
    
    const subjectPrefix = isPaymentUpdate ? '✅ PAYMENT SUCCESSFUL' : '🚨 NEW PENDING ORDER';
    
    const mailOptions = {
        from: `"PlayNova Alerts" <${process.env.ADMIN_EMAIL}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `${subjectPrefix}: #${orderInfo.id} | ₹${orderInfo.total}`,
        text: `
Hello Admin,

${isPaymentUpdate ? 'A customer has successfully PAID for their order! 🎉' : 'A new order was just initiated on your marketplace. (Payment Pending) ⏳'}

🔔 ORDER DETAILS:
Order ID: ${orderInfo.id}
Total Amount: ₹${orderInfo.total}
Status: ${orderInfo.status}
Payment Status: ${orderInfo.payment_status}

👤 CUSTOMER DETAILS:
Name: ${orderInfo.user_name || 'N/A'}
Email: ${orderInfo.user_email || 'N/A'}
${orderInfo.player_id !== null ? 'Player UID (Topup): ' + orderInfo.player_id : ''}

🛒 ITEMS:
${itemsText}

Manage this order:
https://ff-market-store.vercel.app/admin/orders
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('[MAILER] Failed to send email:', err);
    }
};

module.exports = {
    sendNewOrderEmail
};
