import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src/renderer',
  build: {
    outDir: '../../renderer-dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  server: {
    port: 5173,
  },
});



