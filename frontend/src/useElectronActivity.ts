import { useEffect } from 'react';

/**
 * When running inside the OpenEmbedded desktop app (Electron), this hook
 * keeps Discord Rich Presence in sync with the current page.
 *
 * Completely safe to call on the web — window.electronAPI is undefined
 * there, so every call is a no-op.
 */

declare global {
    interface Window {
        electronAPI?: {
            updateActivity: (path: string) => void;
            isDesktop: boolean;
            version: string;
        };
    }
}

// Map internal page keys (from useRouter) → human-readable activity labels
const PAGE_ACTIVITY: Record<string, string> = {
    '200.home':           '/',
    'embed.message':      '/embed',
    'embed.response':     '/response',
    'components.button':  '/components',
    'components.select':  '/select',
    'components.modal':   '/modal',
    '404.not-found':      '/not-found',
};

function pageToPath(page: string): string {
    return PAGE_ACTIVITY[page] ?? '/';
}

export function useElectronActivity(page: string): void {
    useEffect(() => {
        if (!window.electronAPI) return;
        window.electronAPI.updateActivity(pageToPath(page));
    }, [page]);
}
