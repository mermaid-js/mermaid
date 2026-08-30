import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { renderGraph } from '../../helpers/util.ts';

const BPMN_FIXTURE_DIR = 'e2e/platform/dev-diagrams/diagrams/bpmn';

const BPMN_FIXTURES = readdirSync(BPMN_FIXTURE_DIR)
  .filter((file) => file.endsWith('.mmd'))
  .sort();

const asMermaidElementSource = (source: string): string =>
  source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The ids a fixture declares, and which of them the notation draws on a border. */
function declared(source: string) {
  const ids: string[] = [];
  const onABorder: string[] = [];
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('bpmn-beta') || /^(title|accTitle|accDescr)\b/.test(line)) {
      continue;
    }
    if (/(-->|-\.->|\.\.>|\.\.\.)/.test(line)) {
      continue;
    }
    const named = /^(?:[a-z][a-z-]*\s+)*?([A-Z_a-z]\w*)\s+"/.exec(line);
    if (named && !/^(pool|lane|group)\b/.test(line)) {
      ids.push(named[1]);
      if (/^boundary\b/.test(line)) {
        onABorder.push(named[1]);
      }
    }
  }
  return { ids, onABorder };
}

/**
 * Measures one rendered fixture.
 *
 * A shape's extent is the union of the marks it draws, not the box the layout reserved
 * around it: an event keeps room for a caption it does not fill, and measuring that box
 * would report neighbours as touching when nothing of them is.
 */
async function measure(page: Page, spec: ReturnType<typeof declared>) {
  return page.evaluate((declaration) => {
    const GLYPH =
      'circle.bpmn-event-ring, rect.bpmn-activity-rect, polygon.bpmn-gateway-diamond,' +
      ' .bpmn-data-page, .bpmn-store-rings, .bpmn-annotation-bracket';
    const onABorder = new Set(declaration.onABorder);
    const idOf = (element: Element) => {
      const raw = element.getAttribute('id') ?? '';
      return declaration.ids.find((id) => raw === id || raw.endsWith('-' + id));
    };

    const shapes = [];
    for (const node of document.querySelectorAll('g.node')) {
      const at = /translate\(\s*([\d.-]+)[ ,]+([\d.-]+)/.exec(node.getAttribute('transform') ?? '');
      if (!at) {
        continue;
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const mark of node.querySelectorAll(GLYPH)) {
        const box = (mark as SVGGraphicsElement).getBBox();
        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.x + box.width);
        maxY = Math.max(maxY, box.y + box.height);
      }
      if (minX === Infinity) {
        continue;
      }
      shapes.push({
        id: idOf(node),
        x: Number(at[1]) + (minX + maxX) / 2,
        y: Number(at[2]) + (minY + maxY) / 2,
        w: maxX - minX,
        h: maxY - minY,
      });
    }

    const edges = [];
    for (const path of document.querySelectorAll('g.edgePaths path')) {
      const raw = path.getAttribute('data-points');
      if (!raw) {
        continue;
      }
      const points = JSON.parse(atob(raw)).map((p: { x: number; y: number }) => [p.x, p.y]);
      if (points.length >= 2) {
        edges.push(points);
      }
    }

    let shapeOverlaps = 0;
    for (let a = 0; a < shapes.length; a++) {
      for (let b = a + 1; b < shapes.length; b++) {
        const first = shapes[a];
        const second = shapes[b];
        // A boundary event is drawn on its host's border, so the two do share space.
        if (onABorder.has(first.id ?? '') || onABorder.has(second.id ?? '')) {
          continue;
        }
        if (
          Math.abs(first.x - second.x) * 2 < first.w + second.w - 2 &&
          Math.abs(first.y - second.y) * 2 < first.h + second.h - 2
        ) {
          shapeOverlaps++;
        }
      }
    }

    // One box per caption: the label selectors nest, and matching more than one would
    // have every caption overlapping itself.
    const captions = [...document.querySelectorAll('g.node foreignObject')]
      .map((c) => c.getBoundingClientRect())
      .filter((box) => box.width > 1 && box.height > 1);
    let captionOverlaps = 0;
    for (let a = 0; a < captions.length; a++) {
      for (let b = a + 1; b < captions.length; b++) {
        const across =
          Math.min(captions[a].right, captions[b].right) -
          Math.max(captions[a].left, captions[b].left);
        const down =
          Math.min(captions[a].bottom, captions[b].bottom) -
          Math.max(captions[a].top, captions[b].top);
        if (across > 1 && down > 1) {
          captionOverlaps++;
        }
      }
    }

    let looseEnds = 0;
    let slantedEnds = 0;
    let throughAShape = 0;
    for (const points of edges) {
      for (const [end, inner] of [
        [points[0], points[1]],
        [points.at(-1), points.at(-2)],
      ]) {
        let nearest = Infinity;
        for (const shape of shapes) {
          nearest = Math.min(
            nearest,
            Math.max(
              Math.abs(end[0] - shape.x) - shape.w / 2,
              Math.abs(end[1] - shape.y) - shape.h / 2
            )
          );
        }
        if (nearest > 10) {
          looseEnds++;
        }
        if (Math.abs(end[0] - inner[0]) > 2 && Math.abs(end[1] - inner[1]) > 2) {
          slantedEnds++;
        }
      }
      crossing: for (let i = 1; i < points.length; i++) {
        for (const shape of shapes) {
          const minX = Math.min(points[i][0], points[i - 1][0]);
          const maxX = Math.max(points[i][0], points[i - 1][0]);
          const minY = Math.min(points[i][1], points[i - 1][1]);
          const maxY = Math.max(points[i][1], points[i - 1][1]);
          if (
            maxX > shape.x - shape.w / 2 + 3 &&
            minX < shape.x + shape.w / 2 - 3 &&
            maxY > shape.y - shape.h / 2 + 3 &&
            minY < shape.y + shape.h / 2 - 3
          ) {
            throughAShape++;
            break crossing;
          }
        }
      }
    }

    const svg = document.querySelector('svg[aria-roledescription="bpmn"]');
    const title = svg?.querySelector('.bpmnTitleText');
    const drawn = svg?.querySelector('g')?.getBBox();
    return {
      drawn: shapes.length,
      shapeOverlaps,
      captionOverlaps,
      looseEnds,
      slantedEnds,
      throughAShape,
      titleInsideDrawing: Boolean(title && drawn && Number(title.getAttribute('y')) > drawn.y),
    };
  }, spec);
}

