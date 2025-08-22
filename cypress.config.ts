import eyesPlugin from '@applitools/eyes-cypress';
import { registerArgosTask } from '@argos-ci/cypress/task';
import coverage from '@cypress/code-coverage/task.js';
import { defineConfig } from 'cypress';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin.js';
import cypressSplit from 'cypress-split';

// Set environment variables to force cloud-only mode
process.env.APPLITOOLS_SERVER_URL = 'https://eyes.applitools.com';
process.env.APPLITOOLS_DONT_CLOSE_BATCHES = 'false';

const baseConfig = defineConfig({
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
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security'
          );
        }
        return launchOptions;
      });

      config.env.useAppli = process.env.USE_APPLI ? true : false;
      config.env.useArgos = process.env.RUN_VISUAL_TEST === 'true';

      if (config.env.useArgos) {
        registerArgosTask(on, config, {
          uploadToArgos: !!process.env.CI,
        });
      } else {
        addMatchImageSnapshotPlugin(on, config);
      }

      return config;
    },
  },
  video: false,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 10000,
  pageLoadTimeout: 30000,
});

// Only apply Applitools if we should use it
const shouldLoadApplitools = process.env.APPLITOOLS_API_KEY && process.env.USE_APPLI === 'true';

export default shouldLoadApplitools
  ? eyesPlugin(baseConfig, {
      // Force cloud server URL
      serverUrl: 'https://eyes.applitools.com',

      // Batch configuration
      batch: {
        name:
          process.env.APPLITOOLS_BATCH_NAME ||
          `GitHub Actions - ${process.env.GITHUB_WORKFLOW || 'Cypress Tests'}`,
        id:
          process.env.APPLITOOLS_BATCH_ID ||
          `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`,
      },

      // Conservative settings for CI
      testConcurrency: 1,

      // Browser configuration
      browser: {
        width: 1440,
        height: 1024,
        name: 'chrome',
      },

      // Viewport
      viewportSize: { width: 1440, height: 1024 },

      // Performance settings
      matchTimeout: 2000,
      forceFullPageScreenshot: true,

      // Ensure batches close properly
      // cspell:ignore dont
      dontCloseBatches: false,

      // Disable debug features that might cause issues
      saveDebugScreenshots: false,
      saveDiffs: false,

      // Set explicit concurrency
      concurrency: 1,
    })
  : baseConfig;
