import { route } from 'quasar/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import AuthService from 'src/services/AuthService'

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  Router.beforeEach(async (to, from, next) => {
    const isAuthenticated = AuthService.isAuthenticated()

    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (!isAuthenticated) {
        next({
          path: '/login',
          query: { redirect: to.fullPath },
        })
      } else {
        next()
      }
    } else if (to.matched.some((record) => record.meta.requiresGuest)) {
      if (isAuthenticated) {
        next({ path: '/accueil' })
      } else {
        next()
      }
    } else {
      next()
    }
  })

  return Router
})
