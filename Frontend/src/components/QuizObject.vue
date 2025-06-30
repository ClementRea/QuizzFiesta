<template>
  <ObjectLayout
    :object="quiz"
    :size="size"
    :clickable="clickable"
    :flat="flat"
    :loading="loading"
    :show-actions="showActions"
    :show-edit-action="showEditAction"
    @click="handleClick"
    @view="handleView"
    @edit="handleEdit"
    @copy-code="handleCopyCode"
  >
    <template #quick-actions>
      <q-btn
        v-if="showShareButton"
        flat
        dense
        round
        icon="share"
        color="primary"
        @click.stop="handleShare"
      >
        <q-tooltip>Partager</q-tooltip>
      </q-btn>

      <q-btn
        v-if="showGenerateCodeButton"
        flat
        dense
        round
        :icon="quiz.joinCode ? 'refresh' : 'mdi-key-plus'"
        :color="quiz.joinCode ? 'orange' : 'primary'"
        :loading="isGeneratingCode"
        @click.stop="handleGenerateCode"
      >
        <q-tooltip>{{ quiz.joinCode ? 'Nouveau code' : 'Générer code' }}</q-tooltip>
      </q-btn>

      <slot name="quick-actions" :quiz="quiz"></slot>
    </template>

    <template #actions="{ object }">
      <div class="row q-gutter-sm full-width">
        <q-btn
          v-if="showGenerateCodeButton"
          :color="object.joinCode ? 'orange' : 'primary'"
          :icon="object.joinCode ? 'refresh' : 'mdi-key-plus'"
          :label="object.joinCode ? 'Nouveau code' : 'Générer code'"
          :loading="isGeneratingCode"
          @click.stop="handleGenerateCode"
          unelevated
          no-caps
          class="col-auto"
        />

        <q-btn
          v-if="object.joinCode && showPlayButton"
          color="green"
          icon="play_arrow"
          label="Jouer"
          @click.stop="handlePlay"
          unelevated
          no-caps
          class="col-auto"
        />

        <q-space />

        <div class="row q-gutter-xs">
          <q-btn
            v-if="showViewButton"
            flat
            color="grey-7"
            icon="visibility"
            @click.stop="handleView"
            :size="size === 'sm' ? 'sm' : 'md'"
          >
            <q-tooltip>Voir les détails</q-tooltip>
          </q-btn>

          <q-btn
            v-if="showEditButton"
            flat
            color="grey-7"
            icon="edit"
            @click.stop="handleEdit"
            :size="size === 'sm' ? 'sm' : 'md'"
          >
            <q-tooltip>Modifier</q-tooltip>
          </q-btn>

          <q-btn
            v-if="showShareButton"
            flat
            color="primary"
            icon="share"
            @click.stop="handleShare"
            :size="size === 'sm' ? 'sm' : 'md'"
          >
            <q-tooltip>Partager</q-tooltip>
          </q-btn>

          <q-btn
            v-if="showDeleteButton"
            flat
            color="negative"
            icon="delete"
            @click.stop="handleDelete"
            :size="size === 'sm' ? 'sm' : 'md'"
          >
            <q-tooltip>Supprimer</q-tooltip>
          </q-btn>
        </div>
      </div>

      <slot name="actions" :quiz="object" :size="size"></slot>
    </template>

    <template #metadata="{ object, size }">
      <q-chip
        v-if="object.participants !== undefined"
        dense
        color="blue-3"
        text-color="dark"
        :size="size === 'sm' ? 'sm' : 'md'"
      >
        <q-icon name="mdi-account-group" class="q-mr-xs" />
        {{ object.participants?.length || object.participants || 0 }} participant{{
          (object.participants?.length || object.participants || 0) > 1 ? 's' : ''
        }}
      </q-chip>

      <q-chip
        v-if="object.duration"
        dense
        color="purple-3"
        text-color="dark"
        :size="size === 'sm' ? 'sm' : 'md'"
      >
        <q-icon name="mdi-timer" class="q-mr-xs" />
        {{ formatDuration(object.duration) }}
      </q-chip>

      <q-chip
        v-if="object.difficulty"
        dense
        :color="getDifficultyColor(object.difficulty)"
        text-color="white"
        :size="size === 'sm' ? 'sm' : 'md'"
      >
        <q-icon name="mdi-chart-line" class="q-mr-xs" />
        {{ getDifficultyLabel(object.difficulty) }}
      </q-chip>

      <slot name="metadata" :quiz="object" :size="size"></slot>
    </template>

    <template #extended-info="{ object }">
      <div class="text-subtitle2 text-grey-7 q-mb-xs">Statistiques</div>
      <div class="column q-gutter-xs">
        <div v-if="object.plays !== undefined">
          <q-icon name="mdi-play" class="q-mr-sm" />
          <span class="text-body2">{{ object.plays || 0 }} parties jouées</span>
        </div>
        <div v-if="object.averageScore !== undefined">
          <q-icon name="mdi-trophy" class="q-mr-sm" />
          <span class="text-body2">Score moyen: {{ object.averageScore }}%</span>
        </div>
        <div v-if="object.category">
          <q-icon name="mdi-tag" class="q-mr-sm" />
          <span class="text-body2">Catégorie: {{ object.category }}</span>
        </div>
        <div v-if="object.language">
          <q-icon name="mdi-translate" class="q-mr-sm" />
          <span class="text-body2">Langue: {{ object.language }}</span>
        </div>
      </div>

      <slot name="extended-info" :quiz="object"></slot>
    </template>

    <template #content="{ object, size }">
      <slot name="content" :quiz="object" :size="size"></slot>
    </template>
  </ObjectLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import ObjectLayout from '../layouts/ObjectLayout.vue'
