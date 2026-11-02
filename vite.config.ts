import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      
    ],
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    // Split the big main chunk (~998 kB): React + Firebase are large
    // libraries used on every page, so they get their own chunks that
    // browsers cache separately; the entry chunk stays under the warning limit.
    // (Vite 8 runs on Rolldown, whose native chunk-grouping API is
    // advancedChunks; the Rollup-style manualChunks function was ignored
    // for the Firestore modules.)
    build: {
      rolldownOptions: {
        output: {
          advancedChunks: {
            groups: [
              { name: 'react-vendor', test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/ },
              // Firestore alone is ~400 kB, so it gets its own chunk;
              // the rest of Firebase (app/auth/storage) shares one.
              { name: 'firebase-firestore', test: /[\\/]node_modules[\\/]@firebase[\\/]firestore[\\/]/ },
              { name: 'firebase-core', test: /[\\/]node_modules[\\/](@firebase|firebase)[\\/]/ },
            ],
          },
        },
      },
    },
  };
});
