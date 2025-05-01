<template>
  <div
    class="row flex items-center justify-between full-width q-pa-md"
    style="margin-bottom: 116px"
  >
    <span class="text-h4 text-dark90 text-bold">Profil</span>
    <!-- TODO : rediriger vers la page de parametres et faire cette page là -->
    <q-icon name="mdi-cog" color="dark90" size="lg" @click="router.push('/settings')" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
