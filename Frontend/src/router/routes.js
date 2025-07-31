const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/accueil',
    component: () => import('pages/Accueil/AccueilIndexPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/login',
    component: () => import('pages/Authentification/AuthLogin.vue'),
    meta: { requiresGuest: true, showHeader: false }
  },
  {
    path: '/register',
    component: () => import('pages/Authentification/AuthRegister.vue'),
    meta: { requiresGuest: true, showHeader: false }
  },
  {
    path: '/reset-password',
    component: () => import('pages/Authentification/ResetPassword.vue'),
    meta: { requiresGuest: true, showHeader: false, showBackArrow: true }
  },
  {

    path: '/dashboard',
    component: () => import('pages/Dashboard/DashBoardIndexPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/account',
    component: () => import('pages/Account/AccountIndexPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/account/edit',
    component: () => import('src/pages/Account/AccountPageUpdate.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true },
  },
  {
    path: '/search',
    component: () => import('pages/Search/SearchIndexPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },

  //QUIZ
  {
    path: '/quiz/create',
    component: () => import('pages/Quiz/QuizCreateIndexPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/quiz/edit/:id',
    component: () => import('pages/Quiz/QuizUpdateIndexPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/quiz/session/join',
    component: () => import('pages/Quiz/SessionJoinPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/quiz/manage',
    component: () => import('pages/Quiz/QuizManagementPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/quiz/demo',
    component: () => import('pages/Quiz/ObjectLayoutDemo.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },

  {
    path: '/quiz/session/join/:sessionCode',
    component: () => import('pages/Quiz/SessionLobbyPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/quiz/session/:sessionId/lobby',
    component: () => import('pages/Quiz/SessionLobbyPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/quiz/session/:sessionId/play',
    component: () => import('pages/Quiz/SessionPlayPage.vue'),
    meta: { requiresAuth: true, showHeader: false, showBackArrow: false }
  },

  //ORGANISATION
  {
    path: '/organisation/create',
    component: () => import('pages/Organisation/OrganisationCreateIndexPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/scores',
    component: () => import('pages/Scores/ScoresIndexPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/settings',
    component: () => import('pages/Settings/SettingsIndexPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },

  //PAYMENT
  {
    path: '/payment/success',
    component: () => import('pages/Payment/PaymentSuccessPage.vue'),
    meta: {  showHeader: false, showBackArrow: false }
  },
  {
    path: '/payment/cancel',
    component: () => import('pages/Payment/PaymentCancelPage.vue'),
    meta: { showHeader: false, showBackArrow: false }
  },
  {
    path: '/payment/checkout',
    component: () => import('pages/Payment/PaymentCheckoutPage.vue'),
    meta: { showHeader: false, showBackArrow: false }
  },

  //ERROR 404
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
