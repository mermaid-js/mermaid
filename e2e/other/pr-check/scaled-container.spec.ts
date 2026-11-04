import { expect, test } from '@playwright/test';

for (const scale of ['0.5', '0.83', '2', '2, 0.5', '-2, 0.5']) {
  test(`keeps flowchart geometry unchanged under ancestor scale(${scale})`, async ({ page }) => {
    await page.goto('/');
    const geometry = await page.evaluate(async (scale) => {
      const moduleUrl = '/mermaid.esm.mjs';
      const { default: mermaid } = await import(moduleUrl);
      mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', fontFamily: 'Arial' });
      const image =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='blue'/%3E%3C/svg%3E";
      const source = `flowchart LR
        subgraph group[Group title]
          A[Alpha Beta Gamma]
          B@{ img: "${image}", label: "Image Node<br/>Second Line", w: 64, h: 64, constraint: "on" }
          A -->|Edge label| B
        end
        B --> C[End]`;
      const render = async (factor: string, id: string) => {
        const host = document.body.appendChild(document.createElement('div'));
        host.style.cssText = `width: 800px; transform: scale(${factor}); transform-origin: top left`;
        const { svg } = await mermaid.render(id, source, host);
        host.innerHTML = svg;
        const root = host.querySelector('svg')!;
        return {
          labels: [...root.querySelectorAll('foreignObject')].map((el) => [
            Number(el.getAttribute('width')),
            Number(el.getAttribute('height')),
          ]),
          nodes: [...root.querySelectorAll('.node')].map((el) => {
            const box = (el as SVGGraphicsElement).getBBox();
            return [box.width, box.height];
          }),
          edges: [...root.querySelectorAll('.edgePaths path')].map((el) =>
            el
              .getAttribute('d')!
              .match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)!
              .map(Number)
          ),
        };
      };
      return { normal: await render('1', 'normal'), scaled: await render(scale, 'scaled') };
    }, scale);
    expect(geometry.normal.labels.length).toBeGreaterThan(0);
    expect(geometry.normal.edges.length).toBeGreaterThan(0);
    for (const key of ['labels', 'nodes', 'edges'] as const) {
      expect(geometry.scaled[key]).toHaveLength(geometry.normal[key].length);
      geometry.normal[key].forEach((values, i) => {
        expect(geometry.scaled[key][i]).toHaveLength(values.length);
        values.forEach((value, j) => expect(geometry.scaled[key][i][j]).toBeCloseTo(value, 2));
      });
    }
  });
}
