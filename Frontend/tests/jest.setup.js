// Configuration Jest pour Vue 3 + Quasar
import { config } from '@vue/test-utils'
import { createQuasar } from 'quasar'

// Configuration globale pour les tests Vue
config.global.plugins = [createQuasar()]

// Mock pour window.location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    protocol: 'http:',
    href: 'http://localhost:9000'
  },
  writable: true
})

// Mock pour localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock global pour les fonctions de navigateur
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
