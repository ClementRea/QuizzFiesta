<template>
  <div id="q-app">
    <q-layout view="hHh lpR fFf">
      <AppHeader v-if="$route.meta.showHeader" />

      <router-view />
    </q-layout>
  </div>
</template>

<script setup>
import AppHeader from 'src/components/MainNavbar.vue'
</script>

<style>
body {
  margin: 0;
  font-family: 'Roboto', sans-serif;
}

#q-app {
  min-height: 100vh;
}
</style>
