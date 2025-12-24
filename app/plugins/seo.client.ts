export default defineNuxtPlugin(() => {
  useHead({
    script: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Impostor - Juego de Deducción Social",
          description:
            "Juega Impostor Online GRATIS - El mejor juego de deducción social en español. Crea salas privadas, invita amigos y descubre quién es el impostor.",
          url: "https://impostor.bbauti.ar",
          applicationCategory: "Game",
          operatingSystem: "Any",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          publisher: {
            "@type": "Organization",
            name: "Impostor",
            url: "https://impostor.bbauti.ar",
            logo: {
              "@type": "ImageObject",
              url: "https://impostor.bbauti.ar/web-app-manifest-512x512.png",
            },
          },
          inLanguage: "es-ES",
          browserRequirements: "Requires JavaScript. Requires HTML5.",
          keywords:
            "impostor, impostor online, juego impostor, deducción social, among us alternativa, juego multijugador online",
        }),
      },
    ],
  })
})
