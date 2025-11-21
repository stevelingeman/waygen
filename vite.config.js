import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    commonjsOptions: {
      // 1. Force Vite to transform CJS modules in the build
      transformMixedEsModules: true,
      // 2. Explicitly include the problematic package
      include: [/mapbox-gl-draw-circle/, /node_modules/],
    }
  },
  optimizeDeps: {
    // 3. Force pre-bundling of this dependency during dev/build
    include: ['mapbox-gl-draw-circle']
  }
})
