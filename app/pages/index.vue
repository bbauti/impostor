<script setup lang="ts">
useSeoMeta({
  title: 'Juego de Deducción Social Online Gratis',
  ogTitle: 'Impostor - Juego de Deducción Social Online Gratis',
  ogType: 'website',
  ogUrl: 'https://impostor.bbauti.ar',
  ogImage: 'https://impostor.bbauti.ar/og-image.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'Impostor - Juego de Deducción Social Online',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Impostor - Juego de Deducción Social Online Gratis',
  twitterImage: 'https://impostor.bbauti.ar/og-image.png',
});

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': ['VideoGame', 'WebApplication'],
        'name': 'Impostor - Juego de Deducción Social',
        'alternateName': ['Impostor Online', 'Juego Impostor', 'Impostor Gratis'],
        'description': 'Juega Impostor Online GRATIS - El mejor juego de deducción social en español. Crea salas privadas, invita amigos y descubre quién es el impostor.',
        'url': 'https://impostor.bbauti.ar',
        'applicationCategory': 'GameApplication',
        'genre': ['Deducción Social', 'Multijugador', 'Party Game', 'Juego de Roles'],
        'gamePlatform': ['Web Browser', 'Mobile Browser', 'PWA'],
        'operatingSystem': 'Any',
        'browserRequirements': 'Requires JavaScript',
        'inLanguage': 'es',
        'isAccessibleForFree': true,
        'numberOfPlayers': {
          '@type': 'QuantitativeValue',
          'minValue': 3,
          'maxValue': 10
        },
        'playMode': ['MultiPlayer', 'CoOp'],
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock'
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.8',
          'ratingCount': '150',
          'bestRating': '5',
          'worstRating': '1'
        },
        'author': {
          '@type': 'Person',
          'name': 'Bautista Igarzabal'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Impostor',
          'url': 'https://impostor.bbauti.ar',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://impostor.bbauti.ar/web-app-manifest-512x512.png'
          }
        }
      })
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': '¿Cómo jugar Impostor?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Impostor es un juego de deducción social donde los jugadores deben identificar quién es el impostor. Los jugadores normales reciben una palabra secreta, mientras que el impostor debe descubrirla sin ser descubierto. Se juega en rondas de discusión y votación.'
            }
          },
          {
            '@type': 'Question',
            'name': '¿Es gratis jugar Impostor?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Sí, Impostor es completamente gratis. No requiere registro ni descargas. Simplemente crea una sala, comparte el código con tus amigos y comienza a jugar desde el navegador.'
            }
          },
          {
            '@type': 'Question',
            'name': '¿Cuántos jugadores pueden jugar?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Impostor está diseñado para grupos de 3 a 10 jugadores. Puedes configurar entre 1 a 3 impostores según la cantidad de jugadores en la sala.'
            }
          },
          {
            '@type': 'Question',
            'name': '¿Necesito descargar algo para jugar?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No, Impostor funciona directamente en tu navegador web. Es compatible con computadoras, tablets y teléfonos móviles. Solo necesitas una conexión a internet.'
            }
          },
          {
            '@type': 'Question',
            'name': '¿Impostor es como Among Us?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Impostor está inspirado en juegos de deducción social como Among Us y Spyfall. La diferencia es que Impostor se juega completamente en el navegador, es gratis, y está en español con categorías de palabras argentinas.'
            }
          },
          {
            '@type': 'Question',
            'name': '¿Puedo jugar Impostor en el celular?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Sí, Impostor funciona perfectamente en celulares y tablets. Además, puedes instalarlo como una app (PWA) desde tu navegador para acceder más rápido.'
            }
          },
          {
            '@type': 'Question',
            'name': '¿Cómo creo una sala privada?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Para crear una sala privada, simplemente ingresa tu nombre y haz clic en Crear Sala. Recibirás un código único de 6 caracteres que puedes compartir con tus amigos para que se unan.'
            }
          },
          {
            '@type': 'Question',
            'name': '¿Cuánto dura una partida de Impostor?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Una partida típica de Impostor dura entre 5 y 15 minutos, dependiendo de la cantidad de jugadores y el tiempo de discusión configurado. Es perfecto para partidas rápidas con amigos.'
            }
          }
        ]
      })
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Inicio',
            'item': 'https://impostor.bbauti.ar'
          }
        ]
      })
    }
  ]
});
</script>

