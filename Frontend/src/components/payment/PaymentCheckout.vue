<template>
  <q-card class="flex flex-center">
    <q-card-section class="flex flex-center">
      <div class="column items-center">
        <img :src="Logo" alt="Logo de Quiz Fiesta" style="width: 200px; margin-bottom: 16px" />
        <div class="description text-center">
          <h3>Appercu du dont</h3>
          <h5>1€</h5>
        </div>
        <q-btn color="secondary" label="Valider" @click="handleCheckout" class="q-mt-md" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import PaymentService from 'src/services/PaymentService'
import { useQuasar } from 'quasar'
import Logo from 'src/assets/logo_quiz_fiesta.svg'

const $q = useQuasar()

const handleCheckout = async () => {
  try {
    const res = await PaymentService.createCheckoutSession()
    if (res.url) {
      window.location.href = res.url
    } else {
      $q.notify({
        type: 'negative',
        position: 'top',
        message: 'Erreur lors de la redirection Stripe.',
      })
    }
  } catch (err) {
    $q.notify({
      type: 'negative',
      position: 'top',
      message: 'Erreur lors de la création de la session.',
    })
  }
}
</script>
