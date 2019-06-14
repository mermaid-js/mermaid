module.exports = {
  transform: {
    '^.+\\.jsx?$': './transformer.js'
  },
  transformIgnorePatterns: ['/node_modules/(?!dagre-d3-renderer/lib).*\\.js'],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy'
  }
}
