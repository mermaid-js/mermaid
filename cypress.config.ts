import { defineConfig } from 'cypress';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin';
import coverage from '@cypress/code-coverage/task';
import eyesPlugin from '@applitools/eyes-cypress';
import { registerArgosTask } from '@argos-ci/cypress/task';

export default eyesPlugin(
  defineConfig({
    projectId: 'n2sma2',
    viewportWidth: 1440,
    viewportHeight: 1024,
    e2e: {
      specPattern: 'cypress/integration/**/*.{js,ts}',
      setupNodeEvents(on, config) {
        coverage(on, config);
        on('before:browser:launch', (browser, launchOptions) => {
          if (browser.name === 'chrome' && browser.isHeadless) {
            launchOptions.args.push('--window-size=1440,1024', '--force-device-scale-factor=1');
          }
          return launchOptions;
        });
        // copy any needed variables from process.env to config.env
        config.env.useAppli = process.env.USE_APPLI ? true : false;
        config.env.useArgos = !!process.env.ARGOS_TOKEN;

        if (config.env.useArgos) {
          // Argos
          registerArgosTask(on, config, {
            uploadToArgos: !!process.env.CI,
            token: process.env.ARGOS_TOKEN,
          });
        } else {
          addMatchImageSnapshotPlugin(on, config);
        }
        // do not forget to return the changed config object!
        return config;
      },
    },
    video: false,
  })
);
