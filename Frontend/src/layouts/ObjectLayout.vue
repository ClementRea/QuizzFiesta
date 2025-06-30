<template>
  <q-card
    :class="[
      'transition-all',
      'relative-position',
      'overflow-hidden',
      { 'cursor-pointer': clickable },
    ]"
    :style="{
      maxWidth: getMaxWidth(),
      transition: 'all 0.2s ease',
      transform: isHovered && clickable ? 'translateY(-2px)' : 'translateY(0)',
      boxShadow: isHovered && clickable ? '0 8px 25px rgba(0, 0, 0, 0.12)' : undefined,
    }"
    :flat="flat"
    :bordered="!flat"
    @click="handleClick"
    @mouseenter="handleHover(true)"
    @mouseleave="handleHover(false)"
  >
    <div v-if="showImage" class="relative-position overflow-hidden">
      <q-img
        v-if="object.image"
        :src="object.image"
        :ratio="imageRatio"
        :style="{
          transition: 'transform 0.3s ease',
          transform: isHovered && clickable ? 'scale(1.05)' : 'scale(1)',
        }"
        spinner-color="primary"
        :alt="object.title"
      >
        <template #error>
          <div class="absolute-full flex flex-center bg-grey-3">
            <q-icon :name="fallbackIcon" size="lg" color="grey-6" />
          </div>
        </template>
      </q-img>

      <div
        v-else
        class="flex flex-center q-pa-md"
        :style="{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }"
      >
        <q-avatar :size="avatarSize" :color="primaryColor" text-color="white">
          <q-icon :name="fallbackIcon" :size="iconSize" />
        </q-avatar>
      </div>

      <div
        v-if="object.status && showStatusBadge"
        class="absolute-top-right q-ma-sm"
        :style="{
          animation: 'slideIn 0.3s ease-out',
          animationFillMode: 'both',
        }"
      >
        <q-chip
          :color="getStatusColor(object.status)"
          text-color="white"
          dense
          :icon="getStatusIcon(object.status)"
        >
          {{ getStatusLabel(object.status) }}
        </q-chip>
      </div>

      <div
        v-if="object.isPublic !== undefined && showTypeBadge"
        class="absolute-top-left q-ma-sm"
        :style="{
          animation: 'slideIn 0.3s ease-out',
          animationFillMode: 'both',
        }"
      >
        <q-chip
          :color="object.isPublic ? 'green' : 'orange'"
          text-color="white"
          dense
          :icon="object.isPublic ? 'public' : 'lock'"
          :size="size === 'xs' ? 'sm' : 'md'"
        >
          {{ object.isPublic ? 'Public' : 'Privé' }}
        </q-chip>
      </div>
    </div>

    <q-card-section :class="contentClasses">
      <div
        :class="['flex', 'items-start', 'justify-between', 'q-gutter-md']"
        :style="{
          flexDirection: $q.screen.lt.sm && ['md', 'lg', 'xl'].includes(size) ? 'column' : 'row',
          gap: $q.screen.lt.sm && ['md', 'lg', 'xl'].includes(size) ? '8px' : '12px',
        }"
      >
        <div class="col" :style="{ minWidth: 0 }">
          <div
            :class="titleClasses"
            :style="{
              lineHeight: '1.3',
              wordBreak: 'break-word',
              color: '#1a1a1a',
            }"
          >
            {{ object.title }}
          </div>

          <div
            v-if="object.subtitle && showSubtitle"
            :class="subtitleClasses"
            :style="{ lineHeight: '1.4' }"
          >
            {{ object.subtitle }}
          </div>
        </div>

        <!-- Quick Actions -->
        <div
          v-if="showQuickActions"
          :class="['flex', 'q-gutter-xs']"
          :style="{
            alignSelf:
              $q.screen.lt.sm && ['md', 'lg', 'xl'].includes(size) ? 'flex-end' : 'flex-start',
          }"
        >
          <slot name="quick-actions">
            <!-- Actions automatiques selon le type d'objet -->
            <template v-if="autoActions">
              <!-- Bouton partage -->
              <q-btn
                v-if="showAutoShareButton"
                flat
                dense
                round
                icon="share"
                color="primary"
                @click.stop="handleAutoShare"
              >
                <q-tooltip>Partager</q-tooltip>
              </q-btn>

              <!-- Bouton génération code (Quiz) -->
              <q-btn
                v-if="showAutoGenerateCodeButton"
                flat
                dense
                round
                :icon="object.joinCode ? 'refresh' : 'mdi-key-plus'"
                :color="object.joinCode ? 'orange' : 'primary'"
                :loading="isGeneratingCode"
                @click.stop="handleAutoGenerateCode"
              >
                <q-tooltip>{{ object.joinCode ? 'Nouveau code' : 'Générer code' }}</q-tooltip>
              </q-btn>
            </template>

            <!-- Action par défaut -->
            <q-btn
              v-else-if="object.joinCode"
              flat
              dense
              round
              icon="content_copy"
              color="primary"
              @click.stop="copyCode"
              class="q-ml-xs"
            >
              <q-tooltip>Copier le code</q-tooltip>
            </q-btn>
          </slot>
        </div>
      </div>

      <!-- Description -->
      <div
        v-if="object.description && showDescription"
        :class="descriptionClasses"
        :style="{ lineHeight: '1.5' }"
      >
        {{ truncatedDescription }}
      </div>

      <div v-if="showMetadata" class="q-mt-sm">
        <div class="row q-gutter-sm">
          <!-- Questions count -->
          <q-chip
            v-if="object.questions !== undefined"
            dense
            :color="metadataChipColor"
            :text-color="metadataChipTextColor"
            :size="metadataChipSize"
          >
            <q-icon name="mdi-help-circle" class="q-mr-xs" />
            {{ object.questions?.length || object.questions || 0 }} question{{
              (object.questions?.length || object.questions || 0) > 1 ? 's' : ''
            }}
          </q-chip>

          <!-- Date info -->
          <q-chip
            v-if="object.startDate || object.createdAt"
            dense
            :color="metadataChipColor"
            :text-color="metadataChipTextColor"
            :size="metadataChipSize"
          >
            <q-icon name="mdi-calendar" class="q-mr-xs" />
            {{ formatDate(object.startDate || object.createdAt) }}
          </q-chip>

          <!-- Author -->
          <q-chip
            v-if="object.createdBy && showAuthor"
            dense
            :color="metadataChipColor"
            :text-color="metadataChipTextColor"
            :size="metadataChipSize"
          >
            <q-icon name="mdi-account" class="q-mr-xs" />
            {{ getAuthorName(object.createdBy) }}
          </q-chip>

          <slot name="metadata" :object="object" :size="size">
            <!-- Métadonnées automatiques selon le type d'objet -->
            <template v-if="autoActions">
              <!-- Quiz -->
              <q-chip
                v-if="detectedObjectType === 'quiz' && object.participants !== undefined"
                dense
                color="blue-3"
                text-color="dark"
                :size="metadataChipSize"
              >
                <q-icon name="mdi-account-group" class="q-mr-xs" />
                {{ object.participants?.length || object.participants || 0 }} participant{{
                  (object.participants?.length || object.participants || 0) > 1 ? 's' : ''
                }}
              </q-chip>

              <q-chip
                v-if="detectedObjectType === 'quiz' && object.duration"
                dense
                color="purple-3"
                text-color="dark"
                :size="metadataChipSize"
              >
                <q-icon name="mdi-timer" class="q-mr-xs" />
                {{ formatDuration(object.duration) }}
              </q-chip>

              <q-chip
                v-if="detectedObjectType === 'quiz' && object.difficulty"
                dense
                :color="getDifficultyColor(object.difficulty)"
                text-color="white"
                :size="metadataChipSize"
              >
                <q-icon name="mdi-chart-line" class="q-mr-xs" />
                {{ getDifficultyLabel(object.difficulty) }}
              </q-chip>

              <!-- Organisation -->
              <q-chip
                v-if="detectedObjectType === 'organisation' && object.members !== undefined"
                dense
                color="blue-3"
                text-color="dark"
                :size="metadataChipSize"
              >
                <q-icon name="mdi-account-group" class="q-mr-xs" />
                {{ object.members?.length || object.memberCount || 0 }} membre{{
                  (object.members?.length || object.memberCount || 0) > 1 ? 's' : ''
                }}
              </q-chip>

              <q-chip
                v-if="detectedObjectType === 'organisation' && object.type"
                dense
                :color="getOrganisationTypeColor(object.type)"
                text-color="white"
                :size="metadataChipSize"
              >
                <q-icon :name="getOrganisationTypeIcon(object.type)" class="q-mr-xs" />
                {{ getOrganisationTypeLabel(object.type) }}
              </q-chip>
            </template>
          </slot>
        </div>
      </div>

      <!-- Extended Info only XL -->
      <div v-if="showExtendedInfo" class="q-mt-md">
        <div v-if="object.joinCode" class="q-mt-md">
          <q-banner dense class="bg-green-1 text-green-8">
            <template #avatar>
              <q-icon name="mdi-key" />
            </template>
            <div class="row items-center justify-between">
              <div>
                <strong>Code de partage :</strong>
                <span class="text-h6 q-ml-sm">{{ object.joinCode }}</span>
              </div>
              <q-btn flat dense icon="content_copy" @click.stop="copyCode" class="text-green-8">
                <q-tooltip>Copier le code</q-tooltip>
              </q-btn>
            </div>
          </q-banner>
        </div>

        <div v-if="size === 'xl'" class="q-mt-md">
          <div class="row q-gutter-md">
            <div class="col">
              <div class="text-subtitle2 text-grey-7 q-mb-xs">Informations</div>
              <div class="column q-gutter-xs">
                <div v-if="object.startDate">
                  <q-icon name="schedule" class="q-mr-sm" />
                  <span class="text-body2">Début: {{ formatFullDate(object.startDate) }}</span>
                </div>
                <div v-if="object.endDate">
                  <q-icon name="event_busy" class="q-mr-sm" />
                  <span class="text-body2">Fin: {{ formatFullDate(object.endDate) }}</span>
                </div>
                <div v-if="object.createdAt">
                  <q-icon name="mdi-clock" class="q-mr-sm" />
                  <span class="text-body2">Créé: {{ formatFullDate(object.createdAt) }}</span>
                </div>
              </div>
            </div>

            <div class="col">
              <slot name="extended-info" :object="object"></slot>
            </div>
          </div>
        </div>
      </div>

      <slot name="content" :object="object" :size="size"></slot>
    </q-card-section>

    <q-card-actions
      v-if="showActions"
      :class="actionsClasses"
      :style="{ borderTop: '1px solid #f0f0f0' }"
    >
      <slot name="actions" :object="object" :size="size">
        <!-- Actions automatiques intelligentes selon le type -->
        <div v-if="autoActions" class="row q-gutter-sm full-width">
          <!-- Actions principales -->
          <q-btn
            v-if="detectedObjectType === 'quiz' && showGenerateCodeButton"
            :color="object.joinCode ? 'orange' : 'primary'"
            :icon="object.joinCode ? 'refresh' : 'mdi-key-plus'"
            :label="object.joinCode ? 'Nouveau code' : 'Générer code'"
            :loading="isGeneratingCode"
            @click.stop="handleAutoGenerateCode"
            unelevated
            no-caps
            class="col-auto"
          />

          <q-btn
            v-if="detectedObjectType === 'quiz' && showPlayButton && object.joinCode"
            color="green"
            icon="play_arrow"
            label="Jouer"
            @click.stop="handleAutoPlay"
            unelevated
            no-caps
            class="col-auto"
          />

          <q-btn
            v-if="detectedObjectType === 'organisation' && showJoinButton"
            color="primary"
            icon="mdi-account-plus"
            label="Rejoindre"
            @click.stop="emit('joined', object)"
            unelevated
            no-caps
            class="col-auto"
          />

          <q-space />

          <!-- Actions secondaires -->
          <div class="row q-gutter-xs">
            <q-btn
              v-if="showViewButton"
              flat
              color="grey-7"
              icon="visibility"
              @click.stop="handleAutoView"
              :size="size === 'sm' ? 'sm' : 'md'"
            >
              <q-tooltip>Voir les détails</q-tooltip>
            </q-btn>

            <q-btn
              v-if="showEditButton"
              flat
              color="grey-7"
              icon="edit"
              @click.stop="handleAutoEdit"
              :size="size === 'sm' ? 'sm' : 'md'"
            >
              <q-tooltip>Modifier</q-tooltip>
            </q-btn>

            <q-btn
              v-if="showShareButton"
              flat
              color="primary"
              icon="share"
              @click.stop="handleAutoShare"
              :size="size === 'sm' ? 'sm' : 'md'"
            >
              <q-tooltip>Partager</q-tooltip>
            </q-btn>

            <q-btn
              v-if="showDeleteButton"
              flat
              color="negative"
              icon="delete"
              @click.stop="handleAutoDelete"
              :size="size === 'sm' ? 'sm' : 'md'"
            >
              <q-tooltip>Supprimer</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Actions par défaut (rétrocompatibilité) -->
        <template v-else>
          <q-btn
            v-if="size !== 'xs'"
            flat
            :size="size === 'sm' ? 'sm' : 'md'"
            color="primary"
            @click.stop="$emit('view', object)"
          >
            <q-icon name="visibility" class="q-mr-xs" />
            {{ size === 'sm' ? 'Voir' : 'Voir les détails' }}
          </q-btn>

          <q-space v-if="size !== 'xs'" />

          <q-btn
            v-if="showEditAction"
            flat
            :size="size === 'sm' ? 'sm' : 'md'"
            color="grey-7"
            @click.stop="$emit('edit', object)"
          >
            <q-icon name="edit" :class="{ 'q-mr-xs': size !== 'sm' }" />
            <span v-if="size !== 'sm'">Modifier</span>
          </q-btn>
        </template>
      </slot>
    </q-card-actions>

    <q-inner-loading :showing="isInternalLoading" color="primary" />
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()
const isHovered = ref(false)
const internalGeneratingCode = ref(false)
const internalLoading = ref(false)

