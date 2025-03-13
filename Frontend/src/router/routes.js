// src/router/routes.js
const routes = [
  {
    path: '/',
    redirect: '/accueil'
  },
  {
    path: '/accueil',
    component: () => import('pages/Accueil/AccueilIndexPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    component: () => import('pages/Authentification/AuthLogin.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    component: () => import('pages/Authentification/AuthRegister.vue'),
    meta: { requiresGuest: true } 
  },
  {
    path: '/reset-password',
    component: () => import('pages/Authentification/ResetPassword.vue'),
    meta: { requiresGuest: true } 
  },
  {
    path: '/dashboard',
    component: () => import('pages/Dashboard/DashBoardIndexPage.vue'),
    meta: { requiresAuth: true } 
  },
  {
    path: '/account',
    component: () => import('pages/Account/AccountIndexPage.vue'),
  },
  {
    path: '/search',
    component: () => import('pages/Search/SearchIndexPage.vue'),
  },
  {
    path: '/scores',
    component: () => import('pages/Scores/ScoresIndexPage.vue')
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes