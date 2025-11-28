<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  code: z.string({ error: 'El codigo es requerido' }).min(6, 'Tienen que ser 6 caracteres como minimo')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  code: undefined
})

const loading = ref(false)
const error = ref<string>('')

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  const roomCode = event.data.code

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch(`/api/rooms/${roomCode}`) as { success: boolean }
    if (response.success) navigateTo(`/room/${roomCode}`)
  } catch (e: any) {
    error.value = 'No se ha encontrado esa sala'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm
    ref="form"
    :schema="schema"
    :state="state"
    :validate-on="['change']"
    class="flex gap-2 items-center"
    @submit="onSubmit"
  >
    <UFormField
      ref="codeField"
      name="code"
      label="Codigo"
      class="w-full"
      :error="error ? error : undefined"
      required
    >
      <div class="flex gap-2 items-center">
        <UInput
          v-model="state.code"
          placeholder="2o4xu97cnqw"
          class="w-full"
        />
        <UButton
          :loading="loading"
          type="submit"
          variant="outline"
        >
          Entrar
        </UButton>
      </div>
    </UFormField>
  </UForm>
</template>
