import eyesPlugin from '@applitools/eyes-cypress';
import { registerArgosTask } from '@argos-ci/cypress/task';
import coverage from '@cypress/code-coverage/task.js';
import { defineConfig } from 'cypress';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin.js';
import cypressSplit from 'cypress-split';

export default eyesPlugin(
  defineConfig({
    projectId: 'n2sma2',
    viewportWidth: 1440,
    viewportHeight: 1024,
    e2e: {
      specPattern: 'cypress/integration/**/*.{js,ts}',
      setupNodeEvents(on, config) {
        coverage(on, config);
        cypressSplit(on, config);

        on('before:browser:launch', (browser, launchOptions) => {
          if (browser.name === 'chrome' && browser.isHeadless) {
            launchOptions.args.push(
              '--window-size=1440,1024',
              '--force-device-scale-factor=1',
              // Additional Chrome flags for CI environment
              '--no-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor'
            );
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
          addMatchImageSnapshotPlugin(on, config);
        }

        // do not forget to return the changed config object!
        return config;
      },
    },
    video: false,
    // Additional config for CI stability
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
  }),
  {
    // Explicitly set server URL to avoid local connection attempts
    serverUrl: 'https://eyes.applitools.com',
    // Configure concurrency for CI
    testConcurrency: 1,
    // Enable full page screenshots
    forceFullPageScreenshot: true,
    // Configure viewport size
    viewportSize: { width: 1440, height: 1024 },
    // Batch configuration
    batch: {
      name: process.env.APPLITOOLS_BATCH_NAME || 'Cypress Tests',
      id: process.env.APPLITOOLS_BATCH_ID,
    },
  }
);
