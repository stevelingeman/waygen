import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import commonjs from 'vite-plugin-commonjs'

export default defineConfig({
  plugins: [
    react(),
    commonjs()
  ],
  // 1. This "define" block creates fake variables for the browser
  define: {
    // This mocks the 'require' object so code checking 'require.main' doesn't crash
    'require': { main: {} },
    // This mocks 'process.argv' which is also visible in your error screenshot
    'process': { env: {}, argv: [] }
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
