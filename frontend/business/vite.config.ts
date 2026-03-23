import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
            host: env.VITE_DEV_HOST || '0.0.0.0',
            port: 5180,
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
            port: 5181,
        },
        build: {
            outDir: 'dist',
            sourcemap: true,
        },
    };
});
