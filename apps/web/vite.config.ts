import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 3000,
        watch: {
            usePolling: true,
            interval: 1000, // Poll every 1 second instead of default
            ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
        },
        hmr: {
            clientPort: 3000,
            overlay: false, // Disable error overlay to reduce HMR load
        },
    },
})
