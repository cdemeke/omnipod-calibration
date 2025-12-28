import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        include: ['pdfjs-dist'],
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    pdfjs: ['pdfjs-dist'],
                },
            },
        },
    },
});
