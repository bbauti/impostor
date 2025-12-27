import * as Sentry from "@sentry/nuxt"

Sentry.init({
  dsn: useRuntimeConfig().public.sentry.dsn,
  tracesSampleRate: 1.0,
  enableLogs: true,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
})
