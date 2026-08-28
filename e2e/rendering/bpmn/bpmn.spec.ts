import type { Page, TestInfo } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

const BPMN_FIXTURE_DIR = 'e2e/platform/dev-diagrams/diagrams/bpmn';

// Derived from the filesystem so a newly added fixture is swept automatically; a
// hardcoded list drifts out of date the first time someone adds one.
const BPMN_FIXTURES = readdirSync(BPMN_FIXTURE_DIR)
  .filter((file) => file.endsWith('.mmd'))
  .sort();

// viewer.js injects the source with innerHTML, so raw `&`, `<` and `>` in a fixture
// have to be entity-escaped to survive the round trip.
const asMermaidElementSource = (source: string): string =>
  source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const fixtureSource = (file: string): string =>
  asMermaidElementSource(readFileSync(`${BPMN_FIXTURE_DIR}/${file}`, 'utf8'));

test.describe('bpmn-beta', () => {
  for (const file of BPMN_FIXTURES) {
    test(`renders ${file}`, async ({ page }, testInfo) => {
      await imgSnapshotTest(page, testInfo, fixtureSource(file), {
        screenshotPath: `bpmn/${file.replace(/\.mmd$/, '')}`,
      });
      await expect(page.locator('svg[aria-roledescription="bpmn"]')).toHaveCount(1);
    });
  }

  // The fixture sweep above already snapshots every fixture, so these three assert
  // geometry against the same sources without taking a second screenshot of each.
  const renderFixture = (page: Page, testInfo: TestInfo, file: string) =>
    renderGraph(page, testInfo, fixtureSource(file), { screenshot: false });

  test('a pool frames its lanes rather than sitting beside them', async ({ page }, testInfo) => {
    await renderFixture(page, testInfo, '01-order-handling.mmd');
    const geometry = await page.evaluate(() => {
      // getBBox returns a live SVGRect, whose values are accessors rather than own
      // properties, so it has to be copied into a plain object to cross into the test.
      const plain = ({ x, y, width, height }: DOMRect) => ({ x, y, width, height });
      const read = (selector: string) => {
        const rect = document.querySelector<SVGGraphicsElement>(selector);
        return rect ? plain(rect.getBBox()) : undefined;
      };
      return {
        pool: read('g.cluster.pool rect.pool-body'),
        lanes: [
          ...document.querySelectorAll<SVGGraphicsElement>('g.cluster.swimlane:not(.pool)'),
        ].map((lane) => plain(lane.getBBox())),
      };
    });

    expect(geometry.pool).toBeDefined();
    expect(geometry.lanes.length).toBeGreaterThanOrEqual(2);
    // Every lane sits inside the pool's span, which is what "framing" means and what a
    // pool that only encloses its first lane would fail.
    for (const lane of geometry.lanes) {
      expect(lane.y).toBeGreaterThanOrEqual((geometry.pool?.y ?? 0) - 1);
      expect(lane.y + lane.height).toBeLessThanOrEqual(
        (geometry.pool?.y ?? 0) + (geometry.pool?.height ?? 0) + 1
      );
    }
  });

  test('a group is drawn as one box inside its lane', async ({ page }, testInfo) => {
    await renderFixture(page, testInfo, '07-group.mmd');
    const geometry = await page.evaluate(() => {
      const box = (selector: string) => {
        const element = document.querySelector<SVGGraphicsElement>(selector);
        if (!element) {
          return null;
        }
        const { x, y, width, height } = element.getBBox();
        return { x, y, width, height };
      };
      const inner = document.querySelector('g.bpmn-group rect.inner');
      return {
        body: box('g.cluster.swimlane rect.swimlane-body'),
        group: box('g.bpmn-group rect.outer'),
        innerStroke: inner ? getComputedStyle(inner).stroke : null,
      };
    });

    expect(geometry.body).not.toBeNull();
    expect(geometry.group).not.toBeNull();
    // The lane's body is the space left once its title band is carved off, so a lane
    // measured from the nodes inside the group rather than from the group's own box
    // leaves the group hanging over the edge.
    expect(geometry.group!.x).toBeGreaterThanOrEqual(geometry.body!.x - 1);
    expect(geometry.group!.x + geometry.group!.width).toBeLessThanOrEqual(
      geometry.body!.x + geometry.body!.width + 1
    );
    // The cluster shape draws a second rect that would divide a title band from a body.
    // A group has no such division, so only the outer box may be visible.
    expect(geometry.innerStroke).toBe('none');
  });

  test('a boundary event is pinned to its host activity border', async ({ page }, testInfo) => {
    await renderFixture(page, testInfo, '01-order-handling.mmd');
    const placement = await page.evaluate(() => {
      // Each node group carries its own translate, so getBBox would report both boxes in
      // their own local space and make every node look concentric with every other.
      const centre = (node: Element | null) => {
        const box = node?.getBoundingClientRect();
        return box ? { x: box.x + box.width / 2, y: box.y + box.height / 2, h: box.height } : null;
      };
      // A node's id is prefixed with the render's unique svg id, so it is matched by
      // suffix rather than by the author-supplied name on its own.
      return {
        host: centre(document.querySelector('g.node[id$="-t1"]')),
        boundary: centre(document.querySelector('g.node[id$="-b1"]')),
      };
    });

    expect(placement.host).not.toBeNull();
    expect(placement.boundary).not.toBeNull();
    // The centre sits on the border, so it is half the host's height away from its centre.
    const offset = Math.abs(placement.boundary!.y - placement.host!.y);
    expect(offset).toBeGreaterThan(placement.host!.h / 2 - 6);
    expect(offset).toBeLessThan(placement.host!.h / 2 + 6);
  });
});
