<template>
  <div class="formLayout">
    <FormLayout
      @action="handleAction"
      actionType="custom"
      :actionButtons="actionButtons"
      :disabledSubmit="!isFormValid"
      :disabledSubmitMessage="validationMessage"
    >
      <template v-slot:content>
        <div v-if="loading" class="column items-center q-pa-md">
          <q-spinner color="primary" size="3em" />
          <div class="q-mt-md">Chargement des informations du compte...</div>
        </div>

        <div v-else-if="error" class="column items-center q-pa-md">
          <q-icon name="error" color="negative" size="3em" />
          <div class="q-mt-md">Une erreur est survenue lors du chargement des données.</div>
          <q-btn flat color="primary" text-color="secondary" label="Réessayer" @click="getUser" class="q-mt-md" />
        </div>

        <div v-else class="q-gutter-y-lg">
          <div class="flex justify-center column items-center q-mb-md">
            <div class="q-mb-md cursor-pointer" @click="EditAvatarDialog = true">
              <Avatar :avatarUrl="userData.avatar" :previewUrl="avatarPreview" style="width: 7em" />
            </div>

            <q-btn
              no-caps
              unelevated
              label="Modifier la photo de profil"
              color="secondary"
              text-color="primary"
              @click="EditAvatarDialog = true"
            />
          </div>
          <div v-if="EditAvatarDialog">
            <EditAvatar v-model="EditAvatarDialog" @selected="handleAvatarSelected" />
          </div>

          <q-input
            outlined
            v-model="userData.userName"
            label="Nom d'utilisateur"
            class="custom-border"
            bg-color="white"
            label-color="secondary"
            color="secondary"
            :rules="[(val) => !!val || 'Le nom d\'utilisateur est requis']"
          />

          <q-input
            outlined
            v-model="userData.email"
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

          <q-separator />

          <div class="text-subtitle1 text-secondary q-mb-sm">Changer votre mot de passe</div>
          <q-input
            outlined
            v-model="userData.currentPassword"
            label="Mot de passe actuel"
            class="custom-border"
            bg-color="white"
            label-color="secondary"
            color="secondary"
            :type="isPasswordVisible.current ? 'text' : 'password'"
          >
            <template v-slot:append>
              <q-icon
                :name="isPasswordVisible.current ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="isPasswordVisible.current = !isPasswordVisible.current"
              />
            </template>
          </q-input>

          <q-input
            outlined
            v-model="userData.newPassword"
            label="Nouveau mot de passe"
            class="custom-border"
            bg-color="white"
            label-color="secondary"
            color="secondary"
            :type="isPasswordVisible.new ? 'text' : 'password'"
            :rules="passwordRules"
          >
            <template v-slot:append>
              <q-icon
                :name="isPasswordVisible.new ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="isPasswordVisible.new = !isPasswordVisible.new"
              />
            </template>
          </q-input>

          <q-input
            outlined
            v-model="userData.confirmPassword"
            label="Confirmer le nouveau mot de passe"
            class="custom-border"
            bg-color="white"
            label-color="secondary"
            color="secondary"
            :type="isPasswordVisible.confirm ? 'text' : 'password'"
            :rules="[
              (val) =>
                !userData.newPassword || !!val || 'La confirmation du mot de passe est requise',
              (val) =>
                !userData.newPassword ||
                val === userData.newPassword ||
                'Les mots de passe ne correspondent pas',
            ]"
          >
            <template v-slot:append>
              <q-icon
                :name="isPasswordVisible.confirm ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="isPasswordVisible.confirm = !isPasswordVisible.confirm"
              />
            </template>
          </q-input>
        </div>
      </template>
    </FormLayout>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import UserService from 'src/services/UserService'
import FormLayout from 'src/layouts/FormLayout.vue'
import EditAvatar from 'src/components/EditAvatar.vue'
import Avatar from 'src/components/GetAvatar.vue'

const router = useRouter()
const $q = useQuasar()

const loading = ref(true)
const error = ref(null)
const EditAvatarDialog = ref(false)
const avatarPreview = ref(null)
const avatarFile = ref(null)
const userData = ref({
  userName: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  avatar: '',
})

const isPasswordVisible = ref({
  current: false,
  new: false,
  confirm: false,
})

const isChangingPassword = computed(() => {
  return (
    !!userData.value.currentPassword ||
    !!userData.value.newPassword ||
    !!userData.value.confirmPassword
  )
})

const passwordRules = computed(() => {
  if (!userData.value.currentPassword && !userData.value.newPassword) return []

  return [
    (val) => !userData.value.currentPassword || !!val || 'Le nouveau mot de passe est requis',
    (val) => !val || val.length >= 8 || 'Le mot de passe doit contenir au moins 8 caractères',
    (val) => !val || /[A-Z]/.test(val) || 'Le mot de passe doit contenir au moins une majuscule',
    (val) => !val || /[0-9]/.test(val) || 'Le mot de passe doit contenir au moins un chiffre',
  ]
})

