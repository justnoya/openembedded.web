'use strict';

/**
 * Discord Rich Presence handler for OpenEmbedded desktop app.
 *
 * Connects to Discord's local IPC socket (same mechanism Spotify uses).
 * Updates the user's Discord activity to show what they're doing in the app.
 * Silently no-ops if Discord is not running or RPC connection fails.
 *
 * NOTE: setActivity requires NO scopes — the discord-rpc client connects
 * directly via IPC without any OAuth popup. Scopes are only needed for
 * reading user data or controlling voice, neither of which we use here.
 */

const DiscordRPC = require('discord-rpc');

// ── Config ────────────────────────────────────────────────────────────────────

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1511630414295601182';

// Reconnect after this many ms if Discord RPC disconnects
const RECONNECT_DELAY = 15_000;

// ── State labels per page path ─────────────────────────────────────────────────
// Paths match what useElectronActivity.ts sends via window.electronAPI.updateActivity
const PAGE_LABELS = {
    '/':           'Building Discord components',
    '/embed':      'Editing a message embed',
    '/response':   'Building an interaction response',
    '/components': 'Designing buttons',
    '/select':     'Designing a select menu',
    '/modal':      'Designing a modal',
    '/codegen':    'Generating embed code',
    '/bot':        'Configuring bot settings',
    '/settings':   'Managing settings',
    '/signin':     'Signing in',
    '/verify':     'Verifying account',
};

function labelForPath(path) {
    if (!path) return 'Building Discord components';
    if (PAGE_LABELS[path]) return PAGE_LABELS[path];
    for (const [key, label] of Object.entries(PAGE_LABELS)) {
        if (key !== '/' && path.startsWith(key)) return label;
    }
    return 'Building Discord components';
}

// ── RPC client ────────────────────────────────────────────────────────────────

let client         = null;
let startTimestamp = Date.now();
let currentPath    = '/';
let connected      = false;
let reconnectTimer = null;

function createClient() {
    const rpc = new DiscordRPC.Client({ transport: 'ipc' });

    rpc.on('ready', () => {
        console.log('[RPC] Discord Rich Presence connected ✓');
        connected = true;
        pushActivity();
    });

    rpc.on('disconnected', () => {
        console.log('[RPC] Disconnected — will retry in', RECONNECT_DELAY / 1000, 's');
        connected = false;
        scheduleReconnect();
    });

    // No scopes needed for setActivity — plain IPC connection only
    rpc.login({ clientId: CLIENT_ID }).catch((err) => {
        console.warn('[RPC] Could not connect to Discord (is Discord running?):', err.message);
        connected = false;
        scheduleReconnect();
    });

    return rpc;
}

function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        console.log('[RPC] Reconnecting…');
        try { client?.destroy?.(); } catch (_) {}
        client = createClient();
    }, RECONNECT_DELAY);
}

// ── Activity ──────────────────────────────────────────────────────────────────

function pushActivity() {
    if (!connected || !client) return;

    client.setActivity({
        details:        'Using OpenEmbedded',
        state:          labelForPath(currentPath),
        startTimestamp,
        largeImageKey:  'logo',
        largeImageText: 'OpenEmbedded — Discord UI Builder',
        smallImageKey:  'discord',
        smallImageText: 'Discord',
        instance:       false,
        buttons: [
            { label: 'Try OpenEmbedded', url: 'https://discord.builders' },
        ],
    }).catch((err) => {
        console.warn('[RPC] setActivity failed:', err.message);
    });
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Start the Discord RPC connection.
 * Call once when the Electron app launches.
 */
function start() {
    startTimestamp = Date.now();
    client = createClient();
}

/**
 * Update the Rich Presence state to reflect the current page.
 * Called from the main process when the renderer navigates.
 *
 * @param {string} path  e.g. '/embed', '/components'
 */
function setPage(path) {
    currentPath = path || '/';
    pushActivity();
}

/**
 * Cleanly disconnect Rich Presence when the app exits.
 */
function destroy() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    try { client?.destroy?.(); } catch (_) {}
    connected = false;
}

module.exports = { start, setPage, destroy };
