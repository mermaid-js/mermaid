import eyesPlugin from '@applitools/eyes-cypress';
import coverage from '@cypress/code-coverage/task.js';
import { defineConfig } from 'cypress';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin.js';
import cypressSplit from 'cypress-split';
import 'dotenv/config';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const SWIMLANE_FIXTURE_DIR = 'cypress/platform/dev-diagrams/layout-tests/swimlanes';
const USECASE_FIXTURE_DIR = 'cypress/platform/dev-diagrams/diagrams/use-case';

const listSwimlaneFixtureNames = (projectRoot: string): string[] =>
  readdirSync(join(projectRoot, SWIMLANE_FIXTURE_DIR))
    .filter((file) => file.endsWith('.mmd'))
    .sort();

const listUsecaseFixtureNames = (projectRoot: string): string[] =>
  readdirSync(join(projectRoot, USECASE_FIXTURE_DIR))
    .filter((file) => file.endsWith('.mmd'))
    .sort();

export default eyesPlugin(
  defineConfig({
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
        config.env.swimlaneFixtures = listSwimlaneFixtureNames(config.projectRoot);
        config.env.usecaseFixtures = listUsecaseFixtureNames(config.projectRoot);

        // Argos capture uses cy.argosScreenshot from @argos-ci/cypress/support (e2e.js).
        // Do not register registerArgosTask — its after:run hook uploads to Argos.
        // Raw PNGs batch-upload in the argos-batch CI job instead.
        if (!config.env.useArgos) {
          addMatchImageSnapshotPlugin(on, config);
        }
        on('task', {
          listSwimlaneFixtures() {
            return listSwimlaneFixtureNames(config.projectRoot);
          },
          listUsecaseFixtures() {
            return listUsecaseFixtureNames(config.projectRoot);
          },
        });
        // do not forget to return the changed config object!
        return config;
      },
    },
    video: false,
  })
);
