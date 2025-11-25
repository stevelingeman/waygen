import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import commonjs from 'vite-plugin-commonjs'

export default defineConfig({
  plugins: [
    react(),
    commonjs()
  ],
  define: {
    // REMOVED 'require' from here.
    // Keep 'process' as it is safe and often needed.
    'process': { env: {}, argv: [] }
  },
  define: {
    global: 'window',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  },
  optimizeDeps: {
    include: ['mapbox-gl-draw-circle']
  }
})