'use strict';

/**
 * Discord Rich Presence handler for OpenEmbedded desktop app.
 *
 * Connects to Discord's local IPC socket (same mechanism Spotify uses).
 * Updates the user's Discord activity to show what they're doing in the app.
 * Silently no-ops if Discord is not running or RPC connection fails.
 */

const DiscordRPC = require('discord-rpc');

// ── Config ────────────────────────────────────────────────────────────────────

// Use the existing Discord application ID — no extra app needed.
// Make sure "RPC" is enabled in the Discord Developer Portal for this app:
//   Developer Portal → Your App → Rich Presence → Art Assets
// Also add http://127.0.0.1 as an allowed OAuth2 redirect URI.
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1511630414295601182';

const SCOPES = ['rpc', 'rpc.activities.write'];

// Reconnect after this many ms if Discord RPC disconnects
const RECONNECT_DELAY = 15_000;

// ── State labels per page ─────────────────────────────────────────────────────
const PAGE_LABELS = {
    '/':          'Building Discord components',
    '/signin':    'Signing in',
    '/verify':    'Verifying account',
    '/codegen':   'Generating embed code',
    '/bot':       'Configuring bot settings',
    '/settings':  'Managing settings',
};

function labelForPath(path) {
    if (!path) return 'Building Discord components';
    // Exact match first, then prefix match
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
        console.log('[RPC] Discord Rich Presence connected');
        connected = true;
        pushActivity();
    });

    rpc.on('disconnected', () => {
        console.log('[RPC] Discord Rich Presence disconnected — will retry');
        connected = false;
        scheduleReconnect();
    });

    rpc.login({ clientId: CLIENT_ID, scopes: SCOPES }).catch((err) => {
        console.warn('[RPC] Could not connect to Discord:', err.message);
        connected = false;
        scheduleReconnect();
    });

    return rpc;
}

function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        console.log('[RPC] Attempting to reconnect...');
        try { client?.destroy?.(); } catch (_) {}
        client = createClient();
    }, RECONNECT_DELAY);
}

// ── Activity ──────────────────────────────────────────────────────────────────

function pushActivity() {
    if (!connected || !client) return;

    const activity = {
        details:    'Using OpenEmbedded',
        state:      labelForPath(currentPath),
        startTimestamp,
        largeImageKey:  'logo',
        largeImageText: 'OpenEmbedded — Discord UI Builder',
        smallImageKey:  'discord',
        smallImageText: 'Discord',
        instance: false,
        buttons: [
            { label: 'Try OpenEmbedded', url: 'https://openembedded.app' },
        ],
    };

    client.setActivity(activity).catch((err) => {
        console.warn('[RPC] setActivity failed:', err.message);
    });
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Start the Discord RPC connection.
 * Call once when the Electron app launches.
 */
function start() {
    DiscordRPC.register(CLIENT_ID);
    startTimestamp = Date.now();
    client = createClient();
}

/**
 * Update the Rich Presence state to reflect the current page.
 * Called from the main process when the renderer navigates.
 *
 * @param {string} path  e.g. '/codegen'
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
