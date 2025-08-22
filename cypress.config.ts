// cypress.config.ts
import { defineConfig } from 'cypress';
import { registerArgosTask } from '@argos-ci/cypress/task';
import coverage from '@cypress/code-coverage/task.js';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin.js';
import cypressSplit from 'cypress-split';
import eyesPlugin from '@applitools/eyes-cypress';

// --- Base Cypress config ---
const baseConfig = defineConfig({
  projectId: 'n2sma2',
  viewportWidth: 1440,
  viewportHeight: 1024,
  e2e: {
    specPattern: 'cypress/integration/**/*.{js,ts}',
    setupNodeEvents(on, config) {
      // Code coverage
      coverage(on, config);

      // Test splitting
      cypressSplit(on, config);

      // Browser tweaks for CI
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

      // Env flags
      config.env.useAppli = process.env.USE_APPLI === 'true';
      config.env.useArgos = process.env.RUN_VISUAL_TEST === 'true';

      if (config.env.useArgos) {
        registerArgosTask(on, config, { uploadToArgos: !!process.env.CI });
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

// --- Conditional Applitools wrapper ---
function withApplitools(config: Cypress.ConfigOptions): Cypress.ConfigOptions {
  const shouldLoadApplitools = !!process.env.APPLITOOLS_API_KEY && process.env.USE_APPLI === 'true';

  if (shouldLoadApplitools) {
    return eyesPlugin(config, {
      serverUrl: 'https://eyes.applitools.com',
      batch: {
        name:
          process.env.APPLITOOLS_BATCH_NAME ||
          `GitHub Actions - ${process.env.GITHUB_WORKFLOW || 'Cypress Tests'}`,
        id:
          process.env.APPLITOOLS_BATCH_ID ||
          `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`,
      },
      testConcurrency: 1,
      browser: { name: 'chrome', width: 1440, height: 1024 },
      viewportSize: { width: 1440, height: 1024 },
      matchTimeout: 2000,
      forceFullPageScreenshot: true,
      // cspell:ignore dont
      dontCloseBatches: false,
      saveDebugScreenshots: false,
      saveDiffs: false,
      concurrency: 1,
    });
  }

  return config;
}

// --- Export final config ---
export default withApplitools(baseConfig);
