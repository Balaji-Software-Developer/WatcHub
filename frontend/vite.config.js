// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward API requests to your backend server
      '/api/v1': {
        target: 'http://localhost:5000', // Your backend server address
        changeOrigin: true,
        secure: false
      }
    }
  }
});