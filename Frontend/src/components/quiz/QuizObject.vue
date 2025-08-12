<template>
  <ObjectLayout
    :object="quiz"
    object-type="quiz"
    :show-view-button="showViewButton"
    :show-edit-button="showEditButton"
    :show-delete-button="showDeleteButton"
    :show-share-button="showShareButton"
    @view="handleView"
    @edit="handleEdit"
    @delete="handleDelete"
    @share="handleShare"
    @play="handlePlay"
  />
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import ObjectLayout from '../../layouts/ObjectLayout.vue'
import QuizService from 'src/services/QuizService'
import SessionService from 'src/services/SessionService'

const router = useRouter()
const $q = useQuasar()

const props = defineProps({
  quiz: {
    type: Object,
    required: true,
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
  // Routes personnalisées (optionnel)
  routes: {
    type: Object,
    default: () => ({
      view: '/quiz/view',
      edit: '/quiz/edit',
      play: '/quiz/lobby',
    }),
  },
})

const emit = defineEmits(['updated', 'deleted', 'view', 'edit', 'delete', 'share', 'play'])

const handleView = () => {
  router.push(`${props.routes.view}/${props.quiz._id}`)
  emit('view', props.quiz)
}

const handleEdit = () => {
  router.push(`${props.routes.edit}/${props.quiz._id}`)
  emit('edit', props.quiz)
}

const handlePlay = async () => {
  try {
    // Créer une nouvelle session pour ce quiz
    const sessionResult = await SessionService.createSession(props.quiz._id, {
      name: `Session ${props.quiz.title} - ${new Date().toLocaleString()}`,
    })

    const sessionId = sessionResult.data.session._id || sessionResult.data.session.id

    // Rejoindre automatiquement la session en tant qu'organisateur
    await SessionService.joinSessionLobby(sessionId)

    // Rediriger vers le lobby de la nouvelle session
    router.push(`/quiz/session/${sessionId}/lobby`)
    emit('play', props.quiz)
  } catch (error) {
    console.error('Erreur lors de la création de session:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la création de la session',
      position: 'top',
    })
  }
}

const handleShare = async () => {
  try {
    // Créer une session temporaire pour le partage
    const sessionResult = await SessionService.createSession(props.quiz._id, {
      name: `Session partagée ${props.quiz.title} - ${new Date().toLocaleString()}`,
    })

    const sessionCode = sessionResult.data.session.sessionCode
    const shareUrl = `${window.location.origin}/quiz/session/join/${sessionCode}`

    if (navigator.share) {
      navigator.share({
        title: props.quiz.title,
        text: `${props.quiz.description} - Code: ${sessionCode}`,
        url: shareUrl,
      })
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API de partage
      navigator.clipboard.writeText(`${shareUrl}\nCode de session: ${sessionCode}`)
      $q.notify({
        color: 'positive',
        message: 'Lien de session copié dans le presse-papier',
        position: 'top',
      })
    }
    emit('share', props.quiz)
  } catch (error) {
    console.error('Erreur lors du partage:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la création du lien de partage',
      position: 'top',
    })
  }
}

const handleDelete = () => {
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
  emit('delete', props.quiz)
}
</script>
