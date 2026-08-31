import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';
import { readFileSync, readdirSync } from 'node:fs';

const SWIMLANE_FIXTURE_DIR = 'e2e/platform/dev-diagrams/layout-tests/swimlanes';

// Derived from the filesystem so newly-added layout-test fixtures are swept
// automatically — the dev-explorer generator owns this directory and a hardcoded
// list would silently drift out of date.
const SWIMLANE_FIXTURES = readdirSync(SWIMLANE_FIXTURE_DIR)
  .filter((file) => file.endsWith('.mmd'))
  .sort();

// A representative subset additionally rendered in handdrawn/rough mode. Swimlanes
// inherits rough rendering from the flowchart node shapes and the shared cluster
// renderer (both branch on `look === 'handDrawn'`); these snapshots exercise that
// path. Kept small to limit snapshot churn — a decision diamond, edge labels, and
// a wide multi-lane top-to-bottom diagram.
const HANDDRAWN_FIXTURES = [
  '4-car-fun-sales-tb.mmd',
  '9-edge-labels.mmd',
  'intake-review-complete.mmd',
];

const shapeSelector = 'rect, polygon, ellipse, circle, path';
// The shared layout renderer emits the edge group as `g.edges.edgePaths`
// (see createLayoutElementGroups). Edge paths themselves carry
// `edge-thickness-* edge-pattern-* flowchart-link`, not a `.path` class.
const edgePathSelector = 'g.edgePaths path';

const asStandaloneSwimlanes = (source: string): string => {
  // Every swimlanes layout-test fixture declares the standalone `swimlanes`
  // diagram type directly, so it is rendered as-is. This guard keeps that
  // invariant — a fixture authored as flowchart/graph would fail here.
  expect(source, 'fixture should declare the standalone swimlane diagram type').toMatch(
    /^\s*swimlane-beta\s/m
  );
  return source;
};

// Swimlanes fixtures render with SVG labels (htmlLabels:false) for stable
// cross-browser text, and natural width so the whole diagram is captured.
const swimlanesFlowchartConfig = { htmlLabels: false, useMaxWidth: false } as const;

// Capture an Argos visual-regression snapshot of a swimlanes diagram. Named
// after the enclosing test. Used for the fixture sweep so the suite can catch
// rendering regressions, not just structural ones.
const snapshotSwimlanes = async (
  page: Page,
  testInfo: TestInfo,
  graph: string,
  options: Parameters<typeof imgSnapshotTest>[3] = {}
): Promise<void> => {
  const { flowchart, ...rest } = options;
  await imgSnapshotTest(page, testInfo, graph, {
    logLevel: 0,
    ...rest,
    flowchart: {
      ...swimlanesFlowchartConfig,
      ...flowchart,
    },
  });
};

// Render without a screenshot — used by the behaviour tests below that assert on
// the DOM/CSS rather than the rendered pixels.
const renderSwimlanes = async (
  page: Page,
  testInfo: TestInfo,
  graph: string,
  name: string,
  options: Parameters<typeof renderGraph>[3] = {}
): Promise<void> => {
  const { flowchart, ...rest } = options;
  await renderGraph(page, testInfo, graph, {
    screenshot: false,
    logLevel: 0,
    name,
    ...rest,
    flowchart: {
      ...swimlanesFlowchartConfig,
      ...flowchart,
    },
  });
};

const assertStandaloneSwimlanesRendered = async (page: Page): Promise<void> => {
  await expect(page.locator('svg')).toHaveAttribute('aria-roledescription', 'swimlane');
  await expect(page.locator('svg .error-icon')).toHaveCount(0);
  await expect(page.locator('g.cluster.swimlane')).not.toHaveCount(0);
  // Nodes are `g.node` in the classic look and `g.rough-node` in handdrawn/rough.
  await expect(page.locator('g.node, g.rough-node')).not.toHaveCount(0);
};

const nodeShape = (page: Page, label: string) => {
  return page.locator('g.node').filter({ hasText: label }).locator(shapeSelector).first();
};

