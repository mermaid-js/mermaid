/**
 * Corpus check: no two tree connectors may be drawn on top of each other.
 *
 * `layoutCore.spec.ts` works on hand-built graphs, which is right for the
 * placement rules but too tidy to catch this: a fan of eight children on one node
 * only shows up in a real diagram. `edge-types.mmd` has exactly that, and it drew
 * all eight connectors turning on one line — eight horizontal runs stacked into a
 * single bar that no reader could untangle.
 *
 * So the assertion is the property itself, over every fixture in the corpus rather
 * than over one graph: two orthogonal runs may cross, and they may meet at a shared
 * node, but they may never run *along* each other. Overlapping collinear runs are
 * precisely what makes a drawing unreadable — the ink of two edges becomes one line.
 *
 * Only tree connectors are checked. Core edges are grid-like's straight
 * centre-to-centre lines, which this layout is not allowed to change.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import type { Edge } from '../../types.js';
import { applyFixtureContentSizesStrict, loadSizesFixture } from '../ddlt/fixtureSizes.js';
import { layoutTestsDir } from '../ddlt/paths.js';
import { parseMmdFileToLayoutData } from '../ddlt/parseToLayoutData.js';
import { applyFixtureEdgeLabelSizes } from '../ddlt/backends.js';
import { runGridAttachedLayoutCore } from './layoutCore.js';

const FIXTURE_DIR = join(layoutTestsDir(), 'hola-faithful');
const EPSILON = 0.5;

function fixtureNames(): string[] {
  const files = readdirSync(FIXTURE_DIR);
  return (
    files
      .filter((file) => file.endsWith('.mmd'))
      .map((file) => file.replace(/\.mmd$/, ''))
      // A `.mmd` with no captured sizes cannot be laid out DOM-free.
      .filter((name) => files.includes(`${name}.sizes.json`))
      .sort()
  );
}

interface Run {
  edgeId: string;
  vertical: boolean;
  /** Coordinate the run sits on. */
  at: number;
  from: number;
  to: number;
}

/** Axis-aligned runs of a route, with zero-length and diagonal pieces dropped. */
function runsOf(edge: Edge): Run[] {
  const runs: Run[] = [];
  const points = edge.points ?? [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const horizontal = Math.abs(a.y - b.y) < 1e-6;
    const vertical = Math.abs(a.x - b.x) < 1e-6;
    if (horizontal === vertical) {
      continue;
    }
    const [from, to] = vertical ? [a.y, b.y] : [a.x, b.x];
    if (Math.abs(to - from) < EPSILON) {
      continue;
    }
    runs.push({
      edgeId: edge.id,
      vertical,
      at: vertical ? a.x : a.y,
      from: Math.min(from, to),
      to: Math.max(from, to),
    });
  }
  return runs;
}

function overlapLength(a: Run, b: Run): number {
  if (a.vertical !== b.vertical || Math.abs(a.at - b.at) > EPSILON) {
    return 0;
  }
  return Math.min(a.to, b.to) - Math.max(a.from, b.from);
}

describe('grid-attached over the hola-faithful fixture corpus', () => {
  beforeAll(() => {
    setLogLevel('fatal');
    addDiagrams();
  });

  const names = fixtureNames();

  it('finds fixtures to run', () => {
    expect(names.length).toBeGreaterThan(5);
  });

  for (const name of names) {
    it(`draws no two tree connectors along each other in ${name}`, async () => {
      const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
        stampFlowchartRendererFields: true,
      });
      const sizes = loadSizesFixture(join(FIXTURE_DIR, `${name}.sizes.json`));
      applyFixtureContentSizesStrict(layout, sizes);
      applyFixtureEdgeLabelSizes(layout, sizes);

      runGridAttachedLayoutCore(layout);

      // Tree connectors are the routes this layout produces; core edges are
      // grid-like's and are out of scope.
      const runs = layout.edges
        .filter((edge) => edge.hasIntersectionPoints === true && edge.start !== edge.end)
        .flatMap((edge) => runsOf(edge));

      const offenders: string[] = [];
      for (let i = 0; i < runs.length; i++) {
        for (let j = i + 1; j < runs.length; j++) {
          if (runs[i].edgeId === runs[j].edgeId) {
            continue;
          }
          const shared = overlapLength(runs[i], runs[j]);
          if (shared > EPSILON) {
            offenders.push(
              `${runs[i].edgeId} and ${runs[j].edgeId} share ${shared.toFixed(1)}px of ` +
                `${runs[i].vertical ? 'vertical' : 'horizontal'} line at ${runs[i].at.toFixed(1)}`
            );
          }
        }
      }

      expect(offenders).toEqual([]);
    });
  }
});
