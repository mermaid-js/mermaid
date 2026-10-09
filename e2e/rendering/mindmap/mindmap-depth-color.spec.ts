import { expect, test, type Locator } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

// Frontmatter exercises diagram-local configuration, including the new option.
const diagram = `---
config:
  mindmap:
    colorBy: depth
---
mindmap
  root((mindmap))
        origins{{Origins}}
          history[Long history]
            Popularisation
            British popular psychology author Tony Buzan
        research{{Research}}
            uses[Uses]
              Creative techniques
`;

const palette = {
  git0: '#374151',
  gitBranchLabel0: '#ffffff',
  // The neo look colors the root label with cScaleLabel0 instead of gitBranchLabel0.
  // A different value lets the assertions tell the two rules apart.
  cScaleLabel0: '#f9fafb',
  cScale1: '#bfdbfe',
  cScaleLabel1: '#172554',
  cScale2: '#bbf7d0',
  cScaleLabel2: '#14532d',
  cScale3: '#fde68a',
  cScaleLabel3: '#451a03',
};

async function expectDepthColors(svg: Locator, look: 'classic' | 'neo', htmlLabels = false) {
  const rootLabel = look === 'neo' ? 'rgb(249, 250, 251)' : 'rgb(255, 255, 255)';
  const levels = [
    ['section-root', 'rgb(55, 65, 81)', rootLabel, 1],
    ['section-0', 'rgb(191, 219, 254)', 'rgb(23, 37, 84)', 2],
    ['section-1', 'rgb(187, 247, 208)', 'rgb(20, 83, 45)', 2],
    ['section-2', 'rgb(253, 230, 138)', 'rgb(69, 26, 3)', 3],
  ] as const;
  for (const [section, fill, labelColor, count] of levels) {
    const nodes = svg.locator(`.mindmap-node.${section}`);
    await expect(nodes).toHaveCount(count);
    for (const node of await nodes.all()) {
      await expect(node.locator('rect, path, circle, polygon').first()).toHaveCSS('fill', fill);
      if (htmlLabels) {
        await expect(node.locator('.nodeLabel').first()).toHaveCSS('color', labelColor);
      } else {
        await expect(node.locator('.text-inner-tspan').first()).toHaveCSS('fill', labelColor);
      }
    }
  }
  for (const [section, color, count] of [
    [0, 'rgb(191, 219, 254)', 2],
    [1, 'rgb(187, 247, 208)', 2],
    [2, 'rgb(253, 230, 138)', 3],
  ] as const) {
    const edges = svg.locator(`.section-edge-${section}`);
    await expect(edges).toHaveCount(count);
    for (const edge of await edges.all()) {
      await expect(edge).toHaveCSS('stroke', color);
    }
  }
}

test.describe('Mindmap depth colors', () => {
  test('classic look', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      diagram,
      {
        layout: 'cose-bilkent',
        look: 'classic',
        htmlLabels: false,
        theme: 'base',
        themeVariables: palette,
      },
      undefined,
      (svg: Locator) => expectDepthColors(svg, 'classic')
    );
  });

  for (const htmlLabels of [false, true]) {
    test(`neo look${htmlLabels ? ' with HTML labels' : ''}`, async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        diagram,
        {
          layout: 'cose-bilkent',
          look: 'neo',
          htmlLabels,
          theme: 'base',
          // The base theme's default neo gradient paints every node with mainBkg.
          themeVariables: { ...palette, useGradient: false },
        },
        undefined,
        (svg: Locator) => expectDepthColors(svg, 'neo', htmlLabels)
      );
    });
  }
});
