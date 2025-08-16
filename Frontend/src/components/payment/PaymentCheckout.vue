<template>
  <q-card class="flex flex-center">
    <q-card-section class="flex flex-center">
      <div class="column items-center">
        <img :src="Logo" alt="Logo de Quiz Fiesta" style="width: 200px; margin-bottom: 16px" />
        <div class="text-center q-mb-lg">
          <h3>Choisissez le montant de votre don</h3>
          <p class="text-body2 text-grey-7">Votre soutien nous aide à améliorer QuizzFiesta</p>
        </div>

        <div class="q-gutter-sm q-mb-lg" style="max-width: 400px">
          <div class="row q-gutter-sm justify-center">
            <q-btn
              v-for="amount in predefinedAmounts"
              :key="amount.amount"
              color="secondary"
              :label="amount.label"
              @click="selectedAmount = amount.amount"
              class="col-auto"
              style="min-width: 4em"
              :outline="selectedAmount !== amount.amount"
              rounded
              no-caps
            />
          </div>
        </div>

        <div class="text-center q-mb-lg" v-if="selectedAmount">
          <h5>Montant sélectionné : {{ formatAmount(selectedAmount) }}</h5>
        </div>

        <div class="flex q-gutter-md">
          <q-btn
            color="secondary"
            label="Annuler"
            to="/accueil"
            class="q-mt-md"
            size="lg"
            rounded
            outline
            no-caps
          />
          <q-btn
            color="secondary"
            label="Procéder au paiement"
            @click="handleCheckout"
            class="q-mt-md"
            :disabled="!selectedAmount"
            size="lg"
            rounded
            no-caps
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import PaymentService from 'src/services/PaymentService'
import { useQuasar } from 'quasar'
import { ref, onMounted } from 'vue'
import Logo from 'src/assets/logo_quiz_fiesta.svg'

const $q = useQuasar()
const predefinedAmounts = ref([])
const selectedAmount = ref(null)

const formatAmount = (amount) => {
  return amount / 100 + '€'
}

const loadPredefinedAmounts = async () => {
  try {
    const amounts = await PaymentService.getPredefinedAmounts()
    predefinedAmounts.value = amounts
    if (amounts.length > 0) {
      selectedAmount.value = amounts[0].amount
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      position: 'top',
      message: 'Erreur lors du chargement des montants.',
    })
  }
}

const handleCheckout = async () => {
  if (!selectedAmount.value) {
    $q.notify({
      type: 'negative',
      position: 'top',
      message: 'Veuillez sélectionner un montant.',
    })
    return
  }

  try {
    const res = await PaymentService.createCheckoutSession(selectedAmount.value)
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

onMounted(() => {
  loadPredefinedAmounts()
})
</script>
