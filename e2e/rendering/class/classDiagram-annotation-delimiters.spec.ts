import { test, expect } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

for (const layout of ['dagre', 'elk'] as const) {
  for (const htmlLabels of [false, true]) {
    test(`class annotations with ${layout} and htmlLabels=${htmlLabels}`, async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `classDiagram
          class UnicodeInline «interface» {
            +run()
          }
          class UnicodeBody {
            «service»
            +String name
          }
          class EncodedInline &laquo;interface&raquo;
          class EncodedBody {
            &#xAB;service&#xBB;
          }
          class Legacy &lt;&lt;interface&gt;&gt;
          class Container~T~ «interface» {
            +List~List~String~~ values
          }
          UnicodeInline --> UnicodeBody
          EncodedInline --> EncodedBody
          Legacy --> Container`,
        { layout, htmlLabels, screenshot: false }
      );

      for (const [name, annotation] of [
        ['UnicodeInline', 'interface'],
        ['UnicodeBody', 'service'],
        ['EncodedInline', 'interface'],
        ['EncodedBody', 'service'],
        ['Legacy', 'interface'],
        ['Container', 'interface'],
      ]) {
        const node = page.locator(`g[id*="-classId-${name}-"]`);
        await expect(node).toHaveCount(1);
        await expect(node.locator('.annotation-group')).toHaveText(`«${annotation}»`);
        await expect(node.locator('.members-group')).not.toContainText(`«${annotation}»`);
      }

      await expect(page.locator('g[id*="-classId-Container-"] .members-group')).toContainText(
        '+List<List<String>> values'
      );
    });
  }
}
