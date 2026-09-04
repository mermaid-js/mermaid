import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { imgSnapshotTest } from '../../helpers/util.ts';

const AGENTFLOW_FIXTURE_DIR = 'e2e/platform/dev-diagrams/diagrams/agentflow';

// Derived from the filesystem so a newly-added agentflow fixture is swept
// automatically — the same arrangement the use-case suite uses. A hardcoded
// list drifts silently the moment someone drops a file in the directory.
const AGENTFLOW_FIXTURES = readdirSync(AGENTFLOW_FIXTURE_DIR)
  .filter((file) => file.endsWith('.mmd'))
  .sort();

// viewer.js injects the diagram source with innerHTML, so raw `&`, `<`, and `>`
// in fixture files must be entity-escaped to survive the round trip.
const asMermaidElementSource = (source: string): string =>
  source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Every fixture, on every theme the colour work targets plus the two defaults it must not
 * disturb. `redux-color` is the default theme, so the no-theme case goes through it too.
 */
const THEMES = ['redux-color', 'redux-dark-color', 'default', 'dark'] as const;

test.describe('Agentflow diagram', () => {
  test.describe('dev fixture coverage', () => {
    test('covers every agentflow dev fixture', () => {
      expect(AGENTFLOW_FIXTURES.length, 'generated agentflow fixture inventory').toBeGreaterThan(0);
    });

    AGENTFLOW_FIXTURES.forEach((fixture) => {
      test(`renders ${fixture} end to end`, async ({ page }, testInfo) => {
        const source = readFileSync(`${AGENTFLOW_FIXTURE_DIR}/${fixture}`, 'utf8');
        expect(source, 'fixture should declare the agentflow diagram type').toMatch(
          /(?:^|\n)agentflow-beta(?:\s|$)/
        );
        await imgSnapshotTest(page, testInfo, asMermaidElementSource(source));
        await expect(page.locator('svg .error-icon')).toHaveCount(0);
      });
    });
  });

  test.describe('themes', () => {
    for (const theme of THEMES) {
      // One representative fixture per theme rather than the full cross-product: 15
      // fixtures times 4 themes is 60 screenshots for a colour change that shows up on
      // any diagram carrying every node kind. `15-support-triage` is that diagram.
      test(`renders the support-triage sample on ${theme}`, async ({ page }, testInfo) => {
        const source = readFileSync(`${AGENTFLOW_FIXTURE_DIR}/15-support-triage.mmd`, 'utf8');
        await imgSnapshotTest(page, testInfo, asMermaidElementSource(source), { theme });
        await expect(page.locator('svg .error-icon')).toHaveCount(0);
      });
    }
  });
});