import QuizService from 'src/services/QuizService'

const router = useRouter()
const $q = useQuasar()
const internalGeneratingCode = ref(false)

const props = defineProps({
  quiz: {
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
  generatingCode: {
    type: Boolean,
    default: false,
  },
  // Mode automatique - gère les actions automatiquement
  autoActions: {
    type: Boolean,
    default: true,
  },
  // Routes personnalisées (optionnel)
  routes: {
    type: Object,
    default: () => ({
      view: '/quiz/view',
      edit: '/quiz/edit',
      play: '/quiz/play',
      create: '/quiz/create',
    }),
  },
  showActions: {
    type: Boolean,
    default: true,
  },
  showEditAction: {
    type: Boolean,
    default: true,
  },
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
})

// Emits - gardés pour la compatibilité et la customisation
const emit = defineEmits([
  'click',
  'view',
  'edit',
  'delete',
  'share',
  'generate-code',
  'play',
  'copy-code',
  'updated', // Nouvel événement quand le quiz est mis à jour
  'deleted', // Nouvel événement quand le quiz est supprimé
])

// Computed pour déterminer si on utilise la génération de code interne ou externe
const isGeneratingCode = computed(() => {
  return props.autoActions ? internalGeneratingCode.value : props.generatingCode
})

// Actions automatiques
const handleClick = () => {
  if (props.autoActions) {
    handleView()
  } else {
    emit('click', props.quiz)
  }
}

const handleView = () => {
  if (props.autoActions) {
    router.push(`${props.routes.view}/${props.quiz._id}`)
  } else {
    emit('view', props.quiz._id)
  }
}

const handleEdit = () => {
  if (props.autoActions) {
    router.push(`${props.routes.edit}/${props.quiz._id}`)
  } else {
    emit('edit', props.quiz._id)
  }
}

const handlePlay = () => {
  if (props.autoActions) {
    if (props.quiz.joinCode) {
      router.push(`${props.routes.play}/${props.quiz.joinCode}`)
    } else {
      $q.notify({
        type: 'warning',
        message: "Générez d'abord un code pour jouer à ce quiz",
        position: 'top',
      })
    }
  } else {
    emit('play', props.quiz)
  }
}

const handleGenerateCode = async () => {
  if (props.autoActions) {
    internalGeneratingCode.value = true

    try {
      const response = await QuizService.generateJoinCode(props.quiz._id)

      // Mettre à jour le quiz avec le nouveau code
      const updatedQuiz = { ...props.quiz, joinCode: response.data.joinCode }

      $q.notify({
        type: 'positive',
        message: `Code généré : ${response.data.joinCode}`,
        position: 'top',
        actions: [
          {
            label: 'Copier',
            color: 'white',
            handler: () => handleCopyCode(response.data.joinCode),
          },
        ],
      })

      // Émettre l'événement de mise à jour
      emit('updated', updatedQuiz)
    } catch (error) {
      console.error('Erreur génération code:', error)

      let message = 'Erreur lors de la génération du code'
      if (error.message) {
        message = error.message
      }

      $q.notify({
        type: 'negative',
        message,
        position: 'top',
      })
    } finally {
      internalGeneratingCode.value = false
    }
  } else {
    emit('generate-code', props.quiz)
  }
}

const handleShare = () => {
  if (props.autoActions) {
    if (props.quiz.joinCode) {
      const shareText = `Rejoignez mon quiz "${props.quiz.title}" avec le code: ${props.quiz.joinCode}`
      if (navigator.share) {
        navigator.share({
          title: props.quiz.title,
          text: shareText,
          url: window.location.origin + '/quiz/join',
        })
      } else {
        navigator.clipboard.writeText(shareText).then(() => {
          $q.notify({
            type: 'positive',
            message: 'Lien de partage copié !',
            position: 'top',
          })
        })
      }
    } else {
      $q.notify({
        type: 'warning',
        message: "Générez d'abord un code pour partager ce quiz",
        position: 'top',
      })
    }
  } else {
    emit('share', props.quiz)
  }
}

const handleDelete = () => {
  if (props.autoActions) {
    $q.dialog({
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer le quiz "${props.quiz.title}" ?`,
      cancel: true,
      persistent: true,
      color: 'negative',
    }).onOk(async () => {
      try {
        await QuizService.deleteQuiz(props.quiz._id)

        $q.notify({
          type: 'positive',
          message: 'Quiz supprimé avec succès',
          position: 'top',
        })

        // Émettre l'événement de suppression
        emit('deleted', props.quiz)
      } catch (error) {
        console.error('Erreur suppression quiz:', error)
        $q.notify({
          type: 'negative',
          message: 'Erreur lors de la suppression',
          position: 'top',
        })
      }
    })
  } else {
    emit('delete', props.quiz)
  }
}

const handleCopyCode = async (code) => {
  try {
    await navigator.clipboard.writeText(code)
    $q.notify({
      type: 'positive',
      message: 'Code copié !',
      position: 'top',
    })
    emit('copy-code', code)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la copie',
      position: 'top',
    })
  }
}

// Méthodes utilitaires spécifiques aux quiz
const formatDuration = (minutes) => {
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
</script>
