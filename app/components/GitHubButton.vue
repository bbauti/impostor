<template>
  <ClientOnly>
    <UButton
      aria-label="GitHub"
      :icon="`i-lucide-github`"
      color="neutral"
      variant="ghost"
      size="sm"
    />
    <template #fallback>
      <div class="size-4" />
    </template>
  </ClientOnly>
</template>