const handleHover = (state) => {
  if (props.clickable) {
    isHovered.value = state
  }
}

// Auto-détection du type d'objet
const detectedObjectType = computed(() => {
  if (props.objectType) return props.objectType

  // Détection basée sur les propriétés de l'objet
  if (props.object.questions !== undefined || props.object.joinCode !== undefined) {
    return 'quiz'
  }
  if (props.object.members !== undefined || props.object.owner !== undefined) {
    return 'organisation'
  }
  if (props.object.userName !== undefined || props.object.email !== undefined) {
    return 'user'
  }

  return 'generic'
})

// Configuration par défaut des routes selon le type
const defaultRoutes = computed(() => {
  const routeMap = {
    quiz: {
      view: '/quiz/view',
      edit: '/quiz/edit',
      play: '/quiz/play',
      create: '/quiz/create',
    },
    organisation: {
      view: '/organisation/view',
      edit: '/organisation/edit',
      join: '/organisation/join',
      create: '/organisation/create',
    },
    user: {
      view: '/user/profile',
      edit: '/user/settings',
      create: '/user/register',
    },
    generic: {
      view: '/view',
      edit: '/edit',
      create: '/create',
    },
  }

  return { ...routeMap[detectedObjectType.value], ...props.routes }
})

// Import dynamique des services selon le type d'objet
const getService = async () => {
  if (props.services[detectedObjectType.value]) {
    return props.services[detectedObjectType.value]
  }

  try {
    switch (detectedObjectType.value) {
      case 'quiz': {
        const QuizService = await import('src/services/QuizService')
        return QuizService.default
      }
      case 'organisation': {
        const OrganisationService = await 'orga'
        return OrganisationService.default
      }
      case 'user': {
        const UserService = await import('src/services/AuthService')
        return UserService.default
      }
      default:
        return null
    }
  } catch (error) {
    console.warn(`Service non trouvé pour ${detectedObjectType.value}:`, error)
    return null
  }
}

