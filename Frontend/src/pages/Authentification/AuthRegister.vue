<template>
  <Header />
  <div class="formLayout">
    <FormLayout
      title="Inscription"
      @submit="submitForm"
      :disabledSubmit="!isFormValid"
      actionType="register"
      :disabledSubmitMessage="validationMessage"
    >
      <template #content>
        <div class="q-gutter-y-lg">
          <q-input
            outlined
            v-model="userName"
            label="Nom d'utilisateur"
            class="custom-border"
            bg-color="white"
            label-color="dark80"
            color="dark70"
            :rules="[
              (val) => !!val || 'Le nom d\'utilisateur est requis',
              (val) =>
                val.length >= 3 || 'Le nom d\'utilisateur doit contenir au moins 3 caractères',
            ]"
          />
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
            :type="isFirstPwd ? 'password' : 'text'"
            :rules="[
              (val) => !!val || 'Le mot de passe est requis',
              (val) =>
                (val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val)) ||
                'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre',
            ]"
          >
            <template #append>
              <q-icon
                :name="isFirstPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isFirstPwd = !isFirstPwd"
              />
            </template>
          </q-input>
          <q-input
            outlined
            v-model="confirmPassword"
            label="Confirmer le mot de passe"
            class="custom-border"
            bg-color="white"
            label-color="dark80"
            color="dark70"
            :type="isSecondPwd ? 'password' : 'text'"
            :rules="[
              (val) => !!val || 'La confirmation du mot de passe est requise',
              (val) => val === password || 'Les mots de passe ne correspondent pas',
            ]"
          >
            <template #append>
              <q-icon
                :name="isSecondPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isSecondPwd = !isSecondPwd"
              />
            </template>
          </q-input>
        </div>
      </template>
    </FormLayout>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import FormLayout from '../../layouts/FormLayout.vue'
import Header from '../../components/AuthHeader.vue'
import AuthService from 'src/services/AuthService'

const userName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isFirstPwd = ref(true)
const isSecondPwd = ref(true)
const $q = useQuasar()

const router = useRouter()

const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

// On vérifie la validité du formulaire
const isFormValid = computed(() => {
  return (
    userName.value.length >= 3 &&
    isValidEmail(email.value) &&
    password.value.length >= 8 &&
    /[A-Z]/.test(password.value) &&
    /[0-9]/.test(password.value) &&
    confirmPassword.value === password.value
  )
})

// Message d'erreur de validation
const validationMessage = computed(() => {
  if (userName.value.length < 3) return "Le nom d'utilisateur doit contenir au moins 3 caractères"
  if (!isValidEmail(email.value)) return 'Veuillez entrer une adresse email valide'
  if (password.value.length < 8 || !/[A-Z]/.test(password.value) || !/[0-9]/.test(password.value)) {
    return 'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre'
  }
  if (confirmPassword.value !== password.value) return 'Les mots de passe ne correspondent pas'
  return 'Veuillez remplir correctement tous les champs'
})

// On submit le formulaire
const submitForm = async (type) => {
  if (type === 'login') {
    // Si on clique sur "se connecter", rediriger vers la page de connexion
    router.push('/login')
  } else if (type === 'register' && isFormValid.value) {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/register', {
        userName: userName.value,
        email: email.value,
        password: password.value,
      })

      AuthService.setTokens(response.data.accessToken, response.data.refreshToken)

      router.push('/accueil')
    } catch (error) {
      console.error("Erreur lors de l'inscription", error)
      $q.notify({
        color: 'negative',
        message: "Erreur lors de l'inscription",
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
