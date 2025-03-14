<template>
  <div class="fullscreen bg-normal40 text-center flex flex-center">
    <div>
      <div style="width: 100%" class="flex justify-center">
        <div style="width: 90%">
          <q-img :src="monsterImg" :ratio="1" />
        </div>
      </div>
      <div class="column text-dark90 text-body1 q-mt-xl">
        <span>Vous avez trouvé le monstre de quizFiesta !</span>
        <span>Revenez en lieux sûr pour le laisser tranquille</span>
      </div>

      <div style="font-size: 10vh" class="text-dark90">404</div>

      <q-btn color="light20" text-color="dark" to="/" label="Revenir en lieux sûr" no-caps />
    </div>
  </div>
</template>

<script setup>
import monsterImg from 'src/assets/monsterOfQuizFiesta.png'
</script>
