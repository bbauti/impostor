// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@sentry/nuxt/module",
    "@nuxt/hints",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/ui",
    "@nuxtjs/mdc",
    "@nuxtjs/supabase",
    "vue-sonner/nuxt",
    "@vite-pwa/nuxt",
    // Removed @nuxtjs/seo due to Cloudflare Workers incompatibility
    // Using manual SEO meta tags in app.head instead
  ],

  devtools: { enabled: true },

  // App optimizations
  app: {
    head: {
      htmlAttrs: {
        lang: "es",
      },
      title: "Impostor - Juego de Deducción Social",
      viewport:
        "width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=yes",
      charset: "utf-8",
      meta: [
        // Primary SEO
        {
          name: "description",
          content:
            "Juega Impostor Online GRATIS - El mejor juego de deducción social en español. Crea salas privadas, invita amigos y descubre quién es el impostor. Sin descargas, juega desde el navegador.",
        },
        {
          name: "keywords",
          content:
            "impostor, impostor online, juego impostor, jugar impostor, impostor juego, deducción social, juego deducción social online, among us alternativa, juego tipo among us, impostor gratis, jugar impostor online gratis, juego de roles online, encontrar al impostor, juego multijugador online, juego impostor gratis, juego deducir impostor",
        },
        { name: "author", content: "Bautista Igarzabal" },
        {
          name: "robots",
          content:
            "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        { name: "format-detection", content: "telephone=no" },
        { name: "theme-color", content: "#000000" },
        // Open Graph
        {
          property: "og:title",
          content: "Impostor - Juego de Deducción Social Online Gratis",
        },
        {
          property: "og:description",
          content:
            "Juega Impostor Online GRATIS - El mejor juego de deducción social en español. Crea salas, invita amigos y descubre quién es el impostor.",
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://impostor.bbauti.ar" },
        {
          property: "og:image",
          content: "https://impostor.bbauti.ar/og-image.png",
        },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        {
          property: "og:image:alt",
          content: "Impostor - Juego de Deducción Social Online",
        },
        { property: "og:locale", content: "es_ES" },
        { property: "og:site_name", content: "Impostor" },
        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Impostor - Juego de Deducción Social Online Gratis",
        },
        {
          name: "twitter:description",
          content:
            "Juega Impostor Online GRATIS - El mejor juego de deducción social. Crea salas, invita amigos y descubre quién es el impostor.",
        },
        {
          name: "twitter:image",
          content: "https://impostor.bbauti.ar/og-image.png",
        },
        {
          name: "twitter:image:alt",
          content: "Impostor - Juego de Deducción Social Online",
        },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        {
          rel: "icon",
          type: "image/png",
          sizes: "96x96",
          href: "/favicon-96x96.png",
        },
        { rel: "shortcut icon", href: "/favicon.ico" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        { rel: "canonical", href: "https://impostor.bbauti.ar" },
        // Preconnect for performance
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
      ],
    },
  },

  css: ["~/assets/css/main.css"],

  // Router optimizations
  router: {
    options: {
      strict: true,
    },
  },

  runtimeConfig: {
    public: {
      sentry: {
        dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
      },
    },
  },

  // Build optimizations
  build: {
    transpile: [],
  },

  sourcemap: { client: "hidden" },

  // Enable features for better performance
  features: {
    inlineStyles: true,
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: false,
    // Enable render JSON payload as inline script
    inlineRouteRules: true,
    // Enable headNext for better head management
    headNext: true,
  },
  compatibilityDate: "2025-07-15",

  nitro: {
    preset: "cloudflare-pages",
    minify: true,
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },
  },

  // Vue and Vite optimizations
  vite: {
    build: {
      // Enable minification
      minify: "esbuild",
      // Optimize CSS code splitting
      cssCodeSplit: true,
      // Target modern browsers for smaller bundles
      target: "esnext",
      // Smaller chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Enable CSS minification
      cssMinify: true,
    },
    // Enable CSS optimization
    css: {
      devSourcemap: false,
    },
    // Enable esbuild optimizations
    esbuild: {
      legalComments: "none",
    },
    optimizeDeps: {
      include: ["@vueuse/core"],
    },
  },

  // Optimize font loading
  fonts: {
    defaults: {
      weights: [400, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: {
        "sans-serif": ["system-ui", "-apple-system", "BlinkMacSystemFont"],
      },
    },
  },

  // Icon optimization
  icon: {
    serverBundle: {
      collections: ["heroicons", "lucide"],
    },
  },

  pwa: {
    devOptions: {
      enabled: false,
    },
    registerType: "autoUpdate",
    workbox: {
      navigateFallback: null,
      globPatterns: [
        "**/*.{js,css,html,png,jpg,jpeg,gif,svg,woff,woff2,ttf,eot,ico,ogg}",
      ],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|gif|svg|ico|ogg)$/,
          handler: "CacheFirst",
          options: {
            cacheName: "assets-cache",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
        {
          urlPattern: /\/api\/.*/,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24, // 1 day
            },
          },
        },
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
          handler: "NetworkFirst",
          options: {
            cacheName: "supabase-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 6, // 6 hours
            },
          },
        },
      ],
    },
    manifest: {
      name: "Impostor - Juego de Deducción Social",
      short_name: "Impostor",
      description:
        "Juega Impostor, un juego de deducción social inspirado en Among Us. Crea salas, une a tus amigos y descubre quién es el impostor.",
      theme_color: "#000000",
      background_color: "#ffffff",
      display: "standalone",
      start_url: "/",
      scope: "/",
      icons: [
        {
          src: "/favicon.ico",
          sizes: "48x48",
          type: "image/x-icon",
        },
        {
          src: "/web-app-manifest-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/web-app-manifest-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
          purpose: "apple touch icon",
        },
      ],
      categories: ["games", "entertainment"],
      lang: "es",
    },
  },

  // Robots configuration
  robots: {
    disallow: ["/room/"],
    sitemap: "/sitemap.xml",
  },

  // Schema.org configuration
  schemaOrg: {
    identity: {
      type: "Organization",
      name: "Impostor",
      url: "https://impostor.bbauti.ar",
      logo: "https://impostor.bbauti.ar/web-app-manifest-512x512.png",
    },
  },

  // Sitemap configuration
  sitemap: {
    exclude: ["/room/**"],
    defaults: {
      changefreq: "weekly",
      priority: 1,
    },
  },

  supabase: {
    redirect: false,
  },
})
