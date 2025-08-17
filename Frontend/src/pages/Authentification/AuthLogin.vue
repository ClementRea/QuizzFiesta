<template>
  <Header />
  <main class="formLayout" aria-label="Page de connexion">
    <section aria-label="Formulaire de connexion">
      <FormLayout
        title="Connexion"
        @submit="submitForm"
        :disabledSubmit="!isFormValid"
        actionType="login"
        :disabledSubmitMessage="validationMessage"
      >
        <template v-slot:content>
          <div class="q-gutter-y-lg">
            <q-input
              outlined
              v-model="email"
              label="Email"
              class="custom-border"
              bg-color="white"
              label-color="secondary"
              color="secondary"
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
              label-color="secondary"
              color="secondary"
              :type="isPasswordVisible ? 'text' : 'password'"
              :rules="[(val) => !!val || 'Le mot de passe est requis']"
            >
              <template v-slot:append>
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
                class="text-secondary"
                style="text-decoration: underline"
                @click="router.push('/reset-password')"
                >Mot de passe oublié ?</q-btn
              >
            </div>
          </div>
        </template>
      </FormLayout>
    </section>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'
import FormLayout from '../../layouts/FormLayout.vue'
import Header from '../../components/auth/AuthHeader.vue'
import AuthService from 'src/services/AuthService'
import { showError, extractErrorMessage } from 'src/plugins/errorHandler'

const email = ref('')
const password = ref('')
const isPasswordVisible = ref(false)

const router = useRouter()
const route = useRoute()

const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

const isFormValid = computed(() => {
  return isValidEmail(email.value) && password.value.length > 0
})

const validationMessage = computed(() => {
  if (!isValidEmail(email.value)) return 'Veuillez entrer une adresse email valide'
  if (password.value.length === 0) return 'Le mot de passe est requis'
  return 'Veuillez remplir correctement tous les champs'
})

const submitForm = async (type) => {
  if (type === 'register') {
    router.push('/register')
  } else if (type === 'login' && isFormValid.value) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'
      const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : apiUrl
      const response = await axios.post(`${baseUrl}/api/auth/login`, {
        email: email.value,
        password: password.value,
      })

      AuthService.setTokens(response.data.accessToken, response.data.refreshToken)

      const redirectPath = route.query.redirect || '/accueil'
      router.push(redirectPath)
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      showError(errorMessage)
      console.error('Erreur lors de la connexion', error)
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
