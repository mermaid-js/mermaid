/* eslint-disable @typescript-eslint/no-var-requires */

const { defineConfig } = require('cypress');
const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
require('@applitools/eyes-cypress')(module);

module.exports = defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      addMatchImageSnapshotPlugin(on, config);
      // copy any needed variables from process.env to config.env
      config.env.useAppli = process.env.USE_APPLI ? true : false;
      config.env.codeBranch = process.env.APPLI_BRANCH;

      // do not forget to return the changed config object!
      return config;
    },
    supportFile: 'cypress/support/index.js',
  },
  video: false,
});
