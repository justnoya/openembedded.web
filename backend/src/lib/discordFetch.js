/**
 * Thin wrapper around the Discord REST API.
 * Throws an enriched Error on non-2xx responses.
 */
async function discordFetch(path, token, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = {};
    if (token) headers.Authorization = `Bot ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';
    Object.assign(headers, options.headers || {});

    const res = await fetch(`https://discord.com/api/v10${path}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = new Error(body?.message || `Discord API error ${res.status}`);
        err.discordBody = body;
        err.httpStatus  = res.status;
        throw err;
    }

    return res.status === 204 ? null : res.json();
}

async function respondToInteraction(interactionId, interactionToken, data) {
    return discordFetch(
        `/interactions/${interactionId}/${interactionToken}/callback`,
        null,
        { method: 'POST', body: JSON.stringify(data) }
    );
}

module.exports = { discordFetch, respondToInteraction };