test.describe('bpmn-beta invariants', () => {
  for (const file of BPMN_FIXTURES) {
    test(`${file} draws every element without collision`, async ({ page }, testInfo) => {
      const source = readFileSync(`${BPMN_FIXTURE_DIR}/${file}`, 'utf8');
      const spec = declared(source);
      await renderGraph(page, testInfo, asMermaidElementSource(source), { screenshot: false });
      const seen = await measure(page, spec);

      expect(seen.drawn).toBe(spec.ids.length);
      expect(seen.shapeOverlaps).toBe(0);
      expect(seen.captionOverlaps).toBe(0);
      // Every line ends on the shape it names, square to the border it meets, and
      // reaches it without passing through anything on the way.
      expect(seen.looseEnds).toBe(0);
      expect(seen.slantedEnds).toBe(0);
      expect(seen.throughAShape).toBe(0);
      expect(seen.titleInsideDrawing).toBe(false);
    });
  }

  test('two flows converging on one event both reach it', async ({ page }, testInfo) => {
    // A ring has no face to land on. Landing at the middle of one is only reachable by a
    // line arriving along the centre, so a second line from another column stopped at the
    // box the layout reserved instead - a caption's height short of anything drawn.
    await renderGraph(
      page,
      testInfo,
      `bpmn-beta TB
  lane "Orders"
    xor g "Approved?"
    user task ship "Ship"
    user task refund "Refund"
    end e "Closed"
  g --> ship
  g --> refund
  ship --> e
  refund --> e
      `,
      { screenshot: false }
    );

    const worstGap = await page.evaluate(() => {
      const event = document.querySelector('g.node[id$="-e"]');
      const at = /translate\(\s*([\d.-]+)[ ,]+([\d.-]+)/.exec(
        event?.getAttribute('transform') ?? ''
      );
      const ring = event?.querySelector('circle.bpmn-event-ring');
      if (!at || !ring) {
        return null;
      }
      const centre = { x: Number(at[1]), y: Number(at[2]) };
      const radius = Number(ring.getAttribute('r'));
      let worst = 0;
      for (const path of document.querySelectorAll('g.edgePaths path')) {
        const raw = path.getAttribute('data-points');
        if (!raw) {
          continue;
        }
        const points = JSON.parse(atob(raw));
        const end = points.at(-1);
        const reach = Math.hypot(end.x - centre.x, end.y - centre.y) - radius;
        // Only the two that arrive here; the rest end elsewhere.
        if (reach < 40) {
          worst = Math.max(worst, reach);
        }
      }
      return worst;
    });

    expect(worstGap).not.toBeNull();
    expect(Math.abs(worstGap!)).toBeLessThan(2);
  });

  test('a narrow rank spacing still leaves the flow somewhere to be drawn', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `---
config:
  bpmn:
    rankSpacing: 20
---
bpmn-beta LR
  lane "Orders"
    start s "Received"
    user task t1 "Check"
    service task t2 "Charge"
    end e "Filed"
  s --> t1 --> t2 --> e
      `,
      { screenshot: false }
    );

    const separation = await page.evaluate(() => {
      const boxes = [...document.querySelectorAll('g.node')].map((node) => {
        const at = /translate\(\s*([\d.-]+)[ ,]+([\d.-]+)/.exec(
          node.getAttribute('transform') ?? ''
        );
        const rect = node.querySelector('rect.bpmn-activity-rect');
        return at && rect
          ? {
              x: Number(at[1]),
              w: Number(rect.getAttribute('width')),
            }
          : null;
      });
      const drawn = boxes.filter((box) => box !== null).sort((p, q) => p.x - q.x);
      let closest = Infinity;
      for (let i = 1; i < drawn.length; i++) {
        closest = Math.min(
          closest,
          drawn[i].x - drawn[i - 1].x - (drawn[i].w + drawn[i - 1].w) / 2
        );
      }
      return Number.isFinite(closest) ? closest : null;
    });

    // The gap asked for is the room between the shapes, not the room they end up sharing.
    expect(separation).not.toBeNull();
    expect(separation!).toBeGreaterThanOrEqual(19);
  });

  test('a pool holds its lanes when the process runs downwards', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `bpmn-beta TB
  pool "Order handling"
    lane "Sales"
      start s "Received"
      user task t "Ship"
      end e "Closed"
  s --> t --> e
      `,
      { screenshot: false }
    );

    const nesting = await page.evaluate(() => {
      const read = (element: Element | null | undefined) =>
        element
          ? {
              left: Number(element.getAttribute('x')),
              top: Number(element.getAttribute('y')),
              right: Number(element.getAttribute('x')) + Number(element.getAttribute('width')),
              bottom: Number(element.getAttribute('y')) + Number(element.getAttribute('height')),
            }
          : null;
      const bands = [...document.querySelectorAll('g.cluster.swimlane')].map((band) => ({
        name: band.querySelector('.cluster-label')?.textContent?.trim() ?? '',
        body: read(
          band.querySelector('rect.pool-body') ?? band.querySelector('rect.swimlane-body')
        ),
        title: read(
          band.querySelector('rect.pool-title') ?? band.querySelector('rect.swimlane-title')
        ),
      }));
      const pool = bands.find((band) => band.name === 'Order handling');
      const lane = bands.find((band) => band.name === 'Sales');
      return pool?.body && lane?.body && lane.title ? { pool, lane } : null;
    });

    expect(nesting).not.toBeNull();
    const { pool, lane } = nesting!;
    // The lane, name band and all, is drawn inside the body of the pool that holds it.
    expect(lane.title!.top).toBeGreaterThanOrEqual(pool.body!.top - 1);
    expect(lane.body!.bottom).toBeLessThanOrEqual(pool.body!.bottom + 1);
    expect(lane.body!.left).toBeGreaterThanOrEqual(pool.body!.left - 1);
    expect(lane.body!.right).toBeLessThanOrEqual(pool.body!.right + 1);
    // And the pool's own name band sits above its body rather than over the lane's.
    expect(pool.title!.bottom).toBeLessThanOrEqual(lane.title!.top + 1);
  });
});
