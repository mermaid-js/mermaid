import { readFile } from 'node:fs/promises';
import { test } from '@playwright/test';
import { assertDiagramNotError } from '../../../helpers/util.ts';
import { assertFiniteEdgePaths, assertFiniteViewBox } from '../../../helpers/grid-assertions.ts';

test.describe('grid layout rendering', () => {
  test('grid renders the medium3 real-corpus flowchart with redux/neo', async ({ page }) => {
    const source = await readFile(
      new URL('../../../platform/dev-diagrams/performance/flowcharts/medium3.mmd', import.meta.url),
      'utf8'
    );

    await page.goto('/iife.html');
    await page.waitForFunction(() => window.mermaid !== undefined);
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
    await assertDiagramNotError(page);
  });
});
