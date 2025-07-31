<template>
  <div class="flex flex-center full-height q-pa-md">
    <q-card class="text-center shadow-10 rounded-borders" style="max-width: 516px; width: 100%">
      <q-card-section class="q-pb-none">
        <q-icon name="cancel" size="80px" color="orange" class="q-mb-md" />

        <div class="text-h4 text-weight-bold text-orange q-mb-md">Don annulé</div>

        <div class="text-body1 text-grey-7 q-mb-lg">
          Aucun problème ! Nous comprenons parfaitement que vous ayez changé d'avis. Votre soutien
          peut prendre bien d'autres formes et nous l'apprécions déjà.
        </div>
      </q-card-section>

      <q-separator class="q-my-md" />

      <q-card-section class="q-pt-none">
        <div class="text-body2 text-grey-7 q-mb-lg">
          Vous pouvez continuer à profiter de QuizzFiesta ou réessayer plus tard si vous le
          souhaitez.
        </div>

        <div class="q-gutter-sm">
          <q-btn
            color="primary"
            label="Retour à l'accueil"
            icon="home"
            no-caps
            rounded
            size="md"
            to="/"
            class="q-px-xl q-mb-sm"
          />

          <q-btn
            color="secondary"
            label="Réessayer le don"
            icon="favorite"
            no-caps
            rounded
            size="md"
            to="/payment"
            outline
            class="q-px-xl"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>