// État de génération du code
const isGeneratingCode = computed(() => {
  return props.autoActions ? internalGeneratingCode.value : false
})

// État de chargement interne
const isInternalLoading = computed(() => {
  return props.loading || internalLoading.value
})

// Boutons d'actions automatiques visibles
const showAutoShareButton = computed(() => {
  return (
    props.autoActions &&
    props.showShareButton &&
    (detectedObjectType.value === 'quiz' || detectedObjectType.value === 'organisation')
  )
})

const showAutoGenerateCodeButton = computed(() => {
  return props.autoActions && props.showGenerateCodeButton && detectedObjectType.value === 'quiz'
})

// Messages selon le type d'objet
const getSuccessMessage = (action) => {
  const messages = {
    quiz: {
      deleted: 'Quiz supprimé avec succès',
      updated: 'Quiz mis à jour',
      shared: 'Quiz partagé',
      codeGenerated: 'Code généré avec succès',
    },
    organisation: {
      deleted: 'Organisation supprimée avec succès',
      updated: 'Organisation mise à jour',
      shared: 'Organisation partagée',
      joined: "Vous avez rejoint l'organisation",
    },
    user: {
      deleted: 'Utilisateur supprimé avec succès',
      updated: 'Profil mis à jour',
      shared: 'Profil partagé',
    },
  }

  return messages[detectedObjectType.value]?.[action] || `Action ${action} réussie`
}

