/**
 * Agentflow conformance suite — part 1 of issue #13.
 *
 * Discovers every `<case>-agentflow.mmd` file under `./fixtures/`, parses
 * it, runs the post-parse validators, and compares the outcome /
 * diagnostics to the paired `<case>-agentflow.expected.json`. Adding a
 * new case is a two-file change with no test-code edits.
 *
 * The `-agentflow` suffix lets agentflow conformance fixtures share a
 * conformance root with other diagram types later without filename
 * collisions — each diagram type would use its own `-<type>.mmd`
 * suffix and discovery filter.
 *
 * PR 4 ships a minimal pair of fixtures proving the runner end-to-end.
 * PR 5 fills the directory with the full wave-1 corpus, including every
 * §19 Semantic Pattern from `AGENTFLOW-SYNTAX.md`.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { matchExpected, runFixture } from './runner.js';
import type { FixtureExpectation } from './runner.js';

const thisDir = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(thisDir, 'fixtures');
const FIXTURE_SUFFIX = '-agentflow.mmd';

function discoverFixtures(): string[] {
  const entries = readdirSync(FIXTURE_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(FIXTURE_SUFFIX))
    .map((e) => e.name.slice(0, -FIXTURE_SUFFIX.length))
    .sort();
}

const fixtureNames = discoverFixtures();

describe('agentflow conformance suite', () => {
  it('has discovered at least one fixture', () => {
    // Early warning if path resolution or filename convention drifts.
    expect(fixtureNames.length).toBeGreaterThan(0);
  });

  // Use test.each so each fixture shows up as a separate test entry with a
  // clear name in the reporter. Failures point at the fixture, not a
  // nested assertion inside a forEach.
  describe.each(fixtureNames)('%s', (name) => {
    const source = readFileSync(join(FIXTURE_DIR, `${name}${FIXTURE_SUFFIX}`), 'utf8');
    const expected = JSON.parse(
      readFileSync(join(FIXTURE_DIR, `${name}-agentflow.expected.json`), 'utf8')
    ) as FixtureExpectation;

    it('matches its expected outcome and diagnostics', () => {
      const result = runFixture(source);
      const failures = matchExpected(result, expected);
      if (failures.length > 0) {
        const summary =
          `\nFixture "${name}" did not match expectations:\n` +
          failures.map((f) => `  • [${f.kind}] ${f.message}`).join('\n') +
          `\n\nActual diagnostics (${result.diagnostics.length}):\n` +
          result.diagnostics
            .map(
              (d) =>
                `  • id=${d.id} severity=${d.severity} nodeId=${d.nodeId ?? '-'} ` +
                `edgeId=${d.edgeId ?? '-'} line=${d.position?.startLine ?? '-'}  "${d.message}"`
            )
            .join('\n');
        throw new Error(summary);
      }
    });
  });
});
