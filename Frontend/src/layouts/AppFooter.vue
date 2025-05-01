<template>
  <q-layout class="layout-container">
    <q-footer class="bg-light20 q-py-sm footer-container" style="border-radius: 50px 50px 0px 0px">
      <q-toolbar class="no-wrap">
        <div class="row full-width justify-evenly items-center no-wrap q-px-xs">
          <!-- Utilisation de justify-evenly pour distribuer l'espace sur les grands écrans -->
          <div
            class="col-auto flex flex-center column items-center q-px-sm cursor-pointer"
            @click="goTo('/scores')"
          >
            <q-btn
              flat
              round
              :class="[{ 'bg-dark90': isActive('/scores'), 'bg-light20': !isActive('/scores') }]"
              :text-color="isActive('/scores') ? 'light20' : 'dark90'"
            >
              <q-icon name="mdi-trophy-variant" size="md" />
            </q-btn>
            <div class="text-weight-medium q-mt-xs text-dark90">Scores</div>
          </div>

          <div
            class="col-auto flex flex-center column items-center q-px-sm cursor-pointer"
            @click="goTo('/search')"
          >
            <q-btn
              flat
              round
              :class="[{ 'bg-dark90': isActive('/search'), 'bg-light20': !isActive('/search') }]"
              :text-color="isActive('/search') ? 'light20' : 'dark90'"
            >
              <q-icon name="mdi-magnify" size="md" />
            </q-btn>
            <div class="text-weight-medium q-mt-xs text-dark90">Rechercher</div>
          </div>

          <div
            class="col-auto flex flex-center column items-center q-px-sm cursor-pointer"
            @click="goTo('/accueil')"
          >
            <q-btn
              flat
              round
              :class="[{ 'bg-dark90': isActive('/accueil'), 'bg-light20': !isActive('/accueil') }]"
              :text-color="isActive('/accueil') ? 'light20' : 'dark90'"
            >
              <q-icon name="mdi-home" size="md" />
            </q-btn>
            <div class="text-weight-medium q-mt-xs text-dark90">Accueil</div>
          </div>

          <div
            class="col-auto flex flex-center column items-center q-px-sm cursor-pointer"
            @click="goTo('/account')"
          >
            <q-btn
              flat
              round
              :class="[{ 'bg-dark90': isActive('/account'), 'bg-light20': !isActive('/account') }]"
              :text-color="isActive('/account') ? 'light20' : 'dark90'"
            >
              <q-icon name="mdi-account" size="md" />
            </q-btn>
            <div class="text-weight-medium q-mt-xs text-dark90">Compte</div>
          </div>
        </div>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

//Vérifier sur quellle page on est
const isActive = (path) => {
  return route.path === path
}

//Redirection vers une page
const goTo = (path) => {
  router.push(path)
}
</script>

<style scoped>
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  grid-gap: 2px;
  width: 24px;
  height: 24px;
}

.grid-item {
  width: 100%;
  height: 100%;
}

.footer-container {
  z-index: 1000;
  height: auto;
  min-height: 70px;
  position: fixed;
  bottom: 0;
  width: 100%;
}

.layout-container {
  min-height: 0px !important;
}

@media (max-width: 340px) {
  .q-px-sm {
    padding-left: 2px !important;
    padding-right: 2px !important;
  }
}

@media (min-width: 768px) {
  .row.justify-evenly > .col-auto {
    min-width: 100px;
  }
}

@media (min-width: 1200px) {
  .row.justify-evenly > .col-auto {
    min-width: 150px;
  }
}
</style>
