import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from "node:path";
import postcssNesting from 'postcss-nesting';
import ejsTemplatePlugin from './src/rollupPlugin';
import seoPlugin from './src/seoPlugin';


export default defineConfig(({command, mode}) => ({
    plugins: [react({
      jsxRuntime: 'classic',
    }), ejsTemplatePlugin({
        compileDebug: mode === 'development'
    }), seoPlugin()],

    esbuild: {
        jsxInject: `import React from 'react'`
    },
    resolve: (command === 'serve' && mode === 'development') ? {
        // Make library auto-reload only on yarn dev
        alias: [
            // .* is to not double import css files
            {find: /^components-sdk.*$/, replacement: resolve(__dirname, '../components-sdk/src')},
        ],
    } : undefined,
    css: {
        postcss: {
            plugins: [
                postcssNesting
            ],
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5000,
        allowedHosts: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq, req) => {
                        // Forward the original host so Express builds the correct
                        // redirect_uri for the OIDC flow (Replit validates this)
                        if (req.headers.host) {
                            proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
                        }
                        proxyReq.setHeader('X-Forwarded-Proto', 'https');
                    });
                },
            },
        },
    },
    build: {
    }
}));
