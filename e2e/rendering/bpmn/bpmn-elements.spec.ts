import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';
import { EVENT_TRIGGERS, TASK_TYPES } from '../../../packages/mermaid/src/diagrams/bpmn/types.js';

/**
 * The element set of the OMG Analytic conformance sub-class, one case per element.
 *
 * The trigger and task lists are the grammar's own, so an element added there is covered
 * here without this file being edited. What each one is expected to draw is written out
 * below: a ring count and the classes that carry the element's position and whether it
 * throws, which is what tells one event from another once the glyph is stripped away.
 */

interface Position {
  keyword: string;
  rings: number;
  marks: string;
  throws: boolean;
}

const POSITIONS: Position[] = [
  { keyword: 'start', rings: 1, marks: 'bpmn-event-start', throws: false },
  { keyword: 'intermediate', rings: 2, marks: 'bpmn-event-intermediate', throws: false },
  { keyword: 'throw', rings: 2, marks: 'bpmn-event-intermediate', throws: true },
  { keyword: 'boundary', rings: 2, marks: 'bpmn-event-boundary', throws: false },
  { keyword: 'end', rings: 1, marks: 'bpmn-event-end', throws: true },
];

/** A trigger drawn as a mark inside the ring. `none` is the empty one, and draws no mark. */
const MARKED_TRIGGERS = EVENT_TRIGGERS.filter((trigger) => trigger !== 'none');

interface Drawn {
  rings: number;
  glyphs: number;
  icons: number;
  stroke: number;
  classes: string[];
}

const drawnById = async (page: Page): Promise<Record<string, Drawn>> =>
  page.evaluate(() => {
    const out: Record<
      string,
      { rings: number; glyphs: number; icons: number; stroke: number; classes: string[] }
    > = {};
    // A node's DOM id is the diagram's own id and then the id the source declared.
    const svgId = document.querySelector('svg[aria-roledescription]')?.getAttribute('id') ?? '';
    for (const node of document.querySelectorAll('g.node')) {
      const raw = node.getAttribute('id') ?? '';
      const id = raw.startsWith(`${svgId}-`) ? raw.slice(svgId.length + 1) : raw;
      out[id] = {
        rings: node.querySelectorAll('circle.bpmn-event-ring').length,
        glyphs: node.querySelectorAll('.bpmn-glyph').length,
        icons: node.querySelectorAll('.bpmn-activity-icon').length,
        stroke: Number.parseFloat(
          getComputedStyle(node.querySelector('rect.bpmn-activity-rect') ?? node).strokeWidth
        ),
        classes: [...new Set((node.getAttribute('class') ?? '').split(/\s+/).filter(Boolean))],
      };
    }
    return out;
  });

/** One event per trigger, at the given position. A boundary event is given a host to sit on. */
const eventsAt = (position: string): string => {
  const body = EVENT_TRIGGERS.map((trigger, index) =>
    position === 'boundary'
      ? `    task h${index} "Host ${index}"\n      boundary ${trigger} e${index} "${trigger}"`
      : `    ${position} ${trigger} e${index} "${trigger}"`
  ).join('\n');
  return `bpmn-beta LR\n  lane "Events"\n${body}\n`;
};

