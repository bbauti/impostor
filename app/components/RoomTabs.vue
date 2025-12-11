<script setup lang="ts">
import { useOnline } from '@vueuse/core';

const isOnline = useOnline();

const items = computed(() => {
  const baseItems = [
    {
      label: 'Unirse a una sala',
      icon: 'i-lucide-user',
      slot: 'join',
      value: 'join',
      disabled: !isOnline.value
    },
    {
      label: 'Crear una partida',
      icon: 'i-lucide-lock',
      slot: 'create',
      value: 'create'
    }
  ];
  return baseItems;
});

const defaultTab = computed(() => isOnline.value ? 'join' : 'create');
</script>

<template>
  <UTabs
    :items="items"
    :default-value="defaultTab"
  >
    <template #join>
      <EnterByCode />
    </template>

    <template #create>
      <CreateRoom />
    </template>
  </UTabs>
</template>