<template>
  <UPage>
    <div class="flex items-center justify-center gap-2 mt-4 md:mt-6 mb-4! md:mb-8!">
      <h1 class="text-4xl md:text-5xl font-bold m-0!">
        Impostor
      </h1>
      <HowToPlayModal />
    </div>

    <p class="text-center text-lg text-neutral-500 dark:text-neutral-400 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
      Juego de deducción social online gratis en español. Crea salas privadas, invita amigos y descubre al impostor.
    </p>

    <!-- Main Game Section -->
    <div class="flex items-center gap-8 justify-center">
      <RoomTabs />
    </div>

    <!-- Divider -->
    <div class="mt-16 md:mt-24 flex items-center gap-3">
      <div class="flex-1 border-t border-default" />
      <ProseP class="text-dimmed text-sm my-0">
        ?
      </ProseP>
      <div class="flex-1 border-t border-default" />
    </div>

    <!-- SEO Content Section -->
    <section class="mt-16 md:mt-24 max-w-4xl mx-auto px-4">
      <h2 class="text-2xl md:text-3xl font-bold text-center mb-8">
        ¿Qué es Impostor?
      </h2>
      <div class="grid md:grid-cols-2 gap-6 md:gap-8">
        <div class="p-6 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <h3 class="text-lg font-semibold mb-3">
            Juego de Deducción Social
          </h3>
          <p class="text-neutral-600 dark:text-neutral-300">
            Impostor es un juego multijugador donde debes usar tu ingenio para descubrir quién miente. Inspirado en Among Us, ofrece una experiencia de deducción social directamente desde tu navegador.
          </p>
        </div>
        <div class="p-6 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <h3 class="text-lg font-semibold mb-3">
            Gratis y Sin Descargas
          </h3>
          <p class="text-neutral-600 dark:text-neutral-300">
            Juega Impostor online gratis sin necesidad de instalar nada. Funciona en computadoras, tablets y móviles. Solo crea una sala y comparte el código con tus amigos.
          </p>
        </div>
        <div class="p-6 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <h3 class="text-lg font-semibold mb-3">
            Partidas Rápidas
          </h3>
          <p class="text-neutral-600 dark:text-neutral-300">
            Cada partida dura entre 5 y 15 minutos. Perfecto para jugar durante reuniones, fiestas o videollamadas con amigos y familia.
          </p>
        </div>
        <div class="p-6 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <h3 class="text-lg font-semibold mb-3">
            Salas Privadas
          </h3>
          <p class="text-neutral-600 dark:text-neutral-300">
            Crea salas privadas con código único para jugar solo con tus amigos. También puedes unirte a salas públicas para conocer nuevos jugadores.
          </p>
        </div>
      </div>
    </section>

    <!-- FAQ Section (visible for SEO) -->
    <section class="mt-16 md:mt-24 max-w-3xl mx-auto px-4 pb-16">
      <h2 class="text-2xl md:text-3xl font-bold text-center mb-8">
        Preguntas Frecuentes
      </h2>
      <div class="space-y-4">
        <details class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <summary class="font-semibold cursor-pointer">
            ¿Cómo jugar Impostor?
          </summary>
          <p class="mt-3 text-neutral-600 dark:text-neutral-300">
            Impostor es un juego de deducción social donde los jugadores deben identificar quién es el impostor. Los jugadores normales reciben una palabra secreta, mientras que el impostor debe descubrirla sin ser descubierto. Se juega en rondas de discusión y votación.
          </p>
        </details>
        <details class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <summary class="font-semibold cursor-pointer">
            ¿Es gratis jugar Impostor?
          </summary>
          <p class="mt-3 text-neutral-600 dark:text-neutral-300">
            Sí, Impostor es completamente gratis. No requiere registro ni descargas. Simplemente crea una sala, comparte el código con tus amigos y comienza a jugar desde el navegador.
          </p>
        </details>
        <details class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <summary class="font-semibold cursor-pointer">
            ¿Cuántos jugadores pueden jugar?
          </summary>
          <p class="mt-3 text-neutral-600 dark:text-neutral-300">
            Impostor está diseñado para grupos de 3 a 10 jugadores. Se recomienda un mínimo de 3 jugadores para una experiencia óptima de deducción social.
          </p>
        </details>
        <details class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <summary class="font-semibold cursor-pointer">
            ¿Necesito descargar algo para jugar?
          </summary>
          <p class="mt-3 text-neutral-600 dark:text-neutral-300">
            No, Impostor funciona directamente en tu navegador web. Es compatible con computadoras, tablets y teléfonos móviles. Solo necesitas una conexión a internet.
          </p>
        </details>
        <details class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <summary class="font-semibold cursor-pointer">
            ¿Impostor es como Among Us?
          </summary>
          <p class="mt-3 text-neutral-600 dark:text-neutral-300">
            Impostor está inspirado en juegos de deducción social como Among Us y Spyfall. La diferencia es que Impostor se juega completamente en el navegador, es gratis, y está en español con categorías de palabras argentinas.
          </p>
        </details>
        <details class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <summary class="font-semibold cursor-pointer">
            ¿Puedo jugar Impostor en el celular?
          </summary>
          <p class="mt-3 text-neutral-600 dark:text-neutral-300">
            Sí, Impostor funciona perfectamente en celulares y tablets. Además, puedes instalarlo como una app (PWA) desde tu navegador para acceder más rápido.
          </p>
        </details>
        <details class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <summary class="font-semibold cursor-pointer">
            ¿Cómo creo una sala privada?
          </summary>
          <p class="mt-3 text-neutral-600 dark:text-neutral-300">
            Para crear una sala privada, simplemente ingresa tu nombre y haz clic en Crear Sala. Recibirás un código único de 6 caracteres que puedes compartir con tus amigos para que se unan.
          </p>
        </details>
        <details class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <summary class="font-semibold cursor-pointer">
            ¿Cuánto dura una partida de Impostor?
          </summary>
          <p class="mt-3 text-neutral-600 dark:text-neutral-300">
            Una partida típica de Impostor dura entre 5 y 15 minutos, dependiendo de la cantidad de jugadores y el tiempo de discusión configurado. Es perfecto para partidas rápidas con amigos.
          </p>
        </details>
      </div>
    </section>
  </UPage>
</template>
