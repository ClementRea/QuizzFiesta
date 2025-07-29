<template>
  <div class="fullscreen bg-gradient-primary text-center flex flex-center">
    <div>
      <div style="width: 100%" class="flex justify-center">
        <div style="width: 90%">
          <q-img :src="monsterImg" :ratio="1" />
        </div>
      </div>
      <div class="column text-secondary text-body1 q-mt-xl">
        <span>Vous avez trouvé le monstre de QuizzFiesta</span>
        <span>Mieux vaut pas le déranger ! </span>
      </div>

      <div style="font-size: 10vh" class="text-secondary">404</div>

      <q-btn
        color="primary"
        text-color="secondary"
        to="/"
        label="Par ici !"
        no-caps
        class="text-body1"
      />
    </div>
  </div>
</template>

<script setup>
import monsterImg from 'src/assets/monsterOfQuizFiesta.png'
</script>
