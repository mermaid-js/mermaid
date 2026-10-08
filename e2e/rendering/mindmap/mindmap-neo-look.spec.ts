import { expect, test, type Locator } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

const themes = [
  'neo',
  'neo-dark',
  'redux',
  'redux-dark',
  'redux-color',
  'redux-dark-color',
] as const;

const comprehensiveMindmap = `mindmap
  root((All Shapes))
    Square Branch
      sq[Square Node]
        sq1[Nested Square]
        sq2[Another Square]
    Rounded Branch
      rd(Rounded Node)
        rd1(Nested Rounded)
        rd2(Another Rounded)
    Circle Branch
      ci((Circle Node))
        ci1((Nested Circle))
        ci2((Another Circle))
    Bang Branch
      bg))Bang Node((
        bg1))Nested Bang((
        bg2))Another Bang((
    Cloud Branch
      cl)Cloud Node(
        cl1)Nested Cloud(
        cl2)Another Cloud(
    Hexagon Branch
      hx{{Hexagon Node}}
        hx1{{Nested Hexagon}}
        hx2{{Another Hexagon}}
    Default Branch
      df Default Node
        df1 Nested Default
        df2 Another Default
`;

themes.forEach((theme) => {
  test.describe(`Mindmap neo look — all shapes — ${theme} theme`, () => {
    test('renders all shapes in a single comprehensive diagram', async ({ page }, testInfo) => {
      await imgSnapshotTest(page, testInfo, comprehensiveMindmap, { look: 'neo', theme });
    });
  });
});

// These themes repaint neo nodes with a shared or gradient background, so HTML labels
// must switch color along with the SVG text.
const repaintedThemes = ['neutral', 'dark', 'forest'] as const;

for (const theme of repaintedThemes) {
  for (const colorBy of ['branch', 'depth'] as const) {
    test(`Mindmap neo look — ${theme} theme — readable HTML labels with ${colorBy} colors`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        comprehensiveMindmap,
        { look: 'neo', theme, htmlLabels: true, mindmap: { colorBy } },
        undefined,
        async (svg: Locator) => {
          const contrasts = await svg.locator('.mindmap-node').evaluateAll((nodes) => {
            const luminance = (color: string) => {
              const [r, g, b] = color
                .match(/[\d.]+/g)!
                .slice(0, 3)
                .map(Number);
              const channel = (v: number) =>
                (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
              return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
            };
            return nodes.map((node) => {
              const shape = node.querySelector('rect, path, circle, polygon')!;
              const label = node.querySelector('.nodeLabel')!;
              const [light, dark] = [
                luminance(getComputedStyle(shape).fill),
                luminance(getComputedStyle(label).color),
              ].sort((a, b) => b - a);
              return { label: label.textContent, contrast: (light + 0.05) / (dark + 0.05) };
            });
          });
          for (const { label, contrast } of contrasts) {
            expect(contrast, `contrast for "${label}"`).toBeGreaterThanOrEqual(4.5);
          }
        }
      );
    });
  }
}