const getErrorMessage = (action) => {
  const messages = {
    quiz: {
      delete: 'Erreur lors de la suppression du quiz',
      update: 'Erreur lors de la mise à jour du quiz',
      share: 'Erreur lors du partage du quiz',
      generateCode: 'Erreur lors de la génération du code',
    },
    organisation: {
      delete: "Erreur lors de la suppression de l'organisation",
      update: "Erreur lors de la mise à jour de l'organisation",
      share: "Erreur lors du partage de l'organisation",
      join: "Erreur lors de l'adhésion à l'organisation",
    },
    generic: {
      delete: 'Erreur lors de la suppression',
      update: 'Erreur lors de la mise à jour',
      share: 'Erreur lors du partage',
    },
  }

  return messages[detectedObjectType.value]?.[action] || `Erreur lors de l'action ${action}`
}

// Props du composant
const props = defineProps({
  object: {
    type: Object,
    required: true,
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value),
  },
  clickable: {
    type: Boolean,
    default: false,
  },
  flat: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  primaryColor: {
    type: String,
    default: 'primary',
  },
  fallbackIcon: {
    type: String,
    default: 'mdi-quiz',
  },
  showActions: {
    type: Boolean,
    default: true,
  },
  showEditAction: {
    type: Boolean,
    default: true,
  },
  autoActions: {
    type: Boolean,
    default: false,
  },
  objectType: {
    type: String,
    default: null,
    validator: (value) => !value || ['quiz', 'organisation', 'user'].includes(value),
  },
  routes: {
    type: Object,
    default: () => ({}), // Routes personnalisées par type d'objet
  },
  services: {
    type: Object,
    default: () => ({}), // Services personnalisés par type d'objet
  },
  // Configuration des actions visibles
  showViewButton: {
    type: Boolean,
    default: true,
  },
  showEditButton: {
    type: Boolean,
    default: true,
  },
  showDeleteButton: {
    type: Boolean,
    default: true,
  },
  showShareButton: {
    type: Boolean,
    default: true,
  },
  showGenerateCodeButton: {
    type: Boolean,
    default: true,
  },
  showPlayButton: {
    type: Boolean,
    default: true,
  },
  showJoinButton: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  'click',
  'view',
  'edit',
  'copy-code',
  'delete',
  'share',
  'generate-code',
  'play',
  'updated', // Émis quand l'objet est mis à jour
  'deleted', // Émis quand l'objet est supprimé
  'joined', // Utilisateur a rejoint (organisations)
  'left', // Utilisateur a quitté (organisations)
  'shared', // Contenu partagé
])

