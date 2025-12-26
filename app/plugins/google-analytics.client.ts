declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const gaId = (config.public.googleAnalytics as { id?: string })?.id

  if (!gaId) {
    return
  }

  useHead({
    script: [
      {
        src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`,
        async: true,
      },
      {
        innerHTML: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `,
      },
    ],
  })

  const router = useRouter()
  router.afterEach((to) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', gaId, {
        page_path: to.fullPath,
      })
    }
  })
})
