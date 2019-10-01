const path = require('path');

module.exports = {
  transform: {
    '^.+\\.jsx?$': './transformer.js',
    '^.+\\.jison$': path.resolve(__dirname, './jisonTransformer.js')
  },
  transformIgnorePatterns: ['/node_modules/(?!dagre-d3-renderer/lib).*\\.js'],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy'
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'jison']
};
