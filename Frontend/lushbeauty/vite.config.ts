import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // En desarrollo el navegador habla con /api y Vite lo reenvía al backend.
    proxy: { '/api': process.env.VITE_API_TARGET ?? 'http://127.0.0.1:8010' },
  },
  build: {
    rollupOptions: {
      output: {
        // Librerías en su propio archivo: cambian poco y el navegador las guarda aparte del código de la app.
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
