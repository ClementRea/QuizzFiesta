<template>
  <div class="container bg-light30 flex column justify-center items-center rounded-borders-bottom">
    <q-img class="logo" :src="logo" alt="logo" />
    <div class="span_container flex justify-end column items-start q-pl-lg q-mb-xl">
      <span class="text-secondary text-bold text-subtitle1">L'application de quiz ludique</span>
      <span class="text-secondary text-bold text-subtitle2">Pour vous défier entre amis !</span>
    </div>
  </div>
</template>

<script setup>
import logo from '../../assets/logo_quiz_fiesta.svg'
</script>

<style scoped>
.container {
  position: relative;
  z-index: 99;
  border-radius: 0px 0px 20px 20px;
}

.logo {
  width: 200px;
}

.span_container {
  width: 100%;
}
</style>
