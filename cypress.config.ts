import { registerArgosTask } from '@argos-ci/cypress/task';
import coverage from '@cypress/code-coverage/task.js';
import { defineConfig } from 'cypress';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin.js';
import cypressSplit from 'cypress-split';

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

// TEMPORARY FIX: Skip Applitools in GitHub Actions to avoid connection issues
// You can enable this once the connection issue is resolved
const isGitHubActions = process.env.CI === 'true' && process.env.GITHUB_ACTIONS === 'true';

if (process.env.USE_APPLI === 'true' && process.env.APPLITOOLS_API_KEY && !isGitHubActions) {
  // Load Applitools only in local environment
  try {
    const { default: eyesPlugin } = await import('@applitools/eyes-cypress');
    module.exports = eyesPlugin(baseConfig);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Applitools plugin failed to load:', (error as Error).message);
    module.exports = baseConfig;
  }
} else {
  if (isGitHubActions) {
    // eslint-disable-next-line no-console
    console.log('Skipping Applitools in GitHub Actions due to connection issues');
  }
  module.exports = baseConfig;
}
