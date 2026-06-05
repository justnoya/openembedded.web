'use strict';

/**
 * OpenEmbedded — Electron main process
 *
 * - Creates the BrowserWindow and loads the app
 * - Manages Discord Rich Presence via rpc.js
 * - Handles IPC messages from the renderer (page navigation)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const rpc  = require('./rpc');

// ── Config ────────────────────────────────────────────────────────────────────

const DEV        = process.env.ELECTRON_DEV === '1';
const DEV_URL    = 'http://localhost:5000';
const PROD_INDEX = path.join(process.resourcesPath, 'app', 'index.html');

// ── Window ────────────────────────────────────────────────────────────────────

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width:  1280,
        height: 820,
        minWidth:  900,
        minHeight: 600,
        title: 'OpenEmbedded',
        backgroundColor: '#1a1b2e',
        webPreferences: {
            preload:              path.join(__dirname, 'preload.js'),
            contextIsolation:     true,
            nodeIntegration:      false,
            sandbox:              false,
            webSecurity:          !DEV,
        },
        // Use a frameless-style titlebar on macOS
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        show: false,
    });

    // Show once ready — avoids white flash on startup
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (DEV) mainWindow.webContents.openDevTools({ mode: 'detach' });
    });

    // Load app
    if (DEV) {
        mainWindow.loadURL(DEV_URL);
    } else {
        mainWindow.loadFile(PROD_INDEX);
    }

    // Open external links in the system browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.on('closed', () => { mainWindow = null; });
}

// ── App menu (macOS) ──────────────────────────────────────────────────────────

function buildMenu() {
    const template = [
        ...(process.platform === 'darwin' ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' },
            ],
        }] : []),
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(process.platform === 'darwin'
                    ? [{ type: 'separator' }, { role: 'front' }]
                    : [{ role: 'close' }]),
            ],
        },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

// Renderer → Main: page navigated
ipcMain.on('rpc:set-page', (_event, path) => {
    rpc.setPage(path);
});

// Renderer → Main (sync): app version
ipcMain.on('app:version', (event) => {
    event.returnValue = app.getVersion();
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
    buildMenu();
    createWindow();

    // Start Discord Rich Presence (fails silently if Discord isn't running)
    try { rpc.start(); } catch (err) {
        console.warn('[Main] Discord RPC start failed:', err.message);
    }

    // macOS: re-create window when dock icon is clicked
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    rpc.destroy();
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    rpc.destroy();
});
