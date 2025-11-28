<script setup lang="ts">
import { ref } from 'vue'

const mode = ref<'choose' | 'create' | 'join'>('choose')
</script>

<template>
  <UPage>
      <!-- Header -->
      <ProseH1 class="mx-auto w-fit mt-4 md:mt-6 mb-4! md:mb-8!">
        Impostor
      </ProseH1>

      <div class="flex items-center gap-8 justify-center">
        <RoomTabs />
      </div>
  </UPage>
</template>
