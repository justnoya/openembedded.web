/**
 * Vercel Serverless entry point (when Vercel Root Directory = components-sdk/).
 * Goes up two levels to reach the Express server at the monorepo root.
 *
 * Supports the same PROXY MODE / SERVERLESS FALLBACK logic as the root api/index.js:
 *   - Set BACKEND_URL on Vercel → all /api/* requests proxy to your persistent server
 *     (required for the Discord Gateway bot WebSocket feature)
 *   - No BACKEND_URL → uses the embedded Express app directly (auth, webhooks, codegen work)
 */

const BACKEND_URL = process.env.BACKEND_URL;

let handler;

if (BACKEND_URL) {
    const base = BACKEND_URL.replace(/\/$/, '');

    handler = async (req, res) => {
        const target = `${base}${req.url}`;
        try {
            const isBodyless = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
            const body = isBodyless ? undefined : JSON.stringify(req.body);

            const headers = {
                'content-type': req.headers['content-type'] || 'application/json',
                'cookie': req.headers['cookie'] || '',
                'x-forwarded-for':
                    req.headers['x-forwarded-for'] ||
                    req.socket?.remoteAddress ||
                    '',
                'x-forwarded-host': req.headers['host'] || '',
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
                hint: 'Check the BACKEND_URL environment variable on Vercel.',
                error: e.message,
            });
        }
    };
} else {
    const { default: serverApp } = await import('../../server/src/index.js');
    handler = serverApp;
}

export default handler;
