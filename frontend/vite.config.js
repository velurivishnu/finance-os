import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This enables the --host behavior by default
    port: 5173, // Ensures it always uses this port
  }
})
