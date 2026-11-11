import { expect, test } from '@playwright/test';

test('preserves class box padding defaults and explicit overrides', async ({ page }, testInfo) => {
  await page.goto('/');
  const geometry = await page.evaluate(async () => {
    const moduleUrl = '/mermaid.esm.mjs';
    const { default: mermaid } = await import(moduleUrl);
    const render = async (padding?: number, withNamespace = false) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        fontFamily: 'Arial',
        class: padding === undefined ? {} : { padding },
      });
      const source = withNamespace
        ? `classDiagram
          namespace shop {
            class Order {
              +String id
              +submit() void
            }
          }
          note for Order "An order note"`
        : `classDiagram
          class Order {
            +String id
            +submit() void
          }`;
      const { svg } = await mermaid.render('padding-test', source);
      const host = document.body.appendChild(document.createElement('div'));
      host.innerHTML = svg;
      const root = host.querySelector('svg')!;
      const result = {
        viewBox: root.getAttribute('viewBox'),
        boxes: [...root.querySelectorAll('.node, .cluster')].map((element) => {
          const { x, y, width, height } = (element as SVGGraphicsElement).getBBox();
          return { x, y, width, height };
        }),
        labels: [...root.querySelectorAll('foreignObject')].map((element) => [
          element.getAttribute('width'),
          element.getAttribute('height'),
        ]),
      };
      host.remove();
      return result;
    };
    return {
      default: await render(),
      explicit12: await render(12),
      explicit0: await render(0),
      explicit24: await render(24),
      namespaceAndNote: await render(undefined, true),
      explicitNamespaceAndNote: await render(5, true),
    };
  });
  expect(geometry.default.boxes).toHaveLength(1);
  expect(geometry.default).toEqual(geometry.explicit12);
  expect(geometry.explicit0.boxes[0].width).toBeLessThan(geometry.default.boxes[0].width);
  expect(geometry.explicit24.boxes[0].width).toBeGreaterThan(geometry.default.boxes[0].width);
  expect(geometry.namespaceAndNote.boxes.length).toBeGreaterThan(1);
  expect(geometry.explicitNamespaceAndNote.boxes).toHaveLength(
    geometry.namespaceAndNote.boxes.length
  );
  expect(geometry.explicitNamespaceAndNote).not.toEqual(geometry.namespaceAndNote);
  await testInfo.attach('padding-geometry', {
    body: JSON.stringify(geometry),
    contentType: 'application/json',
  });
});
