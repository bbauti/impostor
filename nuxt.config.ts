// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/hints',
    '@nuxt/icon',
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

  nitro: {
    experimental: {
      websocket: true
    }
  }
})