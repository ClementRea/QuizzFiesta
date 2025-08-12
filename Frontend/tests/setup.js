module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
}

Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    protocol: 'http:',
  },
  writable: true,
})
