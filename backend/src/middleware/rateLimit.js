// In-memory rate limiter — per IP, max 10 login attempts per 15 min window
const loginAttempts = new Map(); // ip → { count, resetAt }

const WINDOW_MS    = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function checkRateLimit(ip) {
    const now = Date.now();
    let entry = loginAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + WINDOW_MS };
        loginAttempts.set(ip, entry);
    }
    if (entry.count >= MAX_ATTEMPTS) {
        const waitSec = Math.ceil((entry.resetAt - now) / 1000);
        return { limited: true, waitSec };
    }
    entry.count++;
    return { limited: false };
}

// Clean up expired entries every 30 min
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of loginAttempts) {
        if (now > entry.resetAt) loginAttempts.delete(ip);
    }
}, 30 * 60 * 1000);

module.exports = { checkRateLimit };
