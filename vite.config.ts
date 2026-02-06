import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      // Entry point for the library
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WebGLLib',
      formats: ['es'],
      fileName: (format) => `index.js`
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        // Preserve module structure for tree-shaking
        preserveModules: true,
        preserveModulesRoot: 'src',
        // Entry file names
        entryFileNames: '[name].js',
      }
    },
    sourcemap: true,
    // Generate TypeScript declarations
    // (handled by tsc in build script)
  },
  // For development server (useful for examples)
  server: {
    port: 3000,
    open: true
  }
});
