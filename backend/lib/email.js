import nodemailer from 'nodemailer';
export function getMissingSmtpSettings() {
    const host = process.env.SMTP_HOST?.trim();
    const rawPort = process.env.SMTP_PORT?.trim();
    const port = Number(rawPort || 0);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM?.trim();
    const missing = [];
    if (!host) missing.push('SMTP_HOST');
    if (!rawPort || !Number.isInteger(port) || port < 1 || port > 65535) missing.push('SMTP_PORT (1-65535)');
    if (!user) missing.push('SMTP_USER');
    if (!pass) missing.push('SMTP_PASSWORD');
    if (!from) missing.push('SMTP_FROM');
    return missing;
}
function getSmtpConfig() {
    const missing = getMissingSmtpSettings();
    if (missing.length) {
        throw new Error(`Cấu hình SMTP chưa đầy đủ hoặc không hợp lệ: ${missing.join(', ')}.`);
    }
    return {
        host: process.env.SMTP_HOST.trim(),
        port: Number(process.env.SMTP_PORT),
        user: process.env.SMTP_USER.trim(),
        pass: process.env.SMTP_PASSWORD,
        from: process.env.SMTP_FROM.trim(),
    };
}
export function isSmtpConfigured() {
    return getMissingSmtpSettings().length === 0;
}
export async function sendPasswordResetEmail(email, code) {
    const config = getSmtpConfig();
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        requireTLS: config.port === 587,
        auth: { user: config.user, pass: config.pass },
    });
    await transporter.sendMail({
        from: config.from,
        to: email,
        subject: 'Mã xác thực đặt lại mật khẩu LUANHUNG SHOP',
        text: `Mã xác thực của bạn là ${code}. Mã có hiệu lực trong 10 phút và chỉ sử dụng được một lần.`,
        html: `<p>Mã xác thực đặt lại mật khẩu LUANHUNG SHOP:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>Mã có hiệu lực trong 10 phút và chỉ sử dụng được một lần.</p>`,
    });
}
