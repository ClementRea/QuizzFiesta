<template>
  <section class="bg-white q-pa-lg q-mt-lg shadow-4">
    <div class="row justify-center">
      <div class="col-12 col-md-8">
        <div class="text-center q-mb-lg">
          <h2 class="text-h5 text-secondary text-weight-bold">Mes Actions</h2>
        </div>

        <div class="row q-gutter-md justify-center">
          <q-btn
            label="Gérer mes Quiz"
            color="secondary"
            rounded
            icon="mdi-cog"
            class="col-12 col-sm-5 shadow-2"
            size="md"
            no-caps
            @click="router.push('/quiz/manage')"
            outline
          />
          <q-btn
            label="Statistiques"
            color="secondary"
            rounded
            icon="mdi-chart-bar"
            class="col-12 col-sm-5 shadow-2"
            size="md"
            no-caps
            outline
            disabled
          />

          <q-btn
            label="Faite un don !"
            color="secondary"
            rounded
            icon="mdi-gift"
            class="col-12 col-sm-5 shadow-2"
            size="md"
            no-caps
            outline
            @click="router.push('/payment/checkout')"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
