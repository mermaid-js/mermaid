/* eslint-disable @typescript-eslint/no-var-requires */

const { defineConfig } = require('cypress');
const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');

module.exports = defineConfig({
  projectId: 'n2sma2',
  viewportWidth: 1440,
  viewportHeight: 1024,
  e2e: {
    specPattern: 'cypress/integration/**/*.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless) {
          launchOptions.args.push('--window-size=1440,1024', '--force-device-scale-factor=1');
        }
        return launchOptions;
      });
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
