<template>
  <Header />
  <div class="formLayout">
    <FormLayout
      title="Connexion"
      @submit="submitForm"
      :disabledSubmit="!isFormValid"
      actionType="login"
      :disabledSubmitMessage="validationMessage"
    >
      <template #content>
        <div class="q-gutter-y-lg">
          <q-input
            outlined
            v-model="email"
            label="Email"
            class="custom-border"
            bg-color="white"
            label-color="dark80"
            color="dark70"
            :rules="[
              (val) => !!val || 'L\'email est requis',
              (val) => isValidEmail(val) || 'Veuillez entrer une adresse email valide',
            ]"
          />
          <q-input
            outlined
            v-model="password"
            label="Mot de passe"
            class="custom-border"
            bg-color="white"
            label-color="dark80"
            color="dark70"
            :type="isPasswordVisible ? 'text' : 'password'"
            :rules="[(val) => !!val || 'Le mot de passe est requis']"
          >
            <template #append>
              <q-icon
                :name="isPasswordVisible ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="isPasswordVisible = !isPasswordVisible"
              />
            </template>
          </q-input>
          <div class="text-right q-ma-none">
            <q-btn
              flat
              class="text-dark80"
              style="text-decoration: underline"
              @click="router.push('/reset-password')"
              >Mot de passe oublié ?</q-btn
            >
          </div>
        </div>
      </template>
    </FormLayout>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import FormLayout from '../../layouts/FormLayout.vue'
import Header from '../../components/AuthHeader.vue'
import AuthService from 'src/services/AuthService'

const email = ref('')
const password = ref('')
const isPasswordVisible = ref(false)

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

// On vérifie la validité du formulaire
const isFormValid = computed(() => {
  return isValidEmail(email.value) && password.value.length > 0
})

const validationMessage = computed(() => {
  if (!isValidEmail(email.value)) return 'Veuillez entrer une adresse email valide'
  if (password.value.length === 0) return 'Le mot de passe est requis'
  return 'Veuillez remplir correctement tous les champs'
})

// On submit le formulaire
const submitForm = async (type) => {
  if (type === 'register') {
    router.push('/register')
  } else if (type === 'login' && isFormValid.value) {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email: email.value,
        password: password.value,
      })

      AuthService.setToken(response.data.token)

      const redirectPath = route.query.redirect || '/accueil'
      router.push(redirectPath)
    } catch (error) {
      console.error('Erreur lors de la connexion', error)
      $q.notify({
        color: 'negative',
        message: 'Email ou mot de passe incorrect.',
      })
    }
  }
}
</script>

<style scoped>
.formLayout {
  position: relative;
  margin-top: -16px;
  z-index: 1;
}
</style>
