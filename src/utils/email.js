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
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const fromString = fromEmail.includes('<') ? fromEmail : `PlayNova <${fromEmail}>`;

    const mailOptions = {
        from: fromString,
        to: email,
        subject: 'Verify your PlayNova Account',
        text: `Use this code to verify your email:\n\n${otp}\n\nExpires in 15 minutes. If you did not sign up, you can ignore this email.`,
        html: `
            <div style="font-family: 'Orbitron', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #ffffff; padding: 40px 30px; border-radius: 20px; max-width: 500px; margin: 0 auto; text-align: center; border: 1px solid #1e293b; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
                <img src="https://playnovax.vercel.app/images/playnova-logo.png" alt="PlayNova Logo" style="height: 60px; margin-bottom: 30px;">
                <h2 style="color: #fff; margin-bottom: 10px; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Verify Your Identity</h2>
                <p style="font-size: 16px; color: #94a3b8; margin-bottom: 35px; line-height: 1.5;">You are one step away from joining the most trusted marketplace for premium Free Fire IDs. Use the verification code below:</p>
                <div style="margin: 40px auto; background: linear-gradient(145deg, #161c2d, #1a2336); padding: 25px; border-radius: 16px; border: 1px solid #2a3544; max-width: 300px;">
                    <span style="font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #2185ff; text-shadow: 0 0 20px rgba(33,133,255,0.4);">${otp}</span>
                </div>
                <p style="font-size: 13px; color: #64748b; margin-top: 40px; margin-bottom: 0; line-height: 1.6;">This code expires in 15 minutes.<br>If you did not request this, please ignore this email.</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 12px; color: #475569;">
                    © ${new Date().getFullYear()} PlayNova. All rights reserved.
                </div>
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
