import { expect, test } from '@playwright/test';
import { mermaidUrl } from '../../../helpers/util.ts';

const diagram = `orgchart-beta
    CEO "Anna Andersson"
        staff Finance
        staff HR
        staff Legal
        Engineering "Research, development & infrastructure"
            staff Quality "Quality advisor"
            Development "A long name with Unicode: Åsa Öberg"
            Systems
        Sales
            Europe
        Operations
`;

for (const look of ['classic', 'handDrawn'] as const) {
  test.describe(`orgchart ${look}`, () => {
    for (const theme of ['default', 'dark', 'forest', 'neutral', 'base'] as const) {
      test(`fits labels and keeps nodes clear in the ${theme} theme`, async ({ page }) => {
        await page.goto(
          mermaidUrl(
            diagram,
            {
              look,
              theme,
              fontFamily: 'monospace',
              themeVariables: { fontSize: '28px' },
            },
            false
          )
        );
        const svg = page.locator('svg.orgchart');
        await expect(svg.locator('g.orgchart-node')).toHaveCount(11);
        await page.evaluate(() => document.fonts.ready);

        const geometry = await svg.evaluate((element) => {
          const nodeGroups = [...element.querySelectorAll<SVGGElement>('g.orgchart-node')];
          const nodes = nodeGroups.map((group) => {
            const bounds = group.getBBox();
            const transform = group.transform.baseVal.consolidate()!.matrix;
            return {
              label: group.querySelector('.orgchart-label')!.textContent,
              x: bounds.x + transform.e,
              y: bounds.y + transform.f,
              width: bounds.width,
              height: bounds.height,
              top: transform.f,
            };
          });
          const labels = nodeGroups.flatMap((group) => {
            const shape = group.querySelector<SVGGraphicsElement>('rect, .orgchart-node-shape')!;
            const box = shape.getBBox();
            return [...group.querySelectorAll<SVGTextElement>('text')].map((text) => {
              const label = text.getBBox();
              return {
                text: text.textContent,
                fits:
                  label.x >= box.x &&
                  label.y >= box.y &&
                  label.x + label.width <= box.x + box.width &&
                  label.y + label.height <= box.y + box.height,
                size: getComputedStyle(text).fontSize,
                fontFamily: getComputedStyle(text).fontFamily,
              };
            });
          });
          const relativeLuminance = (color: string) => {
            const channels =
              color
                .match(/\d+(?:\.\d+)?/g)
                ?.slice(0, 3)
                .map(Number) ?? [];
            const [red, green, blue] = channels.map((channel) => {
              const value = channel / 255;
              return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            });
            return red * 0.2126 + green * 0.7152 + blue * 0.0722;
          };
          const staffSecondaryContrasts = nodeGroups
            .filter((group) => group.classList.contains('orgchart-node-staff'))
            .flatMap((group) => {
              const shape = group.querySelector<SVGGraphicsElement>('.orgchart-node-fill, rect')!;
              const background = relativeLuminance(getComputedStyle(shape).fill);
              return [...group.querySelectorAll<SVGTextElement>('.orgchart-secondary-label')].map(
                (text) => {
                  const foreground = relativeLuminance(getComputedStyle(text).fill);
                  return {
                    text: text.textContent,
                    ratio:
                      (Math.max(foreground, background) + 0.05) /
                      (Math.min(foreground, background) + 0.05),
                  };
                }
              );
            });
          const viewBox = (element as SVGSVGElement).viewBox.baseVal;
          return {
            nodes,
            labels,
            staffSecondaryContrasts,
            viewBox: { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height },
          };
        });

        expect(
          geometry.labels.every((label) => label.fits),
          JSON.stringify(geometry.labels)
        ).toBe(true);
        expect(geometry.labels.find((label) => label.text === 'CEO')!.size).toBe('28px');
        expect(geometry.labels.every((label) => label.fontFamily === 'monospace')).toBe(true);
        expect(
          geometry.staffSecondaryContrasts.every(({ ratio }) => ratio >= 4.5),
          JSON.stringify(geometry.staffSecondaryContrasts)
        ).toBe(true);
        expect(geometry.nodes.find((node) => node.label === 'Development')!.top).toBe(
          geometry.nodes.find((node) => node.label === 'Europe')!.top
        );
        for (const [index, node] of geometry.nodes.entries()) {
          expect(node.x).toBeGreaterThanOrEqual(geometry.viewBox.x);
          expect(node.y).toBeGreaterThanOrEqual(geometry.viewBox.y);
          expect(node.x + node.width).toBeLessThanOrEqual(
            geometry.viewBox.x + geometry.viewBox.width
          );
          expect(node.y + node.height).toBeLessThanOrEqual(
            geometry.viewBox.y + geometry.viewBox.height
          );
          for (const other of geometry.nodes.slice(index + 1)) {
            const overlaps =
              node.x < other.x + other.width &&
              other.x < node.x + node.width &&
              node.y < other.y + other.height &&
              other.y < node.y + node.height;
            expect(overlaps, `${node.label} overlaps ${other.label}`).toBe(false);
          }
        }
        if (look === 'handDrawn') {
          await expect(svg.locator('.orgchart-node-shape')).toHaveCount(11);
          await expect(svg.locator('.orgchart-connector-staff path')).toHaveCount(4);
        } else {
          await expect(svg.locator('.orgchart-node rect')).toHaveCount(11);
        }
      });
    }

    test('uses theme colors for box fills, outlines, text and connectors', async ({ page }) => {
      await page.goto(
        mermaidUrl(
          diagram,
          {
            look,
            theme: 'base',
            themeVariables: {
              mainBkg: '#f0f8ff',
              secondaryColor: '#fff0f5',
              nodeBorder: '#123456',
              lineColor: '#654321',
              nodeTextColor: '#102030',
            },
          },
          false
        )
      );
      const svg = page.locator('svg.orgchart');
      const fill = look === 'handDrawn' ? '.orgchart-node-fill' : 'rect';
      const outline = look === 'handDrawn' ? '.orgchart-node-outline' : 'rect';
      await expect(svg.locator(`.orgchart-node-regular ${fill}`).first()).toHaveCSS(
        'fill',
        'rgb(240, 248, 255)'
      );
      await expect(svg.locator(`.orgchart-node-staff ${fill}`).first()).toHaveCSS(
        'fill',
        'rgb(255, 240, 245)'
      );
      await expect(svg.locator(`.orgchart-node ${outline}`).first()).toHaveCSS(
        'stroke',
        'rgb(18, 52, 86)'
      );
      await expect(svg.locator('.orgchart-label').first()).toHaveCSS('fill', 'rgb(16, 32, 48)');
      await expect(svg.locator('.orgchart-node-staff .orgchart-secondary-label').first()).toHaveCSS(
        'fill',
        'rgb(16, 32, 48)'
      );
      for (const kind of ['staff', 'reporting']) {
        const connector =
          look === 'handDrawn'
            ? `.orgchart-connector-${kind} path`
            : `path.orgchart-connector-${kind}`;
        await expect(svg.locator(connector).first()).toHaveCSS('stroke', 'rgb(101, 67, 33)');
      }
    });
  });
}

