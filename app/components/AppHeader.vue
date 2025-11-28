<script setup lang="ts">
const { error } = defineProps<{ error?: boolean }>()
</script>

<template>
  <header
    class="flex justify-between p-2 border-b border-default h-"
    :class="{ 'border-x max-w-(--ui-container) mx-auto': !error }"
  >
    <ULink to="/" class="font-bold text-bg-accented ml-2 tracking-wide">Impostor</ULink>
    <div>
      <GitHubButton />
      <ColorModeButton />
    </div>
  </header>
</template>
