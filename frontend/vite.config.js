import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: /\.(jsx|js|tsx|ts)$/,  // Allow JSX in .js files
    }),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    })
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 3000,
    open: true,
    strictPort: true
  },
  build: {
    // Target modern browsers for smaller bundle
    target: 'es2015',
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // Manual chunking strategy for optimal loading
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Animation libraries
            if (id.includes('framer-motion')) {
              return 'motion-vendor';
            }
            // UI libraries
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'icons-vendor';
            }
            // HTTP and API libraries
            if (id.includes('axios')) {
              return 'http-vendor';
            }
            // Utility libraries
            if (id.includes('lodash') || id.includes('date-fns')) {
              return 'utils-vendor';
            }
            // Toast notifications
            if (id.includes('react-hot-toast')) {
              return 'toast-vendor';
            }
            // All other node_modules
            return 'vendor';
          }
        },
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|ttf|eot/i.test(extType)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js'
      }
    },
    // Source maps for production debugging
    sourcemap: process.env.NODE_ENV !== 'production'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'axios',
      'react-hot-toast'
    ]
  },
  // Performance optimizations
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})