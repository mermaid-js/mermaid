import eyesPlugin from '@applitools/eyes-cypress';
import CypressCoveragePlugin from 'cypress-monocart-coverage';
import onFix from 'cypress-on-fix';
import { defineConfig } from 'cypress';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin.js';
import cypressSplit from 'cypress-split';
import 'dotenv/config';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export default eyesPlugin(
  defineConfig({
    projectId: 'n2sma2',
    viewportWidth: 1440,
    viewportHeight: 1024,
    // Native V8 coverage report generation (cypress-monocart-coverage's
    // `coverageAfter` task) can exceed Cypress's default 60s taskTimeout on the
    // heaviest specs (e.g. iconShape.spec.ts), failing the after-all hook. Give
    // task hooks more headroom.
    taskTimeout: 180000,
    e2e: {
      baseUrl: `http://localhost:${process.env.MERMAID_PORT ?? 9000}`,
      specPattern: 'cypress/integration/**/*.{js,ts}',
      setupNodeEvents(on, config) {
        // cypress-on-fix lets the monocart plugin and our own
        // `before:browser:launch` handler both register (Cypress keeps only the
        // last one otherwise, dropping monocart's CDP --remote-debugging-port).
        on = onFix(on);
        // Collect native V8 coverage from Chrome (no instrumentation) and emit an
        // istanbul lcov for the mermaid package, mapped back to source via the
        // bundle's inline source maps.
        CypressCoveragePlugin(on, config, {
          name: 'mermaid e2e coverage',
          // Only the mermaid bundle and its lazy chunks (not sibling packages).
          entryFilter: {
            '**/mermaid.esm.mjs': true,
            '**/chunks/mermaid.esm/**': true,
            '**/*': false,
          },
          // Sourcemap paths are package-relative (`src/...`); make them repo-relative.
          sourcePath: (filePath: string) =>
            filePath.startsWith('src/') ? `packages/mermaid/${filePath}` : filePath,
          sourceFilter: (sourcePath: string) => sourcePath.startsWith('packages/mermaid/src/'),
          outputDir: './coverage/cypress',
          reports: ['lcovonly', 'json'],
        });
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

        // Argos capture uses cy.argosScreenshot from @argos-ci/cypress/support (e2e.js).
        // Do not register registerArgosTask — its after:run hook uploads to Argos.
        // Raw PNGs batch-upload in the argos-batch CI job instead.
        if (!config.env.useArgos) {
          addMatchImageSnapshotPlugin(on, config);
        }
        on('task', {
          listSwimlaneFixtures() {
            return readdirSync(
              join(config.projectRoot, 'cypress/platform/dev-diagrams/layout-tests/swimlanes')
            )
              .filter((file) => file.endsWith('.mmd'))
              .sort();
          },
        });
        // do not forget to return the changed config object!
        return config;
      },
    },
    video: false,
  })
);
