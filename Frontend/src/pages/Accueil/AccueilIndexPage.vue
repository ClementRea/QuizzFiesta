<template>
  <main class="full-width" aria-label="Accueil QuizFiesta">
    <header class="row justify-between q-pa-md">
      <div class="col column no-wrap">
        <h1 class="text-h6 text-secondary text-bold q-mb-none">Bonjour {{ userData.userName }} !</h1>
        <h2 class="text-body1 text-secondary q-mt-none q-mb-xs">Trouvez des quiz ici</h2>
      </div>
    </header>

    <section aria-label="Recherche de quiz">
      <form role="search" aria-label="Formulaire de recherche de quiz" @submit.prevent>
        <q-input
          aria-label="Rechercher un quiz par nom ou catégorie"
          placeholder="Rechercher (Management, Jeux...)"
          outlined
          rounded
          bg-color="primary"
          class="q-pa-md custom-input-shadow"
          tabindex="0"
        >
          <template v-slot:prepend>
            <q-icon name="search" aria-hidden="true" />
          </template>
        </q-input>
      </form>
    </section>

    <nav aria-label="Actions principales">
      <section class="row q-gutter-sm q-pa-md" role="group">
        <q-btn
          label="Rejoindre un quiz"
          color="primary"
          text-color="secondary"
          rounded
          class="col"
          size="md"
          icon="mdi-gamepad-variant"
          no-caps
          @click="router.push('/quiz/join')"
          tabindex="0"
          aria-label="Rejoindre un quiz existant avec un code"
        />
        <q-btn
          label="Créer un quiz"
          color="secondary"
          text-color="primary"
          rounded
          class="col"
          size="md"
          icon="mdi-plus"
          no-caps
          @click="router.push('/quiz/create')"
          tabindex="0"
          aria-label="Créer un nouveau quiz"
        />
      </section>
    </nav>

    <section class="q-px-md q-pb-md" aria-label="Gestion de mes quiz">
      <q-btn
        label="Gérer mes Quiz"
        color="secondary"
        text-color="primary"
        rounded
        class="full-width"
        size="md"
        icon="mdi-cog"
        no-caps
        @click="router.push('/quiz/manage')"
        tabindex="0"
        aria-label="Gérer et modifier mes quiz existants"
      />
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import UserService from 'src/services/UserService'

const $q = useQuasar()

const loading = ref(true)
const error = ref(null)
const router = useRouter()

const userData = ref({
  userName: '',
  avatar: '',
})

const getUser = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await UserService.getMe()
    const user = response.data.user

    userData.value = {
      userName: user.userName || '',
      avatar: user.avatar || '',
    }
    console.log('avatar', user.avatar)
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Une erreur est survenue'
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger les informations du compte',
    })
  } finally {
    loading.value = false
  }
}

onMounted(getUser)
</script>

<style scoped>
.custom-input-shadow :deep(.q-field__control) {
  box-shadow: inset 0 5px 4px rgba(0, 0, 0, 0.15);
}
</style>