test.describe('bpmn-beta elements', () => {
  for (const position of POSITIONS) {
    test(`ELEM.event-${position.keyword} draws every trigger at this position`, async ({
      page,
    }, testInfo) => {
      await renderGraph(page, testInfo, eventsAt(position.keyword), { screenshot: false });
      const drawn = await drawnById(page);

      for (const [index, trigger] of EVENT_TRIGGERS.entries()) {
        const event = drawn[`e${index}`];
        expect(event, `${position.keyword} ${trigger} should be drawn`).toBeDefined();
        expect(event.rings, `${position.keyword} ${trigger} ring count`).toBe(position.rings);
        expect(event.classes, `${position.keyword} ${trigger} position`).toContain(position.marks);
        // A throwing event is drawn with its mark filled, which the class carries.
        expect(event.classes.includes('bpmn-throw'), `${position.keyword} ${trigger} throws`).toBe(
          position.throws
        );
        // Every trigger but `none` puts a mark inside the ring.
        expect(event.glyphs > 0, `${position.keyword} ${trigger} mark`).toBe(trigger !== 'none');
      }
      expect(Object.keys(drawn).filter((id) => /^e\d+$/.test(id))).toHaveLength(
        EVENT_TRIGGERS.length
      );
    });
  }

  test('ELEM.task draws every task type with its own mark', async ({ page }, testInfo) => {
    const body = TASK_TYPES.map((type, index) => `    ${type} task t${index} "${type}"`).join('\n');
    await renderGraph(page, testInfo, `bpmn-beta LR\n  lane "Tasks"\n${body}\n`, {
      screenshot: false,
    });
    const drawn = await drawnById(page);
    for (const [index, type] of TASK_TYPES.entries()) {
      const task = drawn[`t${index}`];
      expect(task, `${type} task should be drawn`).toBeDefined();
      expect(task.rings, `${type} task is not an event`).toBe(0);
      expect(task.icons, `${type} task mark`).toBe(1);
    }
  });

  test('ELEM.activity draws the containers a process is built from', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `bpmn-beta LR
  lane "Activities"
    task plain "Plain"
    subprocess sub "Sub-process"
    call called "Call activity"
`,
      { screenshot: false }
    );
    const drawn = await drawnById(page);
    for (const id of ['plain', 'sub', 'called']) {
      expect(drawn[id], `${id} should be drawn`).toBeDefined();
      expect(drawn[id].rings, `${id} is not an event`).toBe(0);
    }
    // A plain task carries no mark. A sub-process is marked with one; a call activity is
    // not, and is told apart by a thicker border, which is what the notation draws.
    expect(drawn.plain.icons).toBe(0);
    expect(drawn.sub.icons).toBe(1);
    expect(drawn.called.icons).toBe(0);
    expect(drawn.called.stroke).toBeGreaterThan(drawn.plain.stroke);
  });

  test('ELEM.gateway draws each kind with its own mark', async ({ page }, testInfo) => {
    const KINDS = ['xor', 'and', 'or', 'event-gateway', 'complex'];
    const body = KINDS.map((kind, index) => `    ${kind} g${index} "${kind}"`).join('\n');
    await renderGraph(page, testInfo, `bpmn-beta LR\n  lane "Gateways"\n${body}\n`, {
      screenshot: false,
    });
    const drawn = await drawnById(page);
    const diamonds = await page.locator('polygon.bpmn-gateway-diamond').count();
    expect(diamonds).toBe(KINDS.length);
    for (const [index, kind] of KINDS.entries()) {
      expect(drawn[`g${index}`], `${kind} should be drawn`).toBeDefined();
      expect(drawn[`g${index}`].glyphs, `${kind} mark`).toBeGreaterThan(0);
    }
  });

  test('ELEM.artifact draws the things a process refers to but does not do', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `bpmn-beta LR
  lane "Artifacts"
    data d "Order form"
    data-store s "Ledger"
    note n "Checked nightly"
`,
      { screenshot: false }
    );
    await expect(page.locator('.bpmn-data-page')).toHaveCount(1);
    // A data store is drawn as a cylinder: a body and the three rings across its top.
    await expect(page.locator('.bpmn-store-rings')).toHaveCount(3);
    await expect(page.locator('.bpmn-annotation-bracket')).toHaveCount(1);
  });

  test('ELEM.flow draws each kind of connection with its own line', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `bpmn-beta LR
  pool p1 "Buyer"
    lane "Buying"
      task a "Order"
      note n "Why"
  pool p2 "Seller"
    lane "Selling"
      task b "Fulfil"
  a --> b
  a -.-> b
  n ... a
`,
      { screenshot: false }
    );
    await expect(page.locator('path.bpmn-flow-sequence')).toHaveCount(1);
    await expect(page.locator('path.bpmn-flow-message')).toHaveCount(1);
    await expect(page.locator('path.bpmn-flow-association')).toHaveCount(1);
    await expect(page.locator('path.bpmn-flow-message')).toHaveClass(/edge-pattern-dashed/);
    await expect(page.locator('path.bpmn-flow-association')).toHaveClass(/edge-pattern-dotted/);
  });

  test('ELEM.trigger-position-legality is not enforced (every pair is accepted)', async ({
    page,
  }, testInfo) => {
    // BPMN 2.0.2 allows a trigger only at certain positions: terminate ends a process,
    // link is an intermediate hop, and cancel belongs to a transaction's boundary or end.
    // None of that is checked, so each of these draws an ordinary event of its position.
    // Enforcing it must fail this test, which is where the title gets corrected.
    await renderGraph(
      page,
      testInfo,
      `bpmn-beta LR
  lane "Rejected by the specification"
    start terminate a "terminate cannot start"
    end link b "link cannot end"
    start cancel c "cancel needs a transaction"
`,
      { screenshot: false }
    );
    const drawn = await drawnById(page);
    expect(drawn.a.classes).toContain('bpmn-event-start');
    expect(drawn.b.classes).toContain('bpmn-event-end');
    expect(drawn.c.classes).toContain('bpmn-event-start');
    for (const id of ['a', 'b', 'c']) {
      expect(drawn[id].glyphs, `${id} is drawn with its mark`).toBeGreaterThan(0);
    }
  });

  test('ELEM.trigger-coverage exercises every trigger the grammar accepts', () => {
    // Guards the matrix itself: a trigger added to the grammar is covered above only
    // because these lists are the grammar's own.
    expect(MARKED_TRIGGERS.length).toBe(EVENT_TRIGGERS.length - 1);
    expect(EVENT_TRIGGERS).toContain('none');
    expect(POSITIONS.map((position) => position.keyword)).toEqual([
      'start',
      'intermediate',
      'throw',
      'boundary',
      'end',
    ]);
  });
});
