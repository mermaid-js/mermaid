/* eslint-disable @typescript-eslint/no-require-imports -- Needed for `default` interop with CommonJS module */
const eyesPlugin = require('@applitools/eyes-cypress');
const { registerArgosTask } = require('@argos-ci/cypress/task');
const coverage = require('@cypress/code-coverage/task.js');
const cypress = require('cypress');
const cypressImageSnapshotPlugin = require('cypress-image-snapshot/plugin.js');
const cypressSplit = require('cypress-split');
require('dotenv/config');

module.exports = eyesPlugin(
  cypress.defineConfig({
    projectId: 'n2sma2',
    viewportWidth: 1440,
    viewportHeight: 1024,
    e2e: {
      baseUrl: `http://localhost:${process.env.MERMAID_PORT ?? 9000}`,
      specPattern: 'cypress/integration/**/*.{js,ts}',
      setupNodeEvents(on, config) {
        coverage(on, config);
        cypressSplit(on, config);
        on('before:browser:launch', (browser, launchOptions) => {
          if (browser.name === 'chrome' && browser.isHeadless) {
            launchOptions.args.push('--window-size=1440,1024', '--force-device-scale-factor=1');
          }
          return launchOptions;
        });
        // copy any needed variables from process.env to config.env
        config.env.useAppli = process.env.USE_APPLI ? true : false;
        config.env.useArgos = process.env.RUN_VISUAL_TEST === 'true';

        if (config.env.useArgos) {
          registerArgosTask(on, config, {
            // Enable upload to Argos only when it runs on CI.
            uploadToArgos: !!process.env.CI,
          });
        } else {
          cypressImageSnapshotPlugin.addMatchImageSnapshotPlugin(on, config);
        }
        // do not forget to return the changed config object!
        return config;
      },
    },
    video: false,
  })
);