const getMaxWidth = () => {
  const widths = {
    xs: '280px',
    sm: '320px',
    md: '400px',
    lg: '600px',
    xl: '800px',
  }
  return widths[props.size]
}

const imageRatio = computed(() => {
  const ratios = {
    xs: 1,
    sm: 16 / 9,
    md: 16 / 9,
    lg: 21 / 9,
    xl: 21 / 9,
  }
  return ratios[props.size]
})

const avatarSize = computed(() => {
  const sizes = {
    xs: '32px',
    sm: '48px',
    md: '64px',
    lg: '80px',
    xl: '96px',
  }
  return sizes[props.size]
})

const iconSize = computed(() => {
  const sizes = {
    xs: 'sm',
    sm: 'md',
    md: 'lg',
    lg: 'xl',
    xl: '48px',
  }
  return sizes[props.size]
})

const showImage = computed(() => props.size !== 'xs' || props.object.image)
const showSubtitle = computed(() => props.size !== 'xs')
const showDescription = computed(() => ['md', 'lg', 'xl'].includes(props.size))
const showMetadata = computed(() => props.size !== 'xs')
const showQuickActions = computed(() => ['md', 'lg', 'xl'].includes(props.size))
const showExtendedInfo = computed(() => ['lg', 'xl'].includes(props.size))
const showStatusBadge = computed(() => props.size !== 'xs')
const showTypeBadge = computed(() => props.size !== 'xs')
const showAuthor = computed(() => ['lg', 'xl'].includes(props.size))

