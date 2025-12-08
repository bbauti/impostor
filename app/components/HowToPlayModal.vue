<script setup lang="ts">
const markdownContent = `
### Objetivo del juego

Impostor es un juego de deducción social donde los jugadores deben identificar quién es el impostor entre ellos.

---

### Roles

* **Jugadores normales:** Reciben una palabra secreta que todos comparten.
* **Impostor:** No conoce la palabra secreta y debe intentar descubrirla sin ser descubierto.

---

### Cómo se juega

1. **Revelación de roles:** Cada jugador ve su rol y palabra (si no es impostor).
2. **Discusión:** Los jugadores se turnan para dar pistas sobre la palabra sin revelarla directamente.
3. **Votación:** Después de la discusión, todos votan por quien creen que es el impostor.
4. **Resultados:** El jugador con más votos es eliminado y se revela si era el impostor o no.

---

### Consejos

* Si eres jugador normal: Da pistas específicas pero no tan obvias.
* Si eres el impostor: Escucha atentamente y trata de imitar el comportamiento de los demás.
* Observa las reacciones y respuestas de todos los jugadores.
`;
</script>

<template>
  <UModal title="Como jugar">
    <UButton
      icon="i-heroicons-information-circle"
      color="neutral"
      variant="ghost"
      size="lg"
      aria-label="Como jugar"
    />
    <template #body>
      <main>
        <MDC :value="markdownContent" />
      </main>
    </template>
  </UModal>
</template>
