import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Chemins relatifs : le site fonctionne aussi dans un sous-dossier
  // (ex. https://30daysprojects.netlify.app/day-02-memory-game/)
  base: './',
})
