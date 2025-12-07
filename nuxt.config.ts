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
    '@nuxtjs/mdc',
    '@nuxtjs/supabase'
  ],

  supabase: {
    redirect: false
  },

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
  },

  // Performance optimizations
  experimental: {
    // Enable payload extraction for faster navigation
    payloadExtraction: true,
    // Enable render JSON payload as inline script
    inlineRouteRules: true,
    // Enable headNext for better head management
    headNext: true,
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