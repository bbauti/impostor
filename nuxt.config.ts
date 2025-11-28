// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/hints',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/mdc'
  ],

  css: ['~/assets/css/main.css'],

  eslint: {
    config: {
      stylistic: {
        indent: 2,
        semi: true,
        quotes: 'single',
        commaDangle: 'never'
      }
    }
  },

  // Cloudflare Pages optimizations
  nitro: {
    preset: 'cloudflare-pages',
    experimental: {
      websocket: true
    },
    // Enable minification and compression
    minify: true,
    compressPublicAssets: {
      gzip: true,
      brotli: true
    },
    // Prerender routes for better performance
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      failOnError: false
    },
    // Route rules for caching and optimization
    routeRules: {
      // Homepage - prerender and cache
      '/': {
        prerender: true,
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=3600'
        }
      },
      // API routes - no cache, enable CORS
      '/api/**': {
        cors: true,
        headers: {
          'cache-control': 'no-cache, no-store, must-revalidate',
          'pragma': 'no-cache',
          'expires': '0'
        }
      },
      // Nuxt build assets - aggressive caching
      '/_nuxt/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable'
        }
      },
      // WebSocket route - no cache
      '/_ws': {
        headers: {
          'cache-control': 'no-cache, no-store, must-revalidate'
        }
      },
      // Room pages - SPA mode for dynamic routes
      '/room/**': {
        ssr: true,
        headers: {
          'cache-control': 'no-cache, no-store, must-revalidate'
        }
      }
    },
    // Cloudflare compatibility settings
    cloudflarePagesConfig: {
      compatibility_date: '2025-01-28',
      compatibility_flags: ['nodejs_compat']
    }
  },

  // Vue and Vite optimizations
  vite: {
    build: {
      // Enable minification
      minify: 'esbuild',
      // Optimize CSS code splitting
      cssCodeSplit: true,
      // Target modern browsers for smaller bundles
      target: 'esnext',
      // Optimize chunk size
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Split vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('vue') || id.includes('vue-router')) {
                return 'vendor';
              }
              if (id.includes('@vueuse')) {
                return 'vueuse';
              }
              return 'vendor-libs';
            }
          },
          // Optimize chunk file names
          chunkFileNames: '_nuxt/[name]-[hash].js',
          entryFileNames: '_nuxt/[name]-[hash].js',
          assetFileNames: '_nuxt/[name]-[hash][extname]'
        }
      },
      // Smaller chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Enable CSS minification
      cssMinify: true
    },
    // Enable CSS optimization
    css: {
      devSourcemap: false
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['vue', 'vue-router', '@vueuse/core']
    },
    // Enable esbuild optimizations
    esbuild: {
      legalComments: 'none'
    }
  },

  // App optimizations
  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1',
      charset: 'utf-8',
      meta: [
        { name: 'format-detection', content: 'telephone=no' }
      ]
    },
    // Enable page transitions for better UX
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  // Performance optimizations
  experimental: {
    // Enable payload extraction for faster navigation
    payloadExtraction: true,
    // Enable component islands for partial hydration
    componentIslands: true,
    // Enable view transitions API
    viewTransition: true,
    // Enable render JSON payload as inline script
    inlineRouteRules: true,
    // Enable headNext for better head management
    headNext: true,
    // Enable restore state after hydration
    restoreState: true,
    // Enable write early hints
    writeEarlyHints: true
  },

  // Optimize font loading
  fonts: {
    defaults: {
      weights: [400, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: {
        'sans-serif': ['system-ui', '-apple-system', 'BlinkMacSystemFont']
      }
    }
  },

  // Enable features for better performance
  features: {
    inlineStyles: true
  },

  // Image optimization
  image: {
    provider: 'cloudflare',
    cloudflare: {
      baseURL: process.env.NUXT_PUBLIC_SITE_URL || 'https://your-site.pages.dev'
    },
    formats: ['webp', 'avif'],
    quality: 80,
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    }
  },

  // Router optimizations
  router: {
    options: {
      strict: true
    }
  },

  // Build optimizations
  build: {
    transpile: []
  },

  // Icon optimization
  icon: {
    serverBundle: {
      collections: ['heroicons', 'lucide']
    }
  }
})