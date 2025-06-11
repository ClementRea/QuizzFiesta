<template>
  <div class="row items-center justify-between full-width q-pa-md" style="margin-bottom: 116px">
    <div class="row items-center">
      <BackArrow v-if="$route.meta.showBackArrow" />
      <span class="text-h4 text-dark90 text-bold q-ma-none">Profil</span>
    </div>
    <q-icon name="mdi-cog" color="dark90" size="lg" @click="router.push('/settings')" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import BackArrow from 'src/components/BackArrow.vue'

const router = useRouter()
</script>
