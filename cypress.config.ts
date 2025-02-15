import eyesPlugin from '@applitools/eyes-cypress';
import { registerArgosTask } from '@argos-ci/cypress/task';
import coverage from '@cypress/code-coverage/task';
import { defineConfig } from 'cypress';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin';
import cypressSplit from 'cypress-split';

const encodeArgosToken = (options: {
  owner: string;
  repository: string;
  jobId: string;
  runId: string;
}) => `tokenless-github-${Buffer.from(JSON.stringify(options), 'utf8').toString('base64')}`;
// cspell:ignore tokenless

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
            launchOptions.args.push('--window-size=1440,1024', '--force-device-scale-factor=1');
          }
          return launchOptions;
        });
        // copy any needed variables from process.env to config.env
        config.env.useAppli = process.env.USE_APPLI ? true : false;
        config.env.useArgos = !!process.env.CI && !!process.env.ARGOS_TOKEN;

        if (config.env.useArgos) {
          if (!process.env.GITHUB_REPOSITORY) {
            throw new Error('GITHUB_REPOSITORY is not set');
          }
          if (!process.env.GITHUB_JOB) {
            throw new Error('GITHUB_JOB is not set');
          }
          if (!process.env.GITHUB_RUN_ID) {
            throw new Error('GITHUB_RUN_ID is not set');
          }
          registerArgosTask(on, config, {
            token: encodeArgosToken({
              owner: process.env.GITHUB_REPOSITORY.split('/')[0],
              repository: process.env.GITHUB_REPOSITORY.split('/')[1],
              jobId: process.env.GITHUB_JOB,
              runId: process.env.GITHUB_RUN_ID,
            }),
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