const contentClasses = computed(() => {
  const classes = []
  if (props.size === 'xs') classes.push('q-pa-sm')
  else if (props.size === 'sm') classes.push('q-pa-md')
  else classes.push('q-pa-lg')
  return classes
})

const titleClasses = computed(() => {
  const classes = ['text-weight-medium', 'q-mb-xs']
  if (props.size === 'xs') classes.push('text-body1')
  else if (props.size === 'sm') classes.push('text-h6')
  else if (props.size === 'md') classes.push('text-h6')
  else classes.push('text-h5')
  return classes
})

const subtitleClasses = computed(() => {
  const classes = ['text-grey-7']
  if (props.size === 'sm') classes.push('text-caption')
  else classes.push('text-body2')
  return classes
})

const descriptionClasses = computed(() => {
  return ['text-grey-7', 'q-mt-sm', 'text-body2']
})

const actionsClasses = computed(() => {
  const classes = []
  if (props.size === 'xs') classes.push('q-pa-xs')
  else classes.push('q-pa-md')
  return classes
})

const metadataChipColor = computed(() => (props.size === 'xs' ? 'grey-4' : 'grey-3'))
const metadataChipTextColor = computed(() => 'dark')
const metadataChipSize = computed(() => (props.size === 'sm' ? 'sm' : 'md'))

const truncatedDescription = computed(() => {
  if (!props.object.description) return ''
  const maxLengths = {
    sm: 80,
    md: 120,
    lg: 200,
    xl: 300,
  }
  const maxLength = maxLengths[props.size] || 120

  if (props.object.description.length <= maxLength) {
    return props.object.description
  }
  return props.object.description.substring(0, maxLength) + '...'
})

