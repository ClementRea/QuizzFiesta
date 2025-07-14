<template>
  <div class="column q-pa-md q-pt-lg" role="main">
    <div v-if="showTitle" class="row items-center q-mb-xl">
      <h1 class="text-h4 text-dark80 text-bold q-ma-none">{{ title }}</h1>
    </div>

    <slot name="content"></slot>

    <div
      v-if="showActions"
      class="row items-center justify-center q-pa-md q-mt-md q-gutter-x-md"
      role="group"
      aria-label="Actions du formulaire"
    >
      <slot name="before-actions"></slot>

      <template v-if="actionButtons.length > 0">
        <q-btn
          v-for="(button, index) in actionButtons"
          :key="index"
          rounded
          :color="button.color"
          :class="button.class"
          :label="button.label"
          type="submit"
          :aria-label="button.ariaLabel"
          :title="button.title"
          @click="onButtonClick(button.action)"
          :disable="isButtonDisabled(button)"
          tabindex="0"
        >
          <q-tooltip v-if="isButtonDisabled(button) && button.disabledTooltip" class="bg-dark90">
            {{ button.disabledTooltip }}
          </q-tooltip>

          <slot :name="`button-${button.action}`"></slot>
        </q-btn>
      </template>

      <template v-else>
        <!-- secondary Btn -->
        <div class="">
          <q-btn
            rounded
            outline
            class="text-dark80 q-pa-sm col-5"
            :label="actionType === 'login' ? 's\'inscrire' : 'se connecter'"
            type="submit"
            :aria-label="
              actionType === 'login'
                ? 'S\'inscrire sur la plateforme'
                : 'Se connecter à votre compte'
            "
            @click="onSubmit(actionType === 'login' ? 'register' : 'login')"
            :disable="isButtonDisabled({ action: actionType === 'login' ? 'register' : 'login' })"
            tabindex="0"
          />
          <!-- main Btn -->
          <q-btn
            rounded
            color="dark80"
            class="text-light20 q-pa-sm col-5"
            :label="actionType === 'login' ? 'se connecter' : 's\'inscrire'"
            type="submit"
            :aria-label="
              actionType === 'login'
                ? 'Se connecter à votre compte'
                : 'S\'inscrire sur la plateforme'
            "
            @click="onSubmit(actionType)"
            :disable="isButtonDisabled({ action: actionType })"
            tabindex="0"
          >
            <q-tooltip v-if="isButtonDisabled({ action: actionType })" class="bg-dark90">
              {{ disabledSubmitMessage }}
            </q-tooltip>
          </q-btn>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  showTitle: {
    type: Boolean,
    default: true,
  },
  disabledSubmit: {
    type: Boolean,
    default: false,
  },
  disabledSubmitMessage: {
    type: String,
    default: 'Veuillez remplir correctement tous les champs',
  },
  actionType: {
    type: String,
    default: 'register',
    validator: (value) => ['register', 'login', 'custom'].includes(value),
  },
  showActions: {
    type: Boolean,
    default: true,
  },
  actionButtons: {
    type: Array,
    default: () => [],
  },
  disabledActions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['submit', 'action'])

const onSubmit = (type) => {
  emit('submit', type)
}

const onButtonClick = (action) => {
  emit('action', action)
  emit('submit', action)
}

const isButtonDisabled = (button) => {
  // Si le bouton a une propriété disabled explicite, on l'utilise
  if (button.disabled !== undefined) {
    return button.disabled
  }

  // On vérifie si le bouton est dans la liste des actions désactivées
  if (props.disabledActions.includes(button.action)) {
    return true
  }

  // Pour les boutons custom (actionType='custom'), on désactive le bouton 'save' si disabledSubmit est true
  if (props.actionType === 'custom' && button.action === 'save') {
    return props.disabledSubmit
  }

  // Pour les autres cas (login/register), on utilise la logique originale
  return props.disabledSubmit && props.actionType === button.action
}
</script>
