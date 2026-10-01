/* eslint-env node */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// BASE_PATH permite publicar em subpasta (ex.: GitHub Pages em /nome-do-repo/).
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