test('renders multiple charts without colliding SVG node ids', async ({ page }) => {
  const secondChart = `orgchart-beta
  COO
    Operations
`;
  await page.goto(
    mermaidUrl([diagram, secondChart], { theme: 'default', screenshot: false }, false)
  );

  const charts = page.locator('svg.orgchart');
  await expect(charts).toHaveCount(2);
  await expect(charts.nth(0).locator('.orgchart-node')).toHaveCount(11);
  await expect(charts.nth(1).locator('.orgchart-node')).toHaveCount(2);

  const nodeIds = await page
    .locator('svg.orgchart g.orgchart-node[id]')
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(nodeIds).size).toBe(nodeIds.length);
});

test('centres and themes the visible title above the chart', async ({ page }) => {
  const titledDiagram = `orgchart-beta
title Company structure
  CEO
    Engineering
    Sales
`;
  await page.goto(
    mermaidUrl(
      titledDiagram,
      {
        theme: 'base',
        themeVariables: { textColor: '#102030' },
        screenshot: false,
      },
      false
    )
  );

  const svg = page.locator('svg.orgchart');
  const title = svg.locator('.orgchart-title');
  const chartBounds = await svg.locator('.orgchart').evaluate((chart) => {
    const { x, y, width, height } = chart.getBBox();
    return { x, y, width, height };
  });
  const titlePosition = await title.evaluate((element) => ({
    x: Number(element.getAttribute('x')),
    y: Number(element.getAttribute('y')),
  }));
  expect(titlePosition.x).toBeCloseTo(chartBounds.x + chartBounds.width / 2);
  expect(titlePosition.y).toBeLessThan(chartBounds.y);
  await expect(title).toHaveCSS('fill', 'rgb(16, 32, 48)');
});
