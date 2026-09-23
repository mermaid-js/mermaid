import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { diagramSvg, renderGraph } from '../../helpers/util.ts';

const assertFiniteViewBox = async (page: Parameters<typeof diagramSvg>[0]) => {
  const svg = diagramSvg(page).first();
  const viewBox = (await svg.getAttribute('viewBox')) ?? '';
  const numbers = viewBox.split(/\s+/).map((value) => Number(value));
  expect(numbers).toHaveLength(4);
  for (const value of numbers) {
    expect(Number.isFinite(value)).toBe(true);
  }
  expect(numbers[2]).toBeGreaterThan(0);
  expect(numbers[3]).toBeGreaterThan(0);
};

const assertFiniteEdgePaths = async (page: Parameters<typeof diagramSvg>[0]) => {
  const pathData = await page
    .locator('svg .edgePaths path')
    .evaluateAll((paths) => paths.map((path) => path.getAttribute('d') ?? ''));
  expect(pathData.length).toBeGreaterThan(0);
  for (const d of pathData) {
    expect(d.length).toBeGreaterThan(0);
    expect(d.includes('NaN')).toBe(false);
    expect(d.includes('undefined')).toBe(false);
  }
};

test.describe('grid layout rendering', () => {
  test('flowchart grid keeps accessibility text, links, callbacks, and inline placement ordering', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `---
config:
  layout: grid
  grid:
    rowGap: 32
    columnGap: 40
---
flowchart TB
  accTitle: Grid flowchart
  accDescr: Flowchart rendered with the built-in grid layout.
  A["Start"]@{ row: 1, column: 1 }
  B["Review"]@{ row: 2, column: 1 }
  C["Docs"]@{ row: 2, column: 2 }
  D["Callback"]@{ row: 3, column: 1 }
  click C href "https://example.com" "Open docs"
  click D call gridCallback() "Run callback"
  A --> B
  B --> C
  B --> D`,
      { securityLevel: 'loose', screenshot: false }
    );

    const svg = diagramSvg(page).first();
    await expect(svg).toHaveAttribute('aria-roledescription', /flowchart/);
    await assertFiniteViewBox(page);
    await assertFiniteEdgePaths(page);
    await expect(page.locator('svg title')).toContainText('Grid flowchart');
    await expect(page.locator('svg desc')).toContainText(
      'Flowchart rendered with the built-in grid layout.'
    );
    await expect(page.locator('svg a')).toHaveCount(1);

    await page.evaluate(() => {
      const target = window as Window & {
        gridCallback?: (...args: unknown[]) => void;
        gridCallbackCalls?: unknown[][];
      };
      target.gridCallbackCalls = [];
      target.gridCallback = (...args: unknown[]) => {
        target.gridCallbackCalls?.push(args);
      };
    });
    const callbackNode = page.locator('svg g.node').filter({ hasText: 'Callback' }).first();
    await expect(callbackNode).toHaveClass(/clickable/);
    await callbackNode.click();
    await page.waitForFunction(
      () =>
        ((window as Window & { gridCallbackCalls?: unknown[][] }).gridCallbackCalls?.length ??
          0) === 1
    );
    const callbackCalls = await page.evaluate(
      () => (window as Window & { gridCallbackCalls?: unknown[][] }).gridCallbackCalls ?? []
    );
    expect(callbackCalls).toEqual([['D']]);

    const transforms = await page.locator('svg .node').evaluateAll((nodes) =>
      nodes
        .map((node) => ({
          text: node.textContent ?? '',
          transform: node.getAttribute('transform') ?? '',
        }))
        .filter((entry) => entry.text.includes('Start') || entry.text.includes('Review'))
    );

    const parseTranslate = (value: string) => {
      const match = /translate\(([\d.-]+),\s*([\d.-]+)\)/.exec(value);
      return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 0, y: 0 };
    };

    const start = transforms.find((entry) => entry.text.includes('Start'));
    const review = transforms.find((entry) => entry.text.includes('Review'));
    expect(start).toBeDefined();
    expect(review).toBeDefined();
    expect(parseTranslate(start!.transform).y).toBeLessThan(parseTranslate(review!.transform).y);
  });

  test('supported unified diagrams render with grid.columns=1', async ({ page }, testInfo) => {
    const cases = [
      {
        name: 'agentflow',
        source: `---
config:
  layout: grid
  grid:
    columns: 1
---
agentflow-beta TB
  a["Start"]
  b["Review"]
  a --> b`,
      },
      {
        name: 'class',
        source: `---
config:
  layout: grid
  grid:
    columns: 1
---
classDiagram
  class A
  class B
  A --> B`,
      },
      {
        name: 'state',
        source: `---
config:
  layout: grid
  grid:
    columns: 1
---
stateDiagram-v2
  [*] --> A
  A --> B`,
      },
      {
        name: 'er',
        source: `---
config:
  layout: grid
  grid:
    columns: 1
---
erDiagram
  CUSTOMER ||--o{ ORDER : places`,
      },
      {
        name: 'requirement',
        source: `---
config:
  layout: grid
  grid:
    columns: 1
---
requirementDiagram
  requirement checkout_req {
    id: 1
    text: Orders must be payable online.
    risk: high
    verifymethod: test
  }
  element checkout_service {
    type: service
  }
  checkout_service - satisfies -> checkout_req`,
      },
      {
        name: 'usecase',
        source: `---
config:
  layout: grid
  grid:
    columns: 1
---
usecase-beta
direction TB
actor Customer
Login("Sign in")
Customer --> Login`,
      },
    ];

    for (const item of cases) {
      await renderGraph(page, testInfo, item.source, {
        screenshot: false,
        name: `grid-${item.name}`,
      });
      await assertFiniteViewBox(page);
      await assertFiniteEdgePaths(page);
    }
  });

  test('grid flowchart also renders with SVG labels', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `---
config:
  layout: grid
  grid:
    columns: 1
---
flowchart TB
  A -->|next| B
  B -->|finish| C`,
      { htmlLabels: false, screenshot: false, name: 'grid-svg-labels' }
    );

    await assertFiniteViewBox(page);
    await assertFiniteEdgePaths(page);
  });

  test('grid renders the medium3 real-corpus flowchart with redux/neo', async ({ page }) => {
    const source = await readFile(
      new URL('../../platform/dev-diagrams/performance/flowcharts/medium3.mmd', import.meta.url),
      'utf8'
    );

    await page.goto('/iife.html');
    await page.evaluate(
      async ({ diagramSource }) => {
        const mount = document.createElement('div');
        mount.id = 'grid-medium3-corpus';
        document.body.innerHTML = '';
        document.body.append(mount);

        await window.mermaid.initialize({
          startOnLoad: false,
          layout: 'grid',
          theme: 'redux',
          look: 'neo',
          maxTextSize: 1_000_000,
          maxEdges: 1_000_000,
        });

        const { svg, bindFunctions } = await window.mermaid.render(
          'grid-medium3-corpus-svg',
          diagramSource
        );
        mount.innerHTML = svg;
        bindFunctions?.(mount);
        (window as Window & { rendered?: boolean }).rendered = true;
      },
      { diagramSource: source }
    );

    await assertFiniteViewBox(page);
    await assertFiniteEdgePaths(page);
  });

  test('grid flowchart keeps group titles, HTML labels, loops, and parallel routes structurally valid', async ({
    page,
  }) => {
    const source = `---
config:
  layout: grid
  grid:
    rowGap: 72
    columnGap: 96
---
flowchart LR
  subgraph G["Group"]
    M["Member"]@{ row: 1, column: 1 }
  end
  G@{ row: 1, column: 1 }
  O["Outside"]@{ row: 2, column: 4 }
  Loop["Loop"]@{ row: 1, column: 5 }
  Source([Source])@{ row: 2, column: 5 }
  Target([Target])@{ row: 2, column: 6 }

  G --> M
  M --> G
  M -->|<b>HTML label</b>| O
  O --> M
  Loop --> Loop
  Loop --> Loop
  Loop --> Loop
  Source --> Target
  Source --> Target
  Source --> Target
  Target --> Source`;

    await page.goto('/iife.html');
    await page.evaluate(
      async ({ diagramSource }) => {
        const mount = document.createElement('div');
        mount.id = 'grid-routing-structural';
        document.body.replaceChildren(mount);

        await window.mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
        });

        const { svg, bindFunctions } = await window.mermaid.render(
          'grid-routing-structural-svg',
          diagramSource
        );
        mount.innerHTML = svg;
        bindFunctions?.(mount);
      },
      { diagramSource: source }
    );

    await assertFiniteViewBox(page);
    await assertFiniteEdgePaths(page);
    await expect(page.locator('svg')).toContainText('Group');
    await expect(page.locator('svg')).toContainText('HTML label');

    const pathData = await page
      .locator('svg .edgePaths path')
      .evaluateAll((paths) => paths.map((path) => path.getAttribute('d') ?? ''));
    expect(pathData.length).toBeGreaterThanOrEqual(10);
    expect(new Set(pathData).size).toBe(pathData.length);
  });

  test('grid renders across classic, handDrawn, and neo looks', async ({ page }, testInfo) => {
    for (const look of ['classic', 'handDrawn', 'neo'] as const) {
      await renderGraph(
        page,
        testInfo,
        `---
config:
  layout: grid
  grid:
    columns: 1
---
flowchart TB
  A --> B
  B --> C`,
        { look, screenshot: true, name: `grid-look-${look}` }
      );
      await assertFiniteViewBox(page);
      await assertFiniteEdgePaths(page);
    }
  });
});