// Boutons d'action
const actionButtons = [
  {
    action: 'cancel',
    label: 'Annuler',
    color: 'white',
    class: 'text-secondary q-pa-sm border-secondary col-5',
    ariaLabel: 'Annuler les modifications',
    title: 'Revenir sans sauvegarder les modifications',
  },
  {
    action: 'save',
    label: 'Sauvegarder',
    color: 'dark80',
    class: 'text-primary q-pa-sm col-5',
    ariaLabel: 'Sauvegarder les modifications',
    title: 'Enregistrer les modifications du profil',
  },
]

const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

const isFormValid = computed(() => {
  // Vérification des champs de base
  const basicFieldsValid =
    userData.value.userName?.length > 0 &&
    userData.value.email?.length > 0 &&
    isValidEmail(userData.value.email)

  // Si l'utilisateur change son mot de passe, on vérifie les champs de mot de passe
  if (isChangingPassword.value) {
    return (
      basicFieldsValid &&
      userData.value.currentPassword?.length > 0 &&
      userData.value.newPassword?.length >= 8 &&
      /[A-Z]/.test(userData.value.newPassword) &&
      /[0-9]/.test(userData.value.newPassword) &&
      userData.value.confirmPassword === userData.value.newPassword
    )
  }

  return basicFieldsValid
})

const validationMessage = computed(() => {
  if (!userData.value.userName) return 'Le prénom est requis'
  if (!userData.value.email) return "L'email est requis"
  if (!isValidEmail(userData.value.email)) return 'Veuillez entrer une adresse email valide'

  if (isChangingPassword.value) {
    if (!userData.value.currentPassword)
      return 'Le mot de passe actuel est requis pour le changement'
    if (!userData.value.newPassword) return 'Le nouveau mot de passe est requis'
    if (userData.value.newPassword.length < 8)
      return 'Le mot de passe doit contenir au moins 8 caractères'
    if (!/[A-Z]/.test(userData.value.newPassword))
      return 'Le mot de passe doit contenir au moins une majuscule'
    if (!/[0-9]/.test(userData.value.newPassword))
      return 'Le mot de passe doit contenir au moins un chiffre'
    if (userData.value.newPassword !== userData.value.confirmPassword)
      return 'Les mots de passe ne correspondent pas'
  }

  return 'Veuillez remplir correctement tous les champs'
})

const getUser = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await UserService.getMe()
    const user = response.data.user

    userData.value = {
      userName: user.userName || '',
      email: user.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      avatar: user.avatar || '',
    }
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

const handleAction = async (action) => {
  if (action === 'cancel') {
    router.push('/account')
    return
  }

  if (action === 'save') {
    try {
      let response

      // Si on change le mot de passe ET qu'on a un avatar
      if (isChangingPassword.value && avatarFile.value) {
        // Mise à jour complète avec avatar et mot de passe
        response = await UserService.updateProfile({
          userName: userData.value.userName,
          email: userData.value.email,
          currentPassword: userData.value.currentPassword,
          newPassword: userData.value.newPassword,
          avatar: avatarFile.value,
        })
      }
      // Si on change seulement le mot de passe
      else if (isChangingPassword.value) {
        response = await UserService.updatePassword(
          userData.value.currentPassword,
          userData.value.newPassword,
        )

        // Puis mettre à jour les autres infos si nécessaire
        if (userData.value.userName || userData.value.email) {
          await UserService.updateMe({
            userName: userData.value.userName,
            email: userData.value.email,
          })
        }
      }
      // Si on change seulement l'avatar
      else if (avatarFile.value) {
        response = await UserService.updateAvatar(avatarFile.value)

        // Puis mettre à jour les autres infos si nécessaire
        if (userData.value.userName || userData.value.email) {
          await UserService.updateMe({
            userName: userData.value.userName,
            email: userData.value.email,
          })
        }
      }
      // Sinon mise à jour simple des infos
      else {
        response = await UserService.updateMe({
          userName: userData.value.userName,
          email: userData.value.email,
        })
      }

      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Vos informations ont été mises à jour avec succès',
      })

      router.push('/account')
    } catch (err) {
      console.error(err)
      const errorMessage =
        err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour'

      $q.notify({
        color: 'negative',
        message: errorMessage,
      })
    }
  }
}

//Appercu de l'avatar
const handleAvatarSelected = (file) => {
  avatarFile.value = file

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

onMounted(getUser)
</script>

<style scoped>
.formLayout {
  position: relative;
  margin-top: -16px;
  z-index: 1;
  margin-bottom: 90px;
}
</style>
