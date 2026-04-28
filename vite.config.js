import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-lucide': ['lucide-react'],
          'vendor-framer': ['framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
})
