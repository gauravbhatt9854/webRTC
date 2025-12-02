import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  preview: {
    port: 4173,              // same port as exposed in Docker
    host: true,              // listen on all interfaces (0.0.0.0)
    allowedHosts: ['vc.9854.me'], // allow your domain
  },
})
