<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    required: true
  }
});

useHead({
  htmlAttrs: {
    lang: 'es'
  }
});

useSeoMeta({
  title: 'No se ha encontrado esa pagina',
  description: 'Lo lamentamos! No hemos podido encontrar esa pagina.'
});
</script>

<template>
  <div>
    <AppHeader error />

    <UMain>
      <UContainer>
        <UPage>
          <UError
            :clear="{
              label: 'Volver al inicio'
            }"
            :error="{
              statusCode: error.statusCode,
              statusMessage: error.statusCode === 404 ? 'No se ha encontrado esa pagina' : error.statusMessage,
              message: error.statusCode === 404 ? 'Lo lamentamos! No hemos podido encontrar esa pagina.' : error.message
            }"
          />
        </UPage>
      </UContainer>
    </UMain>

    <UToaster />
  </div>
</template>
