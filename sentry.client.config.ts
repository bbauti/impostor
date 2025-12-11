import * as Sentry from '@sentry/nuxt';

Sentry.init({
  dsn: useRuntimeConfig().public.sentry.dsn,
  integrations: [
    Sentry.replayIntegration()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});