// Actions automatiques principales
const handleClick = () => {
  if (props.clickable) {
    if (props.autoActions) {
      handleAutoView()
    } else {
      emit('click', props.object)
    }
  }
}

const handleAutoView = () => {
  if (props.autoActions) {
    router.push(`${defaultRoutes.value.view}/${props.object._id}`)
  } else {
    emit('view', props.object)
  }
}

const handleAutoEdit = () => {
  if (props.autoActions) {
    router.push(`${defaultRoutes.value.edit}/${props.object._id}`)
  } else {
    emit('edit', props.object)
  }
}

const handleAutoPlay = () => {
  if (!props.autoActions) {
    emit('play', props.object)
    return
  }

  if (detectedObjectType.value === 'quiz') {
    if (props.object.joinCode) {
      router.push(`${defaultRoutes.value.play}/${props.object.joinCode}`)
    } else {
      $q.notify({
        type: 'warning',
        message: "Générez d'abord un code pour jouer à ce quiz",
        position: 'top',
      })
    }
  }
}

const handleAutoGenerateCode = async () => {
  if (!props.autoActions) {
    emit('generate-code', props.object)
    return
  }

  if (detectedObjectType.value !== 'quiz') return

  internalGeneratingCode.value = true

  try {
    const service = await getService()

    if (!service || !service.generateJoinCode) {
      throw new Error('Service de génération de code non disponible')
    }

    const response = await service.generateJoinCode(props.object._id)
    const updatedObject = { ...props.object, joinCode: response.data.joinCode }

    $q.notify({
      type: 'positive',
      message: `Code généré : ${response.data.joinCode}`,
      position: 'top',
      actions: [
        {
          label: 'Copier',
          color: 'white',
          handler: () => copyCode(response.data.joinCode),
        },
      ],
    })

    emit('updated', updatedObject)
    emit('generate-code', updatedObject)
  } catch (error) {
    console.error('Erreur génération code:', error)
    $q.notify({
      type: 'negative',
      message: getErrorMessage('generateCode'),
      position: 'top',
    })
  } finally {
    internalGeneratingCode.value = false
  }
}

const handleAutoShare = async () => {
  if (!props.autoActions) {
    emit('share', props.object)
    return
  }

  const shareData = getShareData()

  if (navigator.share && shareData) {
    try {
      await navigator.share(shareData)
      emit('shared', { object: props.object, method: 'native' })
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erreur partage natif:', error)
        fallbackShare(shareData)
      }
    }
  } else {
    fallbackShare(shareData)
  }
}

