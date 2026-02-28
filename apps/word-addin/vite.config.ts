import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3050,
    // Allow tunnel hosts when testing in Word on the web (Cloudflare, ngrok, etc.)
    allowedHosts: [
      '.trycloudflare.com',  // Cloudflare Quick Tunnels (any subdomain)
      '.ngrok-free.app',
      '.ngrok.io',
      '.loca.lt',            // localtunnel
    ],
  },
});