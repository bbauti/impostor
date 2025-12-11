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
    'vue-sonner/nuxt',
    '@vite-pwa/nuxt'
  ],

  devtools: { enabled: true },

  // App optimizations
  app: {
    head: {
      htmlAttrs: {
        lang: 'es'
      },
      title: 'Impostor - Juego de Deducción Social',
      viewport: 'width=device-width, initial-scale=1',
      charset: 'utf-8',
      meta: [
        { name: 'description', content: 'Juega Impostor, un juego de deducción social inspirado en Among Us. Crea salas, une a tus amigos y descubre quién es el impostor.' },
        { name: 'keywords', content: 'impostor, among us, juego, deducción social, online, multiplayer' },
        { name: 'author', content: 'Bautista Igarzabal' },
        { name: 'robots', content: 'index, follow' },
        { name: 'format-detection', content: 'telephone=no' },
        // Open Graph
        { property: 'og:title', content: 'Impostor - Juego de Deducción Social' },
        { property: 'og:description', content: 'Juega Impostor, un juego de deducción social inspirado en Among Us.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://impostor.bbauti.ar' },
        { property: 'og:image', content: 'https://impostor.bbauti.ar/og-image.png' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Impostor - Juego de Deducción Social' },
        { name: 'twitter:description', content: 'Juega Impostor, un juego de deducción social inspirado en Among Us.' },
        { name: 'twitter:image', content: 'https://impostor.bbauti.ar/og-image.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://impostor.bbauti.ar' }
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

  pwa: {
    devOptions: {
      enabled: false
    },
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,gif,svg,woff,woff2,ttf,eot,ico,ogg}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|gif|svg|ico|ogg)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'assets-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
          }
        },
        {
          urlPattern: /\/api\/.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 // 1 day
            }
          }
        },
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 6 // 6 hours
            }
          }
        }
      ]
    },
    manifest: {
      name: 'Impostor - Juego de Deducción Social',
      short_name: 'Impostor',
      description: 'Juega Impostor, un juego de deducción social inspirado en Among Us. Crea salas, une a tus amigos y descubre quién es el impostor.',
      theme_color: '#000000',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        {
          src: '/favicon.ico',
          sizes: '48x48',
          type: 'image/x-icon'
        }
      ],
      categories: ['games', 'entertainment'],
      lang: 'es'
    }
  },

  supabase: {
    redirect: false
  }
});
