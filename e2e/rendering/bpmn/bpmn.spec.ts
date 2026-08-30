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

  test('every flow reaches the shape it points at', async ({ page }, testInfo) => {
    await renderFixture(page, testInfo, '08-black-box-pool.mmd');
    const worstGap = await page.evaluate(() => {
      // Node transforms and path data share the svg's user space, so they compare
      // directly; getBoundingClientRect would mix in the page's own scaling.
      const shapes = [];
      for (const node of document.querySelectorAll('g.node')) {
        const match = /translate\(\s*([\d.-]+)[ ,]+([\d.-]+)/.exec(
          node.getAttribute('transform') ?? ''
        );
        const ring = node.querySelector('circle.bpmn-event-ring');
        const box = node.querySelector('rect.bpmn-activity-rect');
        if (!match || (!ring && !box)) {
          continue;
        }
        const halfWidth = ring
          ? Number(ring.getAttribute('r'))
          : Number(box!.getAttribute('width')) / 2;
        const halfHeight = ring
          ? Number(ring.getAttribute('r'))
          : Number(box!.getAttribute('height')) / 2;
        shapes.push({ x: Number(match[1]), y: Number(match[2]), halfWidth, halfHeight });
      }
      let worst = 0;
      for (const path of document.querySelectorAll('g.edgePaths path')) {
        const points = [...(path.getAttribute('d') ?? '').matchAll(/([\d.-]+),([\d.-]+)/g)].map(
          (m) => [Number(m[1]), Number(m[2])]
        );
        if (points.length < 2) {
          continue;
        }
        for (const point of [points[0], points[points.length - 1]]) {
          let nearest = Number.POSITIVE_INFINITY;
          for (const shape of shapes) {
            nearest = Math.min(
              nearest,
              Math.max(
                Math.abs(point[0] - shape.x) - shape.halfWidth,
                Math.abs(point[1] - shape.y) - shape.halfHeight
              )
            );
          }
          worst = Math.max(worst, nearest);
        }
      }
      return worst;
    });

    // An event reserves room for a caption above and below its circle, and a flow that
    // bends on its way in used to stop at that reserved box rather than at the circle,
    // ending tens of pixels short of anything drawn. The remaining slack is the
    // arrowhead's own offset.
    expect(worstGap).toBeLessThan(10);
  });

  test('pools with no content are drawn as bands of their own', async ({ page }, testInfo) => {
    await renderFixture(page, testInfo, '08-black-box-pool.mmd');
    const bands = await page.evaluate(() =>
      [...document.querySelectorAll('g.cluster.swimlane')]
        .map((band) => {
          const body =
            band.querySelector('rect.pool-body') ?? band.querySelector('rect.swimlane-body');
          const label = band.querySelector('.cluster-label');
          if (!body || !label) {
            return null;
          }
          const text = label.getBoundingClientRect();
          return {
            name: label.textContent?.trim() ?? '',
            top: Number(body.getAttribute('y')),
            bottom: Number(body.getAttribute('y')) + Number(body.getAttribute('height')),
            label: { x: text.x, y: text.y, width: text.width, height: text.height },
          };
        })
        .filter((band) => band !== null)
    );

    // A participant drawn without its internals is a black box pool. Having no children to
    // take an extent from, both used to keep a zero height and collapse onto each other.
    const empty = bands.filter((band) => band.name === 'Courier' || band.name === 'Supplier');
    expect(empty).toHaveLength(2);
    const [first, second] = empty.sort((a, b) => a.top - b.top);
    expect(second.top).toBeGreaterThanOrEqual(first.bottom - 1);

    // Each title is drawn rotated along its band's height, so a band shorter than its own
    // name would spill text over a neighbour's title.
    for (const [a, b] of bands.flatMap((x, i) => bands.slice(i + 1).map((y) => [x, y]))) {
      const overlapX =
        Math.min(a.label.x + a.label.width, b.label.x + b.label.width) -
        Math.max(a.label.x, b.label.x);
      const overlapY =
        Math.min(a.label.y + a.label.height, b.label.y + b.label.height) -
        Math.max(a.label.y, b.label.y);
      expect(Math.min(overlapX, overlapY)).toBeLessThanOrEqual(1);
    }
  });

  test('an artifact hangs inside the lane that holds what it annotates', async ({
    page,
  }, testInfo) => {
    await renderFixture(page, testInfo, '09-data-associations.mmd');
    const overflow = await page.evaluate(() => {
      const boxOf = (node: Element) => {
        const match = /translate\(\s*([\d.-]+)[ ,]+([\d.-]+)/.exec(
          node.getAttribute('transform') ?? ''
        );
        const bounds = node.querySelector('rect.bpmn-bounds');
        if (!match || !bounds) {
          return null;
        }
        const width = Number(bounds.getAttribute('width'));
        const height = Number(bounds.getAttribute('height'));
        return {
          left: Number(match[1]) - width / 2,
          right: Number(match[1]) + width / 2,
          top: Number(match[2]) - height / 2,
          bottom: Number(match[2]) + height / 2,
        };
      };

      const lane = document.querySelector('g.cluster.swimlane rect.swimlane-body');
      if (!lane) {
        return null;
      }
      const laneBox = {
        left: Number(lane.getAttribute('x')),
        top: Number(lane.getAttribute('y')),
        right: Number(lane.getAttribute('x')) + Number(lane.getAttribute('width')),
        bottom: Number(lane.getAttribute('y')) + Number(lane.getAttribute('height')),
      };

      let worst = 0;
      let counted = 0;
      for (const node of document.querySelectorAll('g.node')) {
        if (
          !node.querySelector('.bpmn-data-page') &&
          !node.querySelector('.bpmn-annotation-bracket')
        ) {
          continue;
        }
        const box = boxOf(node);
        if (!box) {
          continue;
        }
        counted++;
        worst = Math.max(
          worst,
          laneBox.left - box.left,
          box.right - laneBox.right,
          laneBox.top - box.top,
          box.bottom - laneBox.bottom
        );
      }
      return { worst, counted };
    });

    expect(overflow).not.toBeNull();
    expect(overflow!.counted).toBe(4);
    // An artifact is placed from the element it annotates rather than laid out, so the
    // lane has to be told to leave room for it or it is drawn outside its own pool.
    expect(overflow!.worst).toBeLessThanOrEqual(1);
  });

  test('an association meets the shape square and touching', async ({ page }, testInfo) => {
    await renderFixture(page, testInfo, '09-data-associations.mmd');
    const arrivals = await page.evaluate(() => {
      const shapes = [];
      for (const node of document.querySelectorAll('g.node')) {
        const match = /translate\(\s*([\d.-]+)[ ,]+([\d.-]+)/.exec(
          node.getAttribute('transform') ?? ''
        );
        if (!match) {
          continue;
        }
        const activity = node.querySelector('rect.bpmn-activity-rect');
        const page_ = node.querySelector('.bpmn-data-page');
        const bracket = node.querySelector('.bpmn-annotation-bracket');
        const bounds = node.querySelector('rect.bpmn-bounds');
        let halfWidth;
        let halfHeight;
        if (activity) {
          halfWidth = Number(activity.getAttribute('width')) / 2;
          halfHeight = Number(activity.getAttribute('height')) / 2;
        } else if (page_) {
          halfWidth = 18;
          halfHeight = 25;
        } else if (bracket && bounds) {
          halfWidth = Number(bounds.getAttribute('width')) / 2;
          halfHeight = Number(bounds.getAttribute('height')) / 2;
        } else {
          continue;
        }
        shapes.push({ x: Number(match[1]), y: Number(match[2]), halfWidth, halfHeight });
      }

      const results = [];
      for (const path of document.querySelectorAll('g.edgePaths path.bpmn-flow-association')) {
        const points = [...(path.getAttribute('d') ?? '').matchAll(/([\d.-]+),([\d.-]+)/g)].map(
          (m) => [Number(m[1]), Number(m[2])]
        );
        if (points.length < 2) {
          continue;
        }
        const last = points[points.length - 1];
        const previous = points[points.length - 2];
        let gap = Number.POSITIVE_INFINITY;
        for (const shape of shapes) {
          gap = Math.min(
            gap,
            Math.max(
              Math.abs(last[0] - shape.x) - shape.halfWidth,
              Math.abs(last[1] - shape.y) - shape.halfHeight
            )
          );
        }
        results.push({
          square: Math.abs(last[0] - previous[0]) < 2 || Math.abs(last[1] - previous[1]) < 2,
          gap,
        });
      }
      return results;
    });

    expect(arrivals).toHaveLength(4);
    for (const arrival of arrivals) {
      // Square to the border it lands on, rather than slanting in, and actually touching
      // it rather than stopping at the box the layout reserved around the glyph.
      expect(arrival.square).toBe(true);
      expect(Math.abs(arrival.gap)).toBeLessThan(2);
    }
  });
});
