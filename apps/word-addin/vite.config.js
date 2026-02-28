import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3050,
        allowedHosts: [
            '.trycloudflare.com',
            '.ngrok-free.app',
            '.ngrok.io',
            '.loca.lt',
        ],
    },
});
//# sourceMappingURL=vite.config.js.map