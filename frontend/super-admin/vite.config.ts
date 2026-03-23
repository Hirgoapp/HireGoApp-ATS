import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            // 0.0.0.0 = reachable on LAN; use http://127.0.0.1:5174/login if "localhost" fails in browser
            host: env.VITE_DEV_HOST || '0.0.0.0',
            port: 5174,
            strictPort: true,
            proxy: {
                '/api': {
                    target: env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
        preview: {
            host: env.VITE_DEV_HOST || '0.0.0.0',
        },
        build: {
            outDir: 'dist',
            sourcemap: true,
        },
    };
});
