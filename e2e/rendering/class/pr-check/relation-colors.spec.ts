import { expect, test } from '@playwright/test';
import { mermaidUrl, renderGraph } from '../../../helpers/util.ts';

const relations = [
  'A <|-- B',
  'A <|-- C',
  'A <|-- D',
  'A --|> E',
  'A <|-- F',
  'G *-- H',
  'I --* J',
  'K o-- L',
  'M --o N',
  'O <.. P',
  'Q ..> R',
  'S ()-- T',
  'U --() V',
];

for (const theme of ['default', 'dark'] as const) {
  for (const look of ['classic', 'neo', 'handDrawn'] as const) {
    test(`class relation colors (${theme}, ${look})`, async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, `classDiagram\n${relations.join('\n')}`, {
        theme,
        look,
        screenshot: false,
        themeCSS: relations
          .map((relation, index) => {
            const color =
              index === 2
                ? undefined
                : [1, 6, 8, 10, 12].includes(index)
                  ? 'red'
                  : index === 3
                    ? 'blue'
                    : 'green';
            const [start, , end] = relation.split(' ');
            return color
              ? `path[id$="id_${start}_${end}_${index + 1}"] { stroke: ${index === 0 ? 'var(--relation-color)' : color} !important; --relation-color: ${color}; }`
              : '';
          })
          .join('\n'),
      });
      const markers = await page.locator('path.relation').evaluateAll((paths) =>
        paths.map((path) => {
          const markerAttribute =
            path.getAttribute('marker-start') ?? path.getAttribute('marker-end');
          const markerId = markerAttribute!
            .slice(markerAttribute!.lastIndexOf('#') + 1)
            .replace(/["')]/g, '');
          const marker = document.getElementById(markerId)!;
          const shape = marker.querySelector('path,polygon,circle,line')!;
          return {
            line: getComputedStyle(path).stroke,
            stroke: getComputedStyle(shape).stroke,
            fill: getComputedStyle(shape).fill,
            filled:
              marker.classList.contains('composition') || marker.classList.contains('dependency'),
            markerId,
          };
        })
      );
      expect(markers).toHaveLength(relations.length);
      for (const marker of markers) {
        expect(marker.stroke).toBe(marker.line);
        if (marker.filled) {
          expect(marker.fill).toBe(marker.line);
        } else {
          expect(marker.fill).not.toBe(marker.line);
        }
      }
      expect(markers[0].line).toBe('rgb(0, 128, 0)');
      expect(markers[1].line).toBe('rgb(255, 0, 0)');
      expect(markers[2].line).toBe(theme === 'dark' ? 'rgb(211, 211, 211)' : 'rgb(51, 51, 51)');
      expect(markers[3].line).toBe('rgb(0, 0, 255)');
      expect(markers[0].markerId).toBe(markers[4].markerId);
      expect(new Set(markers.slice(0, 4).map(({ markerId }) => markerId)).size).toBe(4);
    });
  }
}

test('class relation colors in sandbox rendering', async ({ page }) => {
  await page.goto(
    mermaidUrl(
      'classDiagram\nA <|-- B',
      {
        securityLevel: 'sandbox',
        themeCSS: 'path.relation {stroke:green !important;}',
      },
      false
    )
  );
  await page.waitForFunction(() => window.rendered === true);
  const path = page.frameLocator('iframe').locator('path.relation');
  await expect(path).toHaveCount(1);
  const colors = await path.evaluate((element) => {
    const ref = element.getAttribute('marker-start')!;
    const markerId = ref.slice(ref.lastIndexOf('#') + 1).replace(/["')]/g, '');
    const shape = document.getElementById(markerId)!.querySelector('path,polygon')!;
    return { line: getComputedStyle(element).stroke, arrow: getComputedStyle(shape).stroke };
  });
  expect(colors.line).toBe('rgb(0, 128, 0)');
  expect(colors.arrow).toBe(colors.line);
});
