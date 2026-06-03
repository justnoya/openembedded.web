/**
 * backend/src/lib/email.js
 *
 * Email sending via Gmail SMTP (Nodemailer).
 * Free, no third-party API needed — just a Gmail account with an App Password.
 *
 * Setup:
 *   1. Enable 2-Step Verification on your Google account.
 *   2. Go to myaccount.google.com → Security → App passwords → create one.
 *   3. Set GMAIL_USER and GMAIL_APP_PASSWORD in Replit Secrets.
 */
const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
    if (_transporter) return _transporter;

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
        console.warn('[Email] ⚠️  GMAIL_USER or GMAIL_APP_PASSWORD not set — emails disabled.');
        return null;
    }

    _transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
    });

    console.log(`[Email] Gmail SMTP configured for: ${user}`);
    return _transporter;
}

/**
 * Send an email. Returns true on success, false on failure.
 * @param {{ to: string, subject: string, html: string }} opts
 */
async function sendEmail({ to, subject, html }) {
    const transporter = getTransporter();
    if (!transporter) return false;

    try {
        const from = `"OpenEmbedded" <${process.env.GMAIL_USER}>`;
        await transporter.sendMail({ from, to, subject, html });
        console.log(`[Email] Sent "${subject}" → ${to}`);
        return true;
    } catch (err) {
        console.error('[Email] Failed to send:', err.message);
        return false;
    }
}

module.exports = { sendEmail };
