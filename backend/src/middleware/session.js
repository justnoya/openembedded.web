const cookieSession = require('cookie-session');
const crypto = require('crypto');

module.exports = cookieSession({
    name: 'oe_session',
    keys: [process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')],
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
});
