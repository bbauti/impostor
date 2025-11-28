<script setup lang="ts">
import { es } from '@nuxt/ui/locale'
</script>

<template>
  <UApp :locale="es">
    <NuxtLayout>
      <UMain class="relative">
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </UMain>
    </NuxtLayout>
  </UApp>
</template>
