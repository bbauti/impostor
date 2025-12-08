<script setup lang="ts">
const items = [
  {
    label: 'Unirse a una sala',
    icon: 'i-lucide-user',
    slot: 'account'
  },
  {
    label: 'Crear una partida',
    icon: 'i-lucide-lock',
    slot: 'password'
  }
];
</script>

<template>
  <UTabs :items="items">
    <template #account>
      <EnterByCode />
    </template>

    <template #password>
      <CreateRoom />
    </template>
  </UTabs>
</template>
