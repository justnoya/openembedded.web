/**
 * Vercel Serverless entry point for /api/* routes.
 *
 * TWO MODES:
 *
 * 1. PROXY MODE (recommended for full bot support):
 *    Set BACKEND_URL in Vercel → all /api/* requests are forwarded to a
 *    persistent server (Replit Deploy, Render, Railway, Fly.io, etc.).
 *    The persistent server keeps the Discord Gateway WebSocket alive.
 *
 *    Example: BACKEND_URL=https://my-openembedded-server.onrender.com
 *
 * 2. SERVERLESS MODE (fallback, no BACKEND_URL):
 *    Runs the Express app as a stateless serverless function.
 *    Auth and code generation work; Discord Gateway bot is NOT available
 *    (serverless functions can't hold a persistent WebSocket).
 */
const BACKEND_URL = process.env.BACKEND_URL;

if (BACKEND_URL) {
    const base = BACKEND_URL.replace(/\/$/, '');

    module.exports = async (req, res) => {
        const target = `${base}${req.url}`;
        try {
            const isBodyless = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
            const body = isBodyless ? undefined : JSON.stringify(req.body);

            const headers = {
                'content-type':      req.headers['content-type'] || 'application/json',
                'cookie':            req.headers['cookie'] || '',
                'x-forwarded-for':   req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
                'x-forwarded-host':  req.headers['host'] || '',
                'x-forwarded-proto': 'https',
            };

            const upstreamRes = await fetch(target, {
                method: req.method,
                headers,
                body,
                redirect: 'manual',
            });

            for (const [key, value] of upstreamRes.headers.entries()) {
                if (key.toLowerCase() === 'content-encoding') continue;
                if (key.toLowerCase() === 'transfer-encoding') continue;
                res.setHeader(key, value);
            }

            if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
                const location = upstreamRes.headers.get('location');
                if (location) return res.redirect(upstreamRes.status, location);
            }

            res.status(upstreamRes.status);
            const buffer = await upstreamRes.arrayBuffer();
            res.end(Buffer.from(buffer));
        } catch (e) {
            console.error('[Proxy] Error reaching backend:', e.message);
            res.status(502).json({
                message: 'Backend unreachable',
                hint:    'Check the BACKEND_URL environment variable on Vercel.',
                error:   e.message,
            });
        }
    };
} else {
    // Serverless fallback — no Discord bot WebSocket persistence
    module.exports = require('../src/index');
}
