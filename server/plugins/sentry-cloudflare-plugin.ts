import { sentryCloudflareNitroPlugin } from '@sentry/nuxt/module/plugins';

export default defineNitroPlugin(sentryCloudflareNitroPlugin({
  dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0
}));
