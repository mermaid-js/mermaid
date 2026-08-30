import { expect, test } from '@playwright/test';
import { diagramSvg, imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('bpmn-beta characterization', () => {
  test('CHAR.event-position-trigger should draw a combination the notation forbids', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `bpmn-beta LR
title Illegal position and trigger pairs (not rejected by the current parser)
  lane "Orders"
    start terminate s "Terminate on a start event"
    intermediate cancel i "Cancel on an intermediate event"
    end e "Done"
  s --> i
  i --> e
      `
    );

    const svg = diagramSvg(page);
    // BPMN 2.0.2 Table 10.93 allows terminate only on an end event and cancel only on a
    // boundary or end event. Both are drawn anyway: a start ring, an intermediate double
    // ring and an end ring make four, each carrying the trigger it was given.
    await expect(svg.locator('circle.bpmn-event-ring')).toHaveCount(4);
    await expect(svg.locator('.bpmn-glyph')).toHaveCount(2);
  });

  test('CHAR.message-flow-between-pools should join two participants with no content', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `bpmn-beta LR
title A message flow between two black box participants
  pool buyer "Buyer"
  pool seller "Seller"
  buyer -.-> seller
      `
    );

    const svg = diagramSvg(page);
    await expect(svg.locator('g.cluster.swimlane')).toHaveCount(2);
    await expect(svg.locator('g.node')).toHaveCount(0);
    const flow = svg.locator('g.edgePaths path.bpmn-flow-message');
    await expect(flow).toHaveCount(1);
    // Dashed, with a hollow ring where it leaves and an open head where it arrives.
    await expect(flow).toHaveClass(/edge-pattern-dashed/);
    await expect(flow).toHaveAttribute('marker-start', /hollowCircle/);
    await expect(flow).toHaveAttribute('marker-end', /openArrow/);
  });

  test('CHAR.association-direction should give a head only to the pointing one', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `bpmn-beta LR
title Directed and undirected associations
  lane "Sales"
    user task t "Check the order"
    data d "Order form"
    note n "Against the price list"
  d ..> t
  n ... t
      `
    );

    const associations = diagramSvg(page).locator('g.edgePaths path.bpmn-flow-association');
    await expect(associations).toHaveCount(2);
    await expect(associations.first()).toHaveClass(/edge-pattern-dotted/);
    await expect(associations.last()).toHaveClass(/edge-pattern-dotted/);
    await expect(associations.first()).toHaveAttribute('marker-end', /openArrow/);
    await expect(associations.last()).not.toHaveAttribute('marker-end', /openArrow/);
  });

  test('CHAR.data-object-markers should mark what an activity reads and writes', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `bpmn-beta LR
title Data object markers
  lane "Sales"
    data plain "Plain"
    data-input in1 "Order form"
    data-output out1 "Approval"
    data-collection many "Line items"
    user task t "Check the order"
  in1 ..> t
  t ..> out1
  many ..> t
      `
    );

    const svg = diagramSvg(page);
    await expect(svg.locator('.bpmn-data-page')).toHaveCount(4);
    // The plain one carries no corner marker; the collection is marked along its foot.
    await expect(svg.locator('.bpmn-data-arrow-input')).toHaveCount(1);
    await expect(svg.locator('.bpmn-data-arrow-output')).toHaveCount(1);
    await expect(svg.locator('.bpmn-data-collection')).toHaveCount(1);
  });

  for (const rankSpacing of [20, 90]) {
    test(`CHAR.rank-spacing should set the steps ${rankSpacing} apart`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `---
config:
  bpmn:
    rankSpacing: ${rankSpacing}
---
bpmn-beta LR
title Rank spacing ${rankSpacing}
  lane "Orders"
    start s "Received"
    user task t1 "Check"
    service task t2 "Charge"
    end e "Filed"
  s --> t1 --> t2 --> e
        `
      );
    });
  }

  for (const direction of ['LR', 'TB']) {
    test(`CHAR.direction should run the process ${direction}`, async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `bpmn-beta ${direction}
title Direction ${direction}
  pool "Order handling"
    lane "Sales"
      start s "Received"
      xor g "Approved?"
      user task t1 "Ship"
      user task t2 "Refund"
      end e "Closed"
  s --> g
  g --> t1
  g --> t2
  t1 --> e
  t2 --> e
        `
      );
    });
  }

  test('CHAR.activity-markers should draw no marker the notation puts under an activity', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `bpmn-beta LR
title Activity markers (no syntax for them yet)
  lane "Fulfilment"
    subprocess sp "Pick and pack"
    user task t "Check the order"
    call ca "Run the credit check"
      `
    );

    const svg = diagramSvg(page);
    // BPMN puts a loop, a multi-instance, a compensation or an ad-hoc marker along the
    // foot of an activity. None can be asked for, so none is drawn.
    await expect(svg.locator('.bpmn-marker')).toHaveCount(0);
    // What an activity does draw is the icon for its own kind, in its top left.
    await expect(svg.locator('.bpmn-activity-icon')).toHaveCount(2);
    // A call activity is marked by a thick border instead of an icon.
    await expect(svg.locator('g.node.bpmn-call')).toHaveCount(1);
  });

  test('CHAR.catch-and-throw should fill the marker only where the event throws', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `bpmn-beta LR
title Catching and throwing the same trigger
  lane "Orders"
    intermediate message c "Waits for a message"
    throw message t "Sends a message"
  c --> t
      `
    );

    const svg = diagramSvg(page);
    // Both are intermediate events, so both are drawn as a double ring: four in all.
    await expect(svg.locator('circle.bpmn-event-ring')).toHaveCount(4);
    await expect(svg.locator('.bpmn-glyph')).toHaveCount(2);
    // Only the throwing one is filled, which is the whole difference between them.
    await expect(svg.locator('g.node.bpmn-throw')).toHaveCount(1);
  });

  test('CHAR.boundary-event should sit on the border of the activity it interrupts', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `bpmn-beta LR
title A boundary event on an activity
  lane "Orders"
    user task t "Wait for approval"
      boundary timer b "24 hours"
    end e "Filed"
  t --> e
      `
    );

    const onTheBorder = await page.evaluate(() => {
      const host = document.querySelector('g.node[id$="-t"]');
      const event = document.querySelector('g.node[id$="-b"]');
      const at = (node: Element | null) =>
        /translate\(\s*([\d.-]+)[ ,]+([\d.-]+)/.exec(node?.getAttribute('transform') ?? '');
      const hostAt = at(host);
      const eventAt = at(event);
      const box = host?.querySelector('rect.bpmn-activity-rect');
      if (!hostAt || !eventAt || !box) {
        return null;
      }
      const halfWidth = Number(box.getAttribute('width')) / 2;
      const halfHeight = Number(box.getAttribute('height')) / 2;
      const dx = Math.abs(Number(eventAt[1]) - Number(hostAt[1]));
      const dy = Math.abs(Number(eventAt[2]) - Number(hostAt[2]));
      // On the border means exactly one axis is at the half-extent, not inside or beyond.
      return Math.min(Math.abs(dx - halfWidth), Math.abs(dy - halfHeight));
    });

    expect(onTheBorder).not.toBeNull();
    expect(onTheBorder!).toBeLessThan(2);
    // Interrupting, so it is drawn as a double ring; the end event adds a third.
    await expect(diagramSvg(page).locator('circle.bpmn-event-ring')).toHaveCount(3);
  });

  test('CHAR.group should draw one box, held inside a single lane', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `bpmn-beta LR
title A group inside a lane (a group cannot yet span pools)
  lane "Fulfilment"
    start s "Begin"
    group "Warehouse work"
      user task t1 "Pick items"
      user task t2 "Pack"
    end e "Done"
  s --> t1 --> t2 --> e
      `
    );

    const svg = diagramSvg(page);
    await expect(svg.locator('g.bpmn-group rect.outer')).toHaveCount(1);
    // The cluster shape it borrows draws a second rect to divide a title band from a
    // body. A group has no such division, so that rect is there but left without a stroke.
    const innerStroke = await page.evaluate(() => {
      const inner = document.querySelector('g.bpmn-group rect.inner');
      return inner ? getComputedStyle(inner).stroke : null;
    });
    expect(innerStroke).toBe('none');

    const heldInside = await page.evaluate(() => {
      const group = document.querySelector('g.bpmn-group rect.outer');
      const lane = document.querySelector('g.cluster.swimlane rect.swimlane-body');
      if (!group || !lane) {
        return null;
      }
      const read = (element: Element) => ({
        left: Number(element.getAttribute('x')),
        top: Number(element.getAttribute('y')),
        right: Number(element.getAttribute('x')) + Number(element.getAttribute('width')),
        bottom: Number(element.getAttribute('y')) + Number(element.getAttribute('height')),
      });
      const g = read(group);
      const l = read(lane);
      return (
        g.left >= l.left - 1 &&
        g.right <= l.right + 1 &&
        g.top >= l.top - 1 &&
        g.bottom <= l.bottom + 1
      );
    });
    expect(heldInside).toBe(true);
  });

  test('CHAR.labelled-flow should write the label on the line', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `bpmn-beta LR
title A labelled sequence flow
  lane "Orders"
    xor g "Approved?"
    user task ship "Ship the order"
    user task refund "Refund the order"
  g -- yes --> ship
  g -- no --> refund
      `
    );

    const labels = diagramSvg(page).locator('.edgeLabel');
    await expect(labels).toHaveCount(2);
    await expect(diagramSvg(page)).toContainText('yes');
    await expect(diagramSvg(page)).toContainText('no');
  });

  for (const [name, frontmatter] of [
    ['default', ''],
    [
      'retuned',
      `---
config:
  themeVariables:
    bpmn:
      activityFill: "#ffe8cc"
      activityStroke: "#d9480f"
---
`,
    ],
  ] as const) {
    test(`CHAR.theme should draw an activity in its ${name} colours`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `${frontmatter}bpmn-beta LR
title Activity colours, ${name}
  lane "Orders"
    start s "Received"
    user task t "Check the order"
    end e "Filed"
  s --> t --> e
        `
      );

      const painted = await page.evaluate(() => {
        const rect = document.querySelector('rect.bpmn-activity-rect');
        const style = rect ? getComputedStyle(rect) : null;
        return style ? { fill: style.fill, stroke: style.stroke } : null;
      });
      expect(painted).not.toBeNull();
      // The retuned pair is the one the frontmatter asked for; the default pair is
      // whatever the theme supplies, and the two must not be the same.
      expect(painted!.fill).toBe(name === 'retuned' ? 'rgb(255, 232, 204)' : 'rgb(234, 242, 251)');
      expect(painted!.stroke).toBe(name === 'retuned' ? 'rgb(217, 72, 15)' : 'rgb(62, 111, 168)');
    });
  }

  test('CHAR.accessibility-text should reach the shapes a reader announces', async ({
    page,
  }, testInfo) => {
    // No snapshot: what is being recorded is text in the DOM, which an image cannot show.
    await renderGraph(
      page,
      testInfo,
      `bpmn-beta LR
accTitle: How an order is handled
accDescr: An order is received, checked by sales and then filed.
  lane "Sales"
    start s "Order received"
    user task t "Check the order"
    end e "Filed"
  s --> t --> e
      `,
      { screenshot: false }
    );

    const svg = diagramSvg(page);
    await expect(svg.locator('title')).toHaveText('How an order is handled');
    await expect(svg.locator('desc')).toHaveText(
      'An order is received, checked by sales and then filed.'
    );
    await expect(svg).toHaveAttribute('aria-labelledby', /chart-title/);
  });
});
