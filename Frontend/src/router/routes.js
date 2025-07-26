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
  {
    path: '/quiz/create',
    component: () => import('pages/Quiz/QuizCreateIndexPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/quiz/join',
    component: () => import('pages/Quiz/QuizJoinPage.vue'),
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
    path: '/quiz/lobby/:id',
    component: () => import('pages/Quiz/QuizLobbyPage.vue'),
    meta: { requiresAuth: true, showHeader: true, showBackArrow: true }
  },
  {
    path: '/quiz/play/:id',
    component: () => import('pages/Quiz/QuizPlayPage.vue'),
    meta: { requiresAuth: true, showHeader: false, showBackArrow: false }
  },
  // {
  //   path: '/quiz/results/:id',
  //   component: () => import('pages/Quiz/QuizResultsPage.vue'),
  //   meta: { requiresAuth: true, showHeader: true, showBackArrow: false }
  // },
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
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
