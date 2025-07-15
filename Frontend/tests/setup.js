// Configuration simple pour les tests Frontend (comme Backend)
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      }
    }]
  ]
}

// Mock global simple pour window.location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    protocol: 'http:'
  },
  writable: true
})
