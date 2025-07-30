<template>
  <div class="q-pa-md">
    <q-card class="bg-secondary q-pa-sm">
      <q-tabs
        v-model="tab"
        class="text-secondary bg-primary custom-nav-tabs"
        active-color="primary"
        narrow-indicator
        indicator-color="transparent"
        no-caps
      >
        <q-tab
          name="organisation"
          label="Mon organisation"
          class="q-py-sm q-px-md"
          :class="tab === 'organisation' ? 'text-weight-bold bg-secondary' : ''"
        />
        <q-tab
          name="statistiques"
          label="Statistiques"
          class="q-py-sm q-px-md"
          :class="tab === 'statistiques' ? 'text-weight-bold bg-secondary' : ''"
        />
      </q-tabs>

      <q-tab-panels v-model="tab" class="q-mt-sm" animated>
        <q-tab-panel name="organisation" class="q-pa-md">
          <h4 class="q-mt-none">Contenu de l'organisation</h4>
          <p>Informations sur votre organisation ici...</p>
        </q-tab-panel>

        <q-tab-panel name="statistiques" class="q-pa-md">
          <h4 class="q-mt-none">Statistiques</h4>
          <p>Données statistiques ici...</p>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const tab = ref('statistiques')
</script>

<style scoped lang="scss">
.q-tabs {
  padding: 8px;
}

.q-tab {
  border-radius: 4px;
  margin: 0 4px;
}

.custom-nav-tabs {
  border-radius: 8px !important;
  border: 1px solid $dark80 !important;
}
</style>
