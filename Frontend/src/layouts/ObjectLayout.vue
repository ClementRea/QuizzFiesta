<template>
  <q-card
    class="shadow-8 rounded-borders cursor-pointer"
    style="max-width: 450px; border-radius: 16px; overflow: hidden"
    bordered
  >
    <!-- Image Header -->
    <div v-if="showImage" class="relative-position" style="height: 200px">
      <q-img
        :src="getImageUrl(object)"
        :alt="object.title || object.name"
        spinner-color="primary"
        class="fit"
        style="border-radius: 16px 16px 0 0"
      >
        <div
          class="absolute-bottom full-width"
          style="background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%)"
        >
          <div
            class="text-white text-h6 q-pa-md"
            style="
              text-shadow:
                2px 2px 4px rgba(0, 0, 0, 0.8),
                0 0 8px rgba(0, 0, 0, 0.6);
              font-weight: 600;
            "
          >
            {{ object.title || object.name }}
          </div>
        </div>
      </q-img>
    </div>

    <!-- Content -->
    <q-card-section class="q-pa-lg">
      <div v-if="!showImage" class="text-h5 text-weight-bold q-mb-md text-primary">
        {{ object.title || object.name }}
      </div>

      <div
        v-if="object.description"
        class="text-body1 text-grey-8 q-mb-lg"
        style="line-height: 1.6"
      >
        {{ object.description }}
      </div>

      <!-- Metadata chips -->
      <div v-if="detectedObjectType === 'quiz'" class="q-mb-lg q-gutter-xs">
        <q-chip
          v-if="object.questions"
          color="blue-2"
          text-color="blue-8"
          icon="quiz"
          class="text-weight-medium"
        >
          {{ object.questions.length || 0 }} questions
        </q-chip>
        <q-chip
          v-if="object.joinCode"
          color="green-2"
          text-color="green-8"
          icon="key"
          class="text-weight-medium"
        >
          Code: {{ object.joinCode }}
        </q-chip>
        <q-chip
          v-if="object.isPublic"
          color="orange-2"
          text-color="orange-8"
          icon="public"
          class="text-weight-medium"
        >
          Public
        </q-chip>
      </div>

      <!-- Action Buttons -->
      <div class="row q-gutter-md q-mt-md items-center">
        <!-- Primary Actions -->
        <q-btn
          v-if="object.joinCode && detectedObjectType === 'quiz'"
          unelevated
          color="positive"
          icon="play_arrow"
          label="Jouer"
          size="md"
          class="col-auto"
          @click.stop="handlePlay"
        />

        <q-btn
          v-if="!object.joinCode && detectedObjectType === 'quiz'"
          unelevated
          color="primary"
          icon="qr_code"
          label="Générer code"
          size="md"
          class="col-auto"
          @click.stop="handleGenerateCode"
        />

        <q-btn
          v-if="detectedObjectType === 'organisation'"
          unelevated
          color="primary"
          icon="mdi-account-plus"
          label="Rejoindre"
          size="md"
          class="col-auto"
          @click.stop="handleJoin"
        />

        <q-space />

        <!-- Secondary Actions -->
        <div class="row q-gutter-sm">
          <q-btn
            v-if="showViewButton"
            outline
            color="primary"
            icon="visibility"
            label="Voir"
            size="md"
            @click.stop="handleView"
          />

          <q-btn
            v-if="showEditButton"
            outline
            color="grey-7"
            icon="edit"
            label="Modifier"
            size="md"
            @click.stop="handleEdit"
          />

          <q-btn
            v-if="showShareButton"
            outline
            color="blue"
            icon="share"
            label="Partager"
            size="md"
            @click.stop="handleShare"
          />

          <q-btn
            v-if="showDeleteButton"
            outline
            color="negative"
            icon="delete"
            label="Supprimer"
            size="md"
            @click.stop="handleDelete"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  object: { type: Object, required: true },
  objectType: { type: String, default: null },
  showViewButton: { type: Boolean, default: true },
  showEditButton: { type: Boolean, default: true },
  showDeleteButton: { type: Boolean, default: true },
  showShareButton: { type: Boolean, default: true },
})

const emit = defineEmits(['view', 'edit', 'delete', 'share', 'play', 'join', 'generateCode'])

const detectedObjectType = computed(() => {
  if (props.objectType) return props.objectType
  if (props.object.questions !== undefined || props.object.joinCode !== undefined) return 'quiz'
  if (props.object.members !== undefined || props.object.owner !== undefined) return 'organisation'
  if (props.object.userName !== undefined || props.object.email !== undefined) return 'user'
  return 'generic'
})

const showImage = computed(() => !!getImageUrl(props.object))

const getImageUrl = (obj) => {
  if (!obj) return null
  const imageField = obj.logo || obj.image || obj.avatar
  if (!imageField) return null
  if (
    typeof imageField === 'string' &&
    (imageField.startsWith('http://') || imageField.startsWith('https://'))
  ) {
    return imageField
  }
  let folder = 'logos'
  if (obj.logo) folder = 'logos'
  else if (obj.avatar) folder = 'avatars'
  else if (obj.image) folder = 'images'
  const backendPort = window.location.hostname === 'localhost' ? ':3000' : ''
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  return `${protocol}//${hostname}${backendPort}/${folder}/${imageField}`
}

const handleView = () => emit('view', props.object)
const handleEdit = () => emit('edit', props.object)
const handleDelete = () => emit('delete', props.object)
const handleShare = () => emit('share', props.object)
const handlePlay = () => emit('play', props.object)
const handleJoin = () => emit('join', props.object)
const handleGenerateCode = () => emit('generateCode', props.object)
</script>

<style scoped>
/* Media queries for responsive design */
@media (max-width: 600px) {
  .row.q-gutter-md {
    flex-direction: column !important;
    gap: 8px !important;
  }

  .row.q-gutter-sm {
    justify-content: center !important;
  }
}
</style>
