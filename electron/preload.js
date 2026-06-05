'use strict';

/**
 * Electron preload script.
 *
 * Runs in a sandboxed context before the renderer page loads.
 * Exposes a safe IPC bridge via contextBridge so the React app can
 * notify the main process about navigation events without having access
 * to Node.js APIs directly.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * Tell the main process which page the user navigated to.
     * The main process forwards this to the Discord RPC module.
     *
     * @param {string} path  e.g. '/codegen', '/bot'
     */
    updateActivity: (path) => {
        ipcRenderer.send('rpc:set-page', path);
    },

    /**
     * Returns true — lets React code know it's running inside Electron.
     */
    isDesktop: true,

    /** App version string, injected by main.js */
    version: ipcRenderer.sendSync('app:version'),
});
