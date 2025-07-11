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
    @generateCode="handleGenerateCode"
  />
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import ObjectLayout from '../layouts/ObjectLayout.vue'
import QuizService from 'src/services/QuizService'

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

const handlePlay = () => {
  if (props.quiz.joinCode) {
    router.push(`${props.routes.play}/${props.quiz._id}`)
    emit('play', props.quiz)
  } else {
    $q.notify({
      type: 'warning',
      message: "Générez d'abord un code pour jouer à ce quiz",
      position: 'top',
    })
  }
}

const handleGenerateCode = async () => {
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
          handler: () => {
            navigator.clipboard.writeText(response.data.joinCode).then(() => {
              $q.notify({
                type: 'positive',
                message: 'Code copié !',
                position: 'top',
              })
            })
          },
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
  }
}

const handleShare = () => {
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
    emit('share', props.quiz)
  } else {
    $q.notify({
      type: 'warning',
      message: "Générez d'abord un code pour partager ce quiz",
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
