import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import commonjs from 'vite-plugin-commonjs'[[4](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQFnRHKA39ZMr7ku-2pEYOZrdWwZxgW6FkLzomODx-jQl4c8X1recZfGelfwWUGcP8fodOwcBZu5z6e-6qLFQN4805FlEU9IkjaSSKgSCOo4JH-6x477_wgSPFtwzjOT9JJNArP5CgfJtuSNATn1fuqy_bYEhAPIgkzr6AleRudSQxewL71XEixzGGodoPnVyw%3D%3D)]

export default defineConfig({
  plugins: [
    react(),
    commonjs() // 1.[[4](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQFnRHKA39ZMr7ku-2pEYOZrdWwZxgW6FkLzomODx-jQl4c8X1recZfGelfwWUGcP8fodOwcBZu5z6e-6qLFQN4805FlEU9IkjaSSKgSCOo4JH-6x477_wgSPFtwzjOT9JJNArP5CgfJtuSNATn1fuqy_bYEhAPIgkzr6AleRudSQxewL71XEixzGGodoPnVyw%3D%3D)] This handles the "require" conversion
  ],
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
