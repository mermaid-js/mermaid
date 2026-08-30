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
});
