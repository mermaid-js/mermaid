// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['jest-esbuild', { banner: '"use strict";' }],
    '^.+\\.jsx?$': ['jest-esbuild', { banner: '"use strict";' }],
    '^.+\\.jison$': [
      path.resolve(__dirname, './src/jison/transformer.js'),
      { 'token-stack': true },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!dagre-d3-renderer/lib|khroma).*\\.js'],
  testPathIgnorePatterns: ['/node_modules/', '.cache', './cypress'],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'jison'],
};
