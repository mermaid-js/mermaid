import { expect, test } from '@playwright/test';
import { diagramSvg, renderGraph } from '../../../helpers/util';

/**
 * With SVG labels a class emits `.<name> path { fill: ... !important }` (and the same for
 * rect, polygon, ellipse and circle). On an icon shape that rule matches the embedded
 * icon as well as the shape around it, so the class must not reach the icon's artwork:
 * a glyph painted in the container's fill disappears into it. Only a browser resolves
 * that cascade, so these cases read the computed paint.
 */
const forms = [undefined, 'circle', 'rounded', 'square'] as const;
const looks = ['classic', 'handDrawn'] as const;
const classDef = 'classDef hot fill:#f96,stroke:#333';
const classFill = 'rgb(255, 153, 102)';
const classStroke = 'rgb(51, 51, 51)';

const iconNodes = (icon: string, withClass: boolean) =>
  [
    'flowchart LR',
    ...forms.map(
      (form, index) =>
        `  n${index}@{ icon: "${icon}", ${form ? `form: "${form}", ` : ''}label: "${form ?? 'icon'}" }`
    ),
    ...(withClass
      ? [`  ${classDef}`, `  class ${forms.map((_, index) => `n${index}`).join(',')} hot`]
      : []),
  ].join('\n');

/** Per node: the computed fill of the drawn shape, and the paint of each element of its icon. */
const nodePaint = (page: Parameters<typeof diagramSvg>[0]) =>
  diagramSvg(page)
    .first()
    .locator('g.icon-shape')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const shape = node.querySelector(':scope > g:first-child > path');
        const artwork = node
          .querySelector('svg')
          ?.querySelectorAll('rect, polygon, ellipse, circle, path');
        return {
          shapeFill: shape ? getComputedStyle(shape).fill : undefined,
          artwork: [...(artwork ?? [])].map((element) => {
            const { fill, stroke } = getComputedStyle(element);
            return { fill, stroke };
          }),
        };
      })
    );

test.describe('icon shapes keep their artwork out of class paint with SVG labels', () => {
  for (const { icon, ownPaint } of [
    // a path glyph drawn in `currentColor`, which follows the node's stroke
    { icon: 'fa:bell', ownPaint: [{ fill: classStroke, stroke: 'none' }] },
    // the `?` placeholder for an icon that is not registered, painted by an inline style
    { icon: 'nope:missing', ownPaint: [{ fill: 'rgb(8, 126, 191)', stroke: 'none' }] },
    // multi-colour artwork painted by attributes
    {
      icon: 'aws:arch-amazon-cloudwatch',
      ownPaint: [
        { fill: 'rgb(255, 79, 139)', stroke: 'none' },
        { fill: 'rgb(255, 255, 255)', stroke: 'none' },
      ],
    },
  ]) {
    for (const look of looks) {
      test(`${icon}, ${look} look: a class paints the shape but not the icon`, async ({
        page,
      }, testInfo) => {
        await renderGraph(page, testInfo, iconNodes(icon, true), {
          htmlLabels: false,
          look,
          screenshot: false,
        });
        const paint = await nodePaint(page);
        expect(paint.map(({ artwork }) => artwork)).toEqual(forms.map(() => ownPaint));
        // the shape around the icon still takes the class
        expect(paint.filter((_, index) => forms[index]).map(({ shapeFill }) => shapeFill)).toEqual(
          forms.filter(Boolean).map(() => classFill)
        );
      });
    }
  }

  test('without a class the artwork keeps the theme paint', async ({ page }, testInfo) => {
    await renderGraph(page, testInfo, iconNodes('fa:bell', false), {
      htmlLabels: false,
      screenshot: false,
    });
    const paint = await nodePaint(page);
    expect(paint).toHaveLength(forms.length);
    for (const { artwork } of paint) {
      expect(artwork).toHaveLength(1);
      expect(artwork[0].stroke).toBe('none');
      expect([classFill, classStroke]).not.toContain(artwork[0].fill);
    }
  });
});
