// jest.config.js
module.exports = {
  // verbose: true,
  transform: {
    '^.+\\.jsx?$': '../transformer.js'
  },
  preset: 'jest-puppeteer',
  'globalSetup': 'jest-environment-puppeteer/setup',
  'globalTeardown': 'jest-environment-puppeteer/teardown',
  'testEnvironment': 'jest-environment-puppeteer'
}