test.describe('Swimlanes diagram', () => {
  test('covers every swimlanes layout-test fixture', () => {
    expect(SWIMLANE_FIXTURES.length, 'generated swimlane fixture inventory').toBeGreaterThan(0);
  });

  SWIMLANE_FIXTURES.forEach((fixture) => {
    test(`renders ${fixture} as a standalone swimlanes diagram`, async ({ page }, testInfo) => {
      const source = readFileSync(`${SWIMLANE_FIXTURE_DIR}/${fixture}`, 'utf8');
      await snapshotSwimlanes(page, testInfo, asStandaloneSwimlanes(source));
      await assertStandaloneSwimlanesRendered(page);
    });
  });

  test.describe('handdrawn (rough) look', () => {
    HANDDRAWN_FIXTURES.forEach((fixture) => {
      test(`renders ${fixture} in handdrawn look`, async ({ page }, testInfo) => {
        const source = readFileSync(`${SWIMLANE_FIXTURE_DIR}/${fixture}`, 'utf8');
        await snapshotSwimlanes(page, testInfo, asStandaloneSwimlanes(source), {
          look: 'handDrawn',
        });
        await assertStandaloneSwimlanesRendered(page);
      });
    });
  });

  test('defaults to the swimlanes layout without an explicit layout config', async ({
    page,
  }, testInfo) => {
    await renderSwimlanes(
      page,
      testInfo,
      `swimlane-beta LR
        subgraph Intake
          A[Request]
        end
        subgraph Delivery
          B[Build]
        end
        A --> B
      `,
      'swimlanes-default-layout'
    );

    await assertStandaloneSwimlanesRendered(page);
    await expect(page.locator('g.cluster.swimlane')).toHaveCount(2);
  });

  test('applies custom theme variables', async ({ page }, testInfo) => {
    await renderSwimlanes(
      page,
      testInfo,
      `swimlane-beta LR
        subgraph ThemeLane
          A[Themed node]
          B[Next node]
        end
        A --> B
      `,
      'swimlanes-custom-theme',
      {
        theme: 'base',
        themeVariables: {
          mainBkg: '#ffe1ef',
          nodeBorder: '#225577',
          lineColor: '#118844',
        },
      }
    );

    await assertStandaloneSwimlanesRendered(page);
    const shape = nodeShape(page, 'Themed node');
    await expect(shape).toHaveCSS('fill', 'rgb(255, 225, 239)');
    await expect(shape).toHaveCSS('stroke', 'rgb(34, 85, 119)');
    const path = page.locator(edgePathSelector).first();
    await expect(path).toHaveCSS('stroke', 'rgb(17, 136, 68)');
  });

  test('applies flowchart style and linkStyle statements', async ({ page }, testInfo) => {
    await renderSwimlanes(
      page,
      testInfo,
      `swimlane-beta LR
        subgraph StyledLane
          A[Styled node]
          B[Linked node]
        end
        A --> B
        style A fill:#ff99cc,stroke:#003366,stroke-width:5px,color:#111111
        linkStyle 0 stroke:#ff6600,stroke-width:5px
      `,
      'swimlanes-style-statements'
    );

    await assertStandaloneSwimlanesRendered(page);
    const shape = nodeShape(page, 'Styled node');
    await expect(shape).toHaveCSS('fill', 'rgb(255, 153, 204)');
    await expect(shape).toHaveCSS('stroke', 'rgb(0, 51, 102)');
    await expect(shape).toHaveCSS('stroke-width', '5px');
    const path = page.locator(edgePathSelector).first();
    await expect(path).toHaveCSS('stroke', 'rgb(255, 102, 0)');
    await expect(path).toHaveCSS('stroke-width', '5px');
  });

  test('applies classDef and class statements', async ({ page }, testInfo) => {
    await renderSwimlanes(
      page,
      testInfo,
      `swimlane-beta LR
        subgraph ClassLane
          A[Classed node]
          B[Default node]
        end
        A --> B
        classDef highlighted fill:#bbf,stroke:#f66,stroke-width:4px,color:#000000
        class A highlighted
      `,
      'swimlanes-classdef'
    );

    await assertStandaloneSwimlanesRendered(page);
    await expect(
      page.locator('g.node.highlighted').filter({ hasText: 'Classed node' })
    ).toHaveCount(1);
    const shape = nodeShape(page, 'Classed node');
    await expect(shape).toHaveCSS('fill', 'rgb(187, 187, 255)');
    await expect(shape).toHaveCSS('stroke', 'rgb(255, 102, 102)');
    await expect(shape).toHaveCSS('stroke-width', '4px');
  });

  /**
   * Lanes take a per-lane colour under the redux colour themes. The unit tests pin the
   * generated CSS and the slot each lane is handed; only a render proves the stamped
   * `data-color-id` actually meets the emitted selector on the element, which is the half
   * that fails silently -- a mismatch leaves every lane the uncoloured grey.
   *
   * Asserted as "distinct and self-consistent" rather than against hex values, so the
   * assertions keep holding when the palettes are retuned. The exact colours are pinned
   * in `swimlanes/lanePalette.spec.ts`.
   */
  test.describe('redux colour theme lanes', () => {
    const fiveLanes = `swimlane-beta TD
        subgraph Intake
          A[Request]
        end
        subgraph Review
          B[Check]
        end
        subgraph Build
          C[Assemble]
        end
        subgraph Ship
          D[Deliver]
        end
        subgraph Support
          E[Follow up]
        end
        A --> B --> C --> D --> E
      `;

    const laneStrokes = (page: Page, half: 'title' | 'body') =>
      page
        .locator(`g.cluster.swimlane rect.swimlane-${half}`)
        .evaluateAll((rects) => rects.map((rect) => getComputedStyle(rect).stroke));

    for (const theme of ['redux-color', 'redux-dark-color'] as const) {
      test(`gives every lane its own colour under ${theme}`, async ({ page }, testInfo) => {
        await renderSwimlanes(page, testInfo, fiveLanes, `swimlanes-${theme}-lanes`, { theme });

        await assertStandaloneSwimlanesRendered(page);

        const slots = await page
          .locator('g.cluster.swimlane')
          .evaluateAll((lanes) => lanes.map((lane) => lane.getAttribute('data-color-id')));
        expect(slots).toHaveLength(5);
        expect(slots.filter(Boolean)).toHaveLength(5);
        expect(new Set(slots).size).toBe(5);

        // Title band and body of one lane are the same colour; across lanes they differ.
        const titles = await laneStrokes(page, 'title');
        const bodies = await laneStrokes(page, 'body');
        expect(titles).toEqual(bodies);
        expect(new Set(titles).size).toBe(5);
        // `none` would mean the palette rule never landed and nothing else painted it.
        expect(titles.filter((stroke) => stroke === 'none')).toEqual([]);
      });
    }

    test('paints the lane body fill only where the theme ships one', async ({ page }, testInfo) => {
      await renderSwimlanes(page, testInfo, fiveLanes, 'swimlanes-lane-fill', {
        theme: 'redux-color',
      });

      const fills = await page
        .locator('g.cluster.swimlane rect.swimlane-body')
        .evaluateAll((rects) => rects.map((rect) => getComputedStyle(rect).fill));
      expect(new Set(fills).size).toBe(5);
    });

    test('keeps an explicit lane style ahead of the palette', async ({ page }, testInfo) => {
      await renderSwimlanes(
        page,
        testInfo,
        `swimlane-beta TD
          subgraph Palette
            A[Slot colour]
          end
          subgraph Styled
            B[Own colour]
          end
          A --> B
          style Styled fill:#00ff00,stroke:#0000ff
        `,
        'swimlanes-lane-user-style',
        { theme: 'redux-color' }
      );

      const styled = page.locator('g.cluster.swimlane[data-id="Styled"] rect.swimlane-body');
      await expect(styled).toHaveCSS('stroke', 'rgb(0, 0, 255)');
      await expect(styled).toHaveCSS('fill', 'rgb(0, 255, 0)');
    });

    /**
     * The default lane is synthesised by the layout rather than declared, so it is the one
     * lane nothing upstream gives a `look` or a colour slot to. Without them it renders as
     * a classic rect inside a handDrawn diagram and reuses the first lane's colour.
     */
    test('colours the synthetic default lane distinctly', async ({ page }, testInfo) => {
      await renderSwimlanes(
        page,
        testInfo,
        `swimlane-beta TD
          subgraph OwnedLane
            A[Owned node]
          end
          Loose[Loose node] --> A
        `,
        'swimlanes-default-lane-colour',
        { theme: 'redux-color' }
      );

      const slots = await page
        .locator('g.cluster.swimlane')
        .evaluateAll((lanes) => lanes.map((lane) => lane.getAttribute('data-color-id')));
      expect(slots).toHaveLength(2);
      expect(new Set(slots).size).toBe(2);
      expect(slots.filter(Boolean)).toHaveLength(2);
    });

    test('draws the synthetic default lane in the diagram look', async ({ page }, testInfo) => {
      await renderSwimlanes(
        page,
        testInfo,
        `swimlane-beta TD
          subgraph OwnedLane
            A[Owned node]
          end
          Loose[Loose node] --> A
        `,
        'swimlanes-default-lane-handdrawn',
        { theme: 'redux-color', look: 'handDrawn' }
      );

      const defaultLane = page.locator('g.cluster.swimlane[data-id="__swimlane_default__"]');
      await expect(defaultLane).toHaveAttribute('data-look', 'handDrawn');
      // roughjs draws paths; a `rect` here means the classic branch ran instead.
      await expect(defaultLane.locator('rect.swimlane-body')).toHaveCount(0);
      await expect(defaultLane.locator('.swimlane-body path')).not.toHaveCount(0);
    });

    for (const theme of ['redux-color', 'redux-dark-color'] as const) {
      test(`renders coloured lanes under ${theme}`, async ({ page }, testInfo) => {
        await snapshotSwimlanes(page, testInfo, fiveLanes, { theme });
      });

      test(`renders coloured handdrawn lanes under ${theme}`, async ({ page }, testInfo) => {
        await snapshotSwimlanes(page, testInfo, fiveLanes, { theme, look: 'handDrawn' });
      });
    }
  });

  test('puts nodes without an explicit subgraph into a default swimlane', async ({
    page,
  }, testInfo) => {
    await renderSwimlanes(
      page,
      testInfo,
      `swimlane-beta LR
        subgraph OwnedLane
          A[Owned node]
        end
        Loose[Loose node] --> A
      `,
      'swimlanes-default-lane'
    );

    await assertStandaloneSwimlanesRendered(page);
    await expect(page.locator('g.cluster.swimlane[data-id="__swimlane_default__"]')).toHaveCount(1);
    await expect(page.locator('g.node').filter({ hasText: 'Loose node' })).toHaveCount(1);
  });
});
