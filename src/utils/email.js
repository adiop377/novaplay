const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendOtpEmail = async (email, otp) => {
    const mailOptions = {
        from: `PlayNova <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify your PlayNova Account',
        text: `Use this code to verify your email:\n\n${otp}\n\nExpires in 15 minutes. If you did not sign up, you can ignore this email.`,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #1a1a1a; color: #ffffff; padding: 40px 30px; border-radius: 16px; max-width: 500px; margin: 0 auto; text-align: left;">
                <h2 style="color: #388bff; margin-bottom: 24px; font-size: 26px; font-weight: bold; margin-top: 0;">PlayNova</h2>
                <p style="font-size: 18px; color: #e8eaed; margin-bottom: 24px; margin-top: 0;">Use this code to verify your email:</p>
                <div style="margin: 36px 0;">
                    <span style="font-size: 48px; font-weight: bold; letter-spacing: 14px; color: #ffffff;">${otp.split('').join(' ')}</span>
                </div>
                <p style="font-size: 14px; color: #9aa0a6; margin-top: 40px; margin-bottom: 0;">Expires in 15 minutes. If you did not sign up, you can ignore this email.</p>
            </div>
        `
    };

    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('\n=============================================');
            console.log(`[DEVELOPMENT MODE] OTP for ${email}: ${otp}`);
            console.log('=============================================\n');
            return true;
        }
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};

module.exports = {
    sendOtpEmail
};
