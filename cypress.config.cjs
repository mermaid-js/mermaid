/* eslint-disable @typescript-eslint/no-var-requires */

const { defineConfig } = require('cypress');
const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
const coverage = require('@cypress/code-coverage/task');

module.exports = defineConfig({
  projectId: 'n2sma2',
  e2e: {
    specPattern: 'cypress/integration/**/*.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      coverage(on, config);
      addMatchImageSnapshotPlugin(on, config);
      // copy any needed variables from process.env to config.env
      config.env.useAppli = process.env.USE_APPLI ? true : false;

      // do not forget to return the changed config object!
      return config;
    },
  },
  video: false,
});

require('@applitools/eyes-cypress')(module);
