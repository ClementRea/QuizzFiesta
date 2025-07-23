<template>
  <q-btn
    flat
    round
    icon="arrow_back"
    color="secondary"
    text-color="secondary"
    class="q-mr-md"
    size="lg"
    aria-label="Retourner à la page précédente"
    title="Retourner à la page précédente"
    @click="goBack"
  />
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  router.back()
}
</script>
