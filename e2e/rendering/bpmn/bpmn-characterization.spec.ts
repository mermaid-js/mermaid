import { expect, test } from '@playwright/test';
import { diagramSvg, imgSnapshotTest } from '../../helpers/util.ts';

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
});
