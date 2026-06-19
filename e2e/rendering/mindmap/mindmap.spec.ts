import { test, expect, type Locator } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

/**
 * Check whether the SVG Element has a Mindmap root.
 *
 * @param svg - The diagram SVG locator to check.
 */
async function shouldHaveRoot(svg: Locator) {
  await expect(svg).toHaveJSProperty('nodeName', 'svg');
  // mindmap should have at least one root section
  expect(await svg.locator('.mindmap-node.section-root').count()).toBeGreaterThanOrEqual(1);
}

test.describe('Mindmaps', () => {
  test('Only a root', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
root
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('a root with a shape', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
root[root]
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('a root with wrapping text and a shape', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
root[A root with a long text that wraps to keep the node size in check]
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('a root with wrapping text and long words that exceed width', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
root[A few smaller words but then averylongsetofcharacterswithoutwhitespacetoseparate that we expect to wrapontonextlinesandnotexceedwidthparameters]
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('a root with an icon', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
root[root]
::icon(mdi mdi-fire)
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('Blang and cloud shape', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
root))bang((
  ::icon(mdi mdi-fire)
  a))Another bang((
  ::icon(mdi mdi-fire)
  a)A cloud(
  ::icon(mdi mdi-fire)
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('Blang and cloud shape with icons', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
root))bang((

  a))Another bang((
  a)A cloud(
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('braches', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
root
  child1
      grandchild 1
      grandchild 2
  child2
      grandchild 3
      grandchild 4
  child3
      grandchild 5
      grandchild 6
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('braches with shapes and labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
root
  child1((Circle))
      grandchild 1
      grandchild 2
  child2(Round rectangle)
      grandchild 3
      grandchild 4
  child3[Square]
      grandchild 5
      ::icon(mdi mdi-fire)
      gc6((grand<br/>child 6))
      ::icon(mdi mdi-fire)
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  test('text should wrap with icon', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
root
  Child3(A node with an icon and with a long text that wraps to keep the node size in check)
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  test('square shape', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
    root[
      The root
    ]`,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  test('rounded rect shape', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
    root((
      The root
    ))`,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  test('circle shape', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
    root(
      The root
    )`,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  test('default shape', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
  The root`,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  test('adding children', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
  The root
    child1
    child2`,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  test('adding grand children', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `mindmap
  The root
    child1
      child2
      child3`,
      {},
      undefined,
      shouldHaveRoot
    );
  });
  test.describe('Markdown strings mindmaps (#4220)', () => {
    test('Formatted label with linebreak and a wrapping label and emojis', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `mindmap
    id1[\`**Start** with
    a second line 😎\`]
      id2[\`The dog in **the** hog... a *very long text* about it Word!\`]`
      );
    });
  });
  test.describe('Include char sequence "graph" in text (#6795)', () => {
    test('has a label with char sequence "graph"', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        ` mindmap
          root
            Photograph
              Waterfall
              Landscape
            Geography
              Mountains
              Rocks`,
        { flowchart: { defaultRenderer: 'elk' } }
      );
    });
  });
  test.describe('Level 2 nodes exceeding 11', () => {
    test('should render all Level 2 nodes correctly when there are more than 11', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `mindmap
root
  Node1
  Node2
  Node3
  Node4
  Node5
  Node6
  Node7
  Node8
  Node9
  Node10
  Node11
  Node12
  Node13
  Node14
  Node15`,
        {},
        undefined,
        shouldHaveRoot
      );
    });
  });
  /* The end */
});