const handleAutoDelete = async () => {
  if (!props.autoActions) {
    emit('delete', props.object)
    return
  }

  const objectName = props.object.title || props.object.name || 'cet élément'

  $q.dialog({
    title: 'Confirmer la suppression',
    message: `Êtes-vous sûr de vouloir supprimer "${objectName}" ?`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(async () => {
    try {
      internalLoading.value = true
      const service = await getService()

      if (!service) {
        throw new Error('Service de suppression non disponible')
      }

      // Différentes méthodes selon le service
      if (service.deleteQuiz && detectedObjectType.value === 'quiz') {
        await service.deleteQuiz(props.object._id)
      } else if (service.deleteOrganisation && detectedObjectType.value === 'organisation') {
        await service.deleteOrganisation(props.object._id)
      } else if (service.delete) {
        await service.delete(props.object._id)
      } else {
        throw new Error('Méthode de suppression non trouvée')
      }

      $q.notify({
        type: 'positive',
        message: getSuccessMessage('deleted'),
        position: 'top',
      })

      emit('deleted', props.object)
    } catch (error) {
      console.error('Erreur suppression:', error)
      $q.notify({
        type: 'negative',
        message: getErrorMessage('delete'),
        position: 'top',
      })
    } finally {
      internalLoading.value = false
    }
  })
}

// Méthodes utilitaires pour le partage
const getShareData = () => {
  const baseUrl = window.location.origin

  switch (detectedObjectType.value) {
    case 'quiz':
      if (props.object.joinCode) {
        return {
          title: props.object.title,
          text: `Rejoignez mon quiz "${props.object.title}" avec le code: ${props.object.joinCode}`,
          url: `${baseUrl}/quiz/join/${props.object.joinCode}`,
        }
      } else {
        return {
          title: props.object.title,
          text: `Découvrez mon quiz "${props.object.title}"`,
          url: `${baseUrl}/quiz/view/${props.object._id}`,
        }
      }
    case 'organisation':
      return {
        title: props.object.name,
        text: `Rejoignez l'organisation "${props.object.name}"`,
        url: `${baseUrl}/organisation/view/${props.object._id}`,
      }
    default:
      return {
        title: props.object.title || props.object.name,
        text: `Découvrez "${props.object.title || props.object.name}"`,
        url: `${baseUrl}/view/${props.object._id}`,
      }
  }
}

const fallbackShare = (shareData) => {
  if (shareData && shareData.text) {
    navigator.clipboard
      .writeText(shareData.text)
      .then(() => {
        $q.notify({
          type: 'positive',
          message: 'Lien de partage copié !',
          position: 'top',
        })
        emit('shared', { object: props.object, method: 'clipboard' })
      })
      .catch(() => {
        $q.notify({
          type: 'negative',
          message: getErrorMessage('share'),
          position: 'top',
        })
      })
  }
}

const copyCode = async (code) => {
  if (!props.object.joinCode) return

  try {
    await navigator.clipboard.writeText(props.object.joinCode)
    $q.notify({
      type: 'positive',
      message: 'Code copié !',
      position: 'top',
    })
    emit('copy-code', props.object.joinCode)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la copie',
      position: 'top',
    })
  }
}

const getStatusColor = (status) => {
  const colors = {
    active: 'green',
    not_started: 'orange',
    ended: 'red',
    draft: 'grey',
  }
  return colors[status] || 'grey'
}

const getStatusIcon = (status) => {
  const icons = {
    active: 'play_circle',
    not_started: 'schedule',
    ended: 'stop_circle',
    draft: 'edit',
  }
  return icons[status] || 'help'
}

const getStatusLabel = (status) => {
  const labels = {
    active: 'Actif',
    not_started: 'Programmé',
    ended: 'Terminé',
    draft: 'Brouillon',
  }
  return labels[status] || status
}

const getAuthorName = (author) => {
  if (typeof author === 'string') return author
  return author?.userName || author?.name || 'Anonyme'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

const formatFullDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Méthodes utilitaires spécifiques aux quiz (migrées de QuizObject.vue)
const formatDuration = (minutes) => {
  if (!minutes) return ''
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h${remainingMinutes}m`
}

const getDifficultyColor = (difficulty) => {
  const colors = {
    easy: 'green',
    medium: 'orange',
    hard: 'red',
    expert: 'purple',
  }
  return colors[difficulty] || 'grey'
}

const getDifficultyLabel = (difficulty) => {
  const labels = {
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    expert: 'Expert',
  }
  return labels[difficulty] || difficulty
}

// Méthodes utilitaires spécifiques aux organisations
const getOrganisationTypeColor = (type) => {
  const colors = {
    school: 'blue',
    company: 'purple',
    association: 'green',
    personal: 'orange',
  }
  return colors[type] || 'grey'
}

const getOrganisationTypeIcon = (type) => {
  const icons = {
    school: 'school',
    company: 'business',
    association: 'group',
    personal: 'person',
  }
  return icons[type] || 'business'
}

const getOrganisationTypeLabel = (type) => {
  const labels = {
    school: 'École',
    company: 'Entreprise',
    association: 'Association',
    personal: 'Personnel',
  }
  return labels[type] || type
}
</script>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
