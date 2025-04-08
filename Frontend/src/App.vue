<template>
  <div class="main-container">
    <router-view />
    <Footer v-if="$route.meta.showFooter" />
  </div>
</template>

<script setup>
import Footer from 'src/layouts/AppFooter.vue'
</script>

<style scoped>
.main-container {
  min-height: 100vh;
  padding-bottom: 90px;
}
</style>
