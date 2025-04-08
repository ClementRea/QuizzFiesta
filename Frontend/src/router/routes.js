const routes = [
  {
    path: '/',
    redirect: '/accueil'
  },
  {
    path: '/accueil',
    component: () => import('pages/Accueil/AccueilIndexPage.vue'),
    meta: { requiresAuth: true, showFooter: true }
  },
  {
    path: '/login',
    component: () => import('pages/Authentification/AuthLogin.vue'),
    meta: { requiresGuest: true, showFooter: false }
  },
  {
    path: '/register',
    component: () => import('pages/Authentification/AuthRegister.vue'),
    meta: { requiresGuest: true, showFooter: false } 
  },
  {
    path: '/reset-password',
    component: () => import('pages/Authentification/ResetPassword.vue'),
    meta: { requiresGuest: true, showFooter: false } 
  },
  {
    path: '/dashboard',
    component: () => import('pages/Dashboard/DashBoardIndexPage.vue'),
    meta: { requiresAuth: true, showFooter: true } 
  },
  {
    path: '/account',
    component: () => import('pages/Account/AccountIndexPage.vue'),
    meta: { requiresAuth: true, showFooter: true }
  },
  {
    path: '/account/edit',
    component: () => import('pages/Account/EditAccountPage.vue'),
    meta: { requiresAuth: true, showFooter: true },
  },
  {
    path: '/search',
    component: () => import('pages/Search/SearchIndexPage.vue'),
    meta: { requiresAuth: true, showFooter: true }
  },
  {
    path: '/scores',
    component: () => import('pages/Scores/ScoresIndexPage.vue'),
    meta: { requiresAuth: true, showFooter: true }
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes