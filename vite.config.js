import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/glitcher-vid/', // <--- DODAJ TĘ LINIĘ
  plugins: [react()],
  assetsInclude: ['**/*.glsl'],
});
