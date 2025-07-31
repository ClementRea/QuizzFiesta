<template>
  <!-- XL Size -->
  <q-card
    v-if="size === 'xl'"
    class="shadow-8 rounded-borders"
    style="max-width: 900px; border-radius: 20px; overflow: hidden"
    bordered
  >
    <div v-if="showImage" class="relative-position" style="height: 300px">
      <q-img
        :src="getImageUrl(object)"
        :alt="object.title || object.name"
        spinner-color="primary"
        class="fit"
        style="border-radius: 20px 20px 0 0"
      >
        <div
          class="absolute-bottom full-width"
          style="background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.9) 100%)"
        >
          <div
            class="text-white text-h4 q-pa-xl"
            style="text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8); font-weight: 700"
          >
            {{ object.title || object.name }}
          </div>
        </div>
      </q-img>
    </div>

    <q-card-section class="q-pa-xl">
      <div v-if="!showImage" class="text-h4 text-weight-bold q-mb-lg text-primary">
        {{ object.title || object.name }}
      </div>

      <div v-if="object.description" class="text-h6 text-grey-8 q-mb-xl" style="line-height: 1.8">
        {{ object.description }}
      </div>

      <div v-if="detectedObjectType === 'quiz'" class="q-mb-xl">
        <div class="row q-gutter-lg">
          <q-card flat bordered class="col-12 col-sm-6 col-md-4 q-pa-lg bg-grey-1">
            <div class="text-center">
              <q-icon name="quiz" size="2rem" color="blue-6" class="q-mb-md" />
              <div class="text-h5 text-weight-bold text-blue-8">
                {{ object.questions?.length || 0 }}
              </div>
              <div class="text-body1 text-grey-7">Questions</div>
            </div>
          </q-card>

          <q-card flat bordered class="col-12 col-sm-6 col-md-4 q-pa-lg bg-grey-1">
            <div class="text-center">
              <q-icon
                :name="object.isPublic ? 'public' : 'lock'"
                size="2rem"
                :color="object.isPublic ? 'orange-6' : 'grey-6'"
                class="q-mb-md"
              />
              <div
                class="text-h5 text-weight-bold"
                :class="object.isPublic ? 'text-orange-8' : 'text-grey-8'"
              >
                {{ object.isPublic ? 'Public' : 'Privé' }}
              </div>
              <div class="text-body1 text-grey-7">Visibilité</div>
            </div>
          </q-card>
        </div>
      </div>

      <!-- Full actions -->
      <div class="row q-gutter-lg q-mt-xl">
        <q-btn
          v-if="detectedObjectType === 'quiz'"
          unelevated
          color="secondary"
          text-color="primary"
          icon="play_arrow"
          label="Jouer au Quiz"
          size="lg"
          class="col-12 col-sm-6 col-md-3"
          @click.stop="handlePlay"
        />

        <q-btn
          v-if="showViewButton"
          outline
          color="secondary"
          icon="visibility"
          label="Voir"
          size="lg"
          class="col-12 col-sm-6 col-md-3"
          @click.stop="handleView"
        />

        <q-btn
          v-if="showEditButton"
          outline
          color="secondary"
          icon="edit"
          label="Modifier"
          size="lg"
          class="col-12 col-sm-6 col-md-3"
          @click.stop="handleEdit"
        />

        <q-btn
          v-if="showShareButton"
          outline
          color="secondary"
          icon="share"
          label="Partager"
          size="lg"
          class="col-12 col-sm-6 col-md-3"
          @click.stop="handleShare"
        />

        <q-btn
          v-if="showDeleteButton"
          outline
          color="negative"
          icon="delete"
          label="Supprimer"
          size="lg"
          class="col-12 col-sm-6 col-md-3"
          @click.stop="handleDelete"
        />
      </div>
    </q-card-section>
  </q-card>

  <!-- LG Size  -->
  <q-card
    v-else-if="size === 'lg'"
    class="shadow-8 rounded-borders cursor-pointer"
    style="max-width: 450px; border-radius: 16px; overflow: hidden"
    bordered
    tabindex="0"
    role="button"
    :aria-label="`${detectedObjectType === 'quiz' ? 'Quiz' : detectedObjectType === 'organisation' ? 'Organisation' : 'Élément'}: ${object.title || object.name}. ${object.description ? object.description.substring(0, 100) + '...' : ''}`"
    @keydown.enter="handlePlay"
    @keydown.space.prevent="handlePlay"
  >
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
            style="text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8); font-weight: 600"
          >
            {{ object.title || object.name }}
          </div>
        </div>
      </q-img>
    </div>

    <!-- Content LG -->
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
        <q-btn
          v-if="detectedObjectType === 'quiz'"
          unelevated
          color="secondary"
          text-color="primary"
          icon="play_arrow"
          label="Jouer"
          size="md"
          class="col-auto"
          @click.stop="handlePlay"
        />

        <q-space />

        <q-btn-dropdown
          outline
          color="secondary"
          icon="more_vert"
          label="Actions"
          size="md"
          class="col-auto"
        >
          <q-list>
            <q-item v-if="showViewButton" clickable @click.stop="handleView">
              <q-item-section avatar><q-icon name="visibility" color="secondary" /></q-item-section>
              <q-item-section>Voir</q-item-section>
            </q-item>
            <q-item v-if="showEditButton" clickable @click.stop="handleEdit">
              <q-item-section avatar><q-icon name="edit" color="secondary" /></q-item-section>
              <q-item-section>Modifier</q-item-section>
            </q-item>
            <q-item v-if="showShareButton" clickable @click.stop="handleShare">
              <q-item-section avatar><q-icon name="share" color="secondary" /></q-item-section>
              <q-item-section>Partager</q-item-section>
            </q-item>
            <q-item v-if="showDeleteButton" clickable @click.stop="handleDelete">
              <q-item-section avatar><q-icon name="delete" color="red" /></q-item-section>
              <q-item-section>Supprimer</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </q-card-section>
  </q-card>

  <!-- MD Size -->
  <q-card
    v-else-if="size === 'md'"
    class="shadow-4 rounded-borders"
    style="max-width: 380px; border-radius: 12px; overflow: hidden"
    bordered
  >
    <div v-if="showImage" class="relative-position" style="height: 160px">
      <q-img
        :src="getImageUrl(object)"
        :alt="object.title || object.name"
        spinner-color="primary"
        class="fit"
        style="border-radius: 12px 12px 0 0"
      >
        <div
          class="absolute-bottom full-width"
          style="background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%)"
        >
          <div
            class="text-white text-subtitle1 q-pa-md"
            style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8); font-weight: 600"
          >
            {{ object.title || object.name }}
          </div>
        </div>
      </q-img>
    </div>

    <q-card-section class="q-pa-md">
      <div v-if="!showImage" class="text-h6 text-weight-bold q-mb-sm text-primary">
        {{ object.title || object.name }}
      </div>

      <div
        v-if="object.description"
        class="text-body2 text-grey-7 q-mb-md"
        style="
          line-height: 1.5;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
        "
      >
        {{ object.description }}
      </div>

      <div
        v-if="detectedObjectType === 'quiz'"
        class="q-gutter-xs flex row items-center justify-between"
      >
        <q-chip
          v-if="object.questions"
          color="blue-1"
          text-color="blue-8"
          icon="quiz"
          size="sm"
          class="text-weight-medium"
        >
          {{ object.questions.length || 0 }} Question{{ object.questions.length > 1 ? 's' : '' }}
        </q-chip>
        <q-chip
          v-if="object.isPublic"
          color="orange-1"
          text-color="orange-8"
          size="sm"
          icon="mdi-creation"
          class="text-weight-medium"
        >
          {{ object?.createdBy?.userName }}
        </q-chip>

        <q-btn
          label="Jouer"
          color="secondary"
          class="q-mt-md"
          size="md"
          icon="play_arrow"
          dense
          @click="handlePlay"
        />
      </div>
    </q-card-section>
  </q-card>

  <!-- SM Size -->
  <q-card
    v-else-if="size === 'sm'"
    class="shadow-2 rounded-borders"
    style="max-width: 300px; border-radius: 8px; overflow: hidden"
    bordered
  >
    <div v-if="showImage" class="relative-position" style="height: 120px">
      <q-img
        :src="getImageUrl(object)"
        :alt="object.title || object.name"
        spinner-color="primary"
        class="fit"
        style="border-radius: 8px 8px 0 0"
      >
        <div
          class="absolute-bottom full-width"
          style="background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.6) 100%)"
        >
          <div
            class="text-white text-body2 q-pa-sm"
            style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8); font-weight: 600"
          >
            {{ object.title || object.name }}
          </div>
        </div>
      </q-img>
    </div>

    <q-card-section class="q-pa-sm">
      <div v-if="!showImage" class="text-subtitle1 text-weight-bold q-mb-xs text-primary">
        {{ object.title || object.name }}
      </div>

      <div
        v-if="object.description"
        class="text-caption text-grey-6 q-mb-sm"
        style="display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden"
      >
        {{ object.description }}
      </div>

      <div v-if="detectedObjectType === 'quiz'" class="row q-gutter-xs items-center">
        <q-badge v-if="object.questions" color="blue-6" class="text-weight-medium">
          {{ object.questions.length || 0 }} Q
        </q-badge>
        <q-badge v-if="object.isPublic" color="orange-6" class="text-weight-medium">
          Public
        </q-badge>
      </div>
    </q-card-section>
  </q-card>

  <!-- XS Size  -->
  <q-card
    v-else-if="size === 'xs'"
    class="shadow-1 rounded-borders"
    style="max-width: 220px; border-radius: 6px; overflow: hidden"
    flat
    bordered
  >
    <div v-if="showImage" class="relative-position" style="height: 80px">
      <q-img
        :src="getImageUrl(object)"
        :alt="object.title || object.name"
        spinner-color="primary"
        class="fit"
        style="border-radius: 6px 6px 0 0"
      >
        <div
          class="absolute-bottom full-width"
          style="background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.5) 100%)"
        >
          <div
            class="text-white text-caption q-pa-xs"
            style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8); font-weight: 600"
          >
            {{ object.title || object.name }}
          </div>
        </div>
      </q-img>
    </div>

    <q-card-section class="q-pa-xs">
      <div v-if="!showImage" class="text-body2 text-weight-bold text-primary q-mb-xs">
        {{ object.title || object.name }}
      </div>

      <div v-if="detectedObjectType === 'quiz'" class="row q-gutter-xs items-center">
        <q-icon name="quiz" size="xs" color="blue-6" />
        <span class="text-caption text-grey-7">{{ object.questions?.length || 0 }}</span>
        <q-icon v-if="object.isPublic" name="public" size="xs" color="orange-6" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import Avatar from 'src/components/user/GetAvatar.vue'

const props = defineProps({
  object: { type: Object, required: true },
  objectType: { type: String, default: null },
  size: {
    type: String,
    default: 'lg',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value),
  },
  showViewButton: { type: Boolean, default: true },
  showEditButton: { type: Boolean, default: true },
  showDeleteButton: { type: Boolean, default: true },
  showShareButton: { type: Boolean, default: true },
})

const emit = defineEmits(['view', 'edit', 'delete', 'share', 'play'])

const detectedObjectType = computed(() => {
  if (props.objectType) return props.objectType
  if (props.object.questions !== undefined || props.object.joinCode !== undefined) return 'quiz'
  if (props.object.members !== undefined || props.object.owner !== undefined) return 'organisation'
  if (props.object.userName !== undefined || props.object.email !== undefined) return 'user'
  return 'generic'
})

const showImage = computed(() => {
  return !!getImageUrl(props.object)
})

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
</script>

<style scoped>
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
