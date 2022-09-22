// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  package: ['.ts'],
  transform: {
    '^.+\\.[jt]sx?$': 'esbuild-jest',
    '^.+\\.jison$': [
      path.resolve(__dirname, './src/jison/transformer.js'),
      { 'token-stack': true },
    ],
  },
  transformIgnorePatterns: ['/node_modules/?!(d3)/'],
  testPathIgnorePatterns: ['/node_modules/', '.cache', './cypress'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '^.+\\.jison$', // might be able to fix in future if .jison adds source-map support
  ],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'jison'],
};
