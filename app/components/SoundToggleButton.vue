<script setup lang="ts">
const soundEffects = useSoundEffects();
</script>

<template>
  <ClientOnly>
    <UButton
      :aria-label="soundEffects.isMuted.value ? 'Activar sonido' : 'Silenciar'"
      :icon="soundEffects.isMuted.value ? 'i-lucide-volume-x' : 'i-lucide-volume-2'"
      color="neutral"
      variant="ghost"
      @click="soundEffects.toggleMute()"
    />
    <template #fallback>
      <div class="size-8" />
    </template>
  </ClientOnly>
</template>
