<template>
  <div class="flex flex-center full-height q-pa-md">
    <q-card class="text-center shadow-10 rounded-borders" style="max-width: 516px; width: 100%">
      <q-card-section class="q-pb-none">
        <q-icon name="check_circle" size="80px" color="positive" class="q-mb-md" />

        <div class="text-h4 text-weight-bold text-positive q-mb-md">Merci pour votre don !</div>

        <div class="text-body1 text-grey-7 q-mb-lg">
          Nous apprécions sincèrement votre soutien et votre générosité. Grâce à des personnes comme
          vous, nous pouvons continuer à améliorer QuizzFiesta.
        </div>
      </q-card-section>

      <q-separator class="q-my-md" />

      <q-card-section class="q-pt-none">
        <div class="text-body2 text-grey-7 q-mb-lg">
          Si vous avez des questions, n'hésitez pas à nous contacter :
        </div>

        <q-btn
          flat
          no-caps
          color="secondary"
          icon="email"
          label="clementrea7@gmail.com"
          href="mailto:clementrea7@gmail.com"
          class="q-mb-lg"
        />

        <div class="q-gutter-sm">
          <q-btn
            color="secondary"
            label="Retour à l'accueil"
            icon="home"
            no-caps
            rounded
            size="md"
            to="/"
            class="q-px-xl"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>
