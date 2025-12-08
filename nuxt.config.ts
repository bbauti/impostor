// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/hints',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/mdc',
    '@nuxtjs/supabase',
    'vue-sonner/nuxt'
  ],
  devtools: { enabled: true },

  // App optimizations
  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1',
      charset: 'utf-8',
      meta: [
        { name: 'format-detection', content: 'telephone=no' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

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

  // Enable features for better performance
  features: {
    inlineStyles: true
  },

  // Performance optimizations
  experimental: {
    // Enable payload extraction for faster navigation
    payloadExtraction: true,
    // Enable render JSON payload as inline script
    inlineRouteRules: true,
    // Enable headNext for better head management
    headNext: true
  },
  compatibilityDate: '2025-07-15',

  nitro: {
    minify: true,
    compressPublicAssets: {
      gzip: true,
      brotli: true
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
      // Smaller chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Enable CSS minification
      cssMinify: true
    },
    // Enable CSS optimization
    css: {
      devSourcemap: false
    },
    // Enable esbuild optimizations
    esbuild: {
      legalComments: 'none'
    },
    optimizeDeps: {
      include: ['@vueuse/core']
    }
  },

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

  // Icon optimization
  icon: {
    serverBundle: {
      collections: ['heroicons', 'lucide']
    }
  },

  supabase: {
    redirect: false
  }
});
