<template>
  <div class="full-width">
    <FormLayout
      title="Créer une organisation"
      actionType="custom"
      :show-actions="true"
      :actionButtons="actionButtons"
      :disabledSubmit="!isFormValid"
      @action="handleAction"
    >
      <template v-slot:content>
        <div
          class="q-pa-xl bg-primary rounded-borders q-mt-lg items-center justify-center column"
          style="max-width: 500px; margin: auto"
        >
          <div class="q-mb-md cursor-pointer" @click="EditAvatarDialog = true">
            <OrganisationAvatar :logoUrl="form.logoUrl" :previewUrl="logoPreviewUrl" />
          </div>

          <q-btn
            no-caps
            unelevated
            label="Ajouter un logo"
            color="secondary"
            outline
            rounded
            class="q-mb-md"
            @click="uploadFilesDialog = true"
          />

          <UploadFiles
            v-model="uploadFilesDialog"
            title="Logo de l'organisation"
            v-if="uploadFilesDialog"
            @selected="onLogoSelected"
          />

          <div>
            <q-input v-model="form.name" label="Nom de l'organisation *" outlined class="q-mb-md" />
            <q-input
              v-model="form.description"
              label="Description"
              type="textarea"
              rows="3"
              outlined
              class="q-mb-md"
            />
          </div>
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
import FormLayout from 'src/layouts/FormLayout.vue'
import UploadFiles from 'src/components/common/UploadFiles.vue'
import OrganisationAvatar from 'src/components/organisation/GetOrganisationAvatar.vue'
import AuthService from 'src/services/AuthService'

const router = useRouter()
const $q = useQuasar()

const form = ref({
  name: '',
  description: '',
  logoUrl: '',
})
const showValidation = ref(false)
const uploadFilesDialog = ref(false)
const logoPreviewUrl = ref(null)
const logoFile = ref(null)

const onLogoSelected = (file) => {
  logoFile.value = file

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreviewUrl.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const isFormValid = computed(() => {
  return form.value.name.trim() !== ''
})

const actionButtons = [
  {
    action: 'cancel',
    label: 'Annuler',
    color: 'white',
    class: 'text-secondary q-pa-sm col-5',
    ariaLabel: "Annuler la création de l'organisation",
    title: 'Revenir sans sauvegarder',
  },
  {
    action: 'save',
    label: "Créer l'organisation",
    color: 'secondary',
    class: 'text-primary q-pa-sm col-5',
    ariaLabel: "Créer l'organisation",
    title: "Finaliser la création de l'organisation",
  },
]

const handleAction = async (action) => {
  if (action === 'cancel') {
    router.push('/accueil')
    return
  }
  if (action === 'save') {
    try {
      // Vérifier l'authentification
      if (!AuthService.isAuthenticated()) {
        $q.notify({
          type: 'negative',
          message: 'Vous devez être connecté pour créer une organisation',
          position: 'top',
        })
        router.push('/login')
        return
      }

      const formData = new FormData()
      formData.append('name', form.value.name.trim())
      formData.append('description', form.value.description.trim())
      if (logoFile.value) {
        formData.append('logo', logoFile.value)
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'https://quizzfiesta.onrender.com'
      const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : apiUrl
      const response = await axios.post(`${baseUrl}/api/organisation/create`, formData, {
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.status === 'success') {
        $q.notify({
          type: 'positive',
          message: response.data.message || 'Organisation créée avec succès !',
          position: 'top',
        })
        router.push('/accueil')
      }
    } catch (error) {
      if (error.response?.status === 401) {
        $q.notify({
          type: 'negative',
          message: 'Session expirée, veuillez vous reconnecter',
          position: 'top',
        })
        AuthService.clearTokens()
        router.push('/login')
      } else if (error.response?.status === 400) {
        $q.notify({
          type: 'negative',
          message: error.response.data.message || 'Données invalides',
          position: 'top',
        })
      } else if (error.response?.status === 413) {
        $q.notify({
          type: 'negative',
          message: 'Le fichier logo est trop volumineux (max 5MB)',
          position: 'top',
        })
      } else {
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || "Erreur lors de la création de l'organisation",
          position: 'top',
        })
      }
      console.error(error)
    }
  } else {
    showValidation.value = true
  }
}
</script>
