import { expect, test } from '@playwright/test';
import { diagramSvg, renderGraph } from '../../../helpers/util';

test.describe('Sankey record whitespace', () => {
  for (const syntax of ['sankey-beta', 'sankey']) {
    for (const [name, newline] of [
      ['LF', '\n'],
      ['CRLF', '\r\n'],
    ]) {
      test(`renders indented and quoted records with ${syntax} and ${name}`, async ({
        page,
      }, testInfo) => {
        const text = [
          `${syntax} \t`,
          '\ta,b,1',
          ' \t ',
          ' \t"c d",e,2',
          'd,e,"2" \t',
          'e,"f, ""quoted""",3',
        ].join(newline);

        await renderGraph(page, testInfo, text, {
          screenshot: false,
          sankey: { showValues: false },
        });

        const svg = diagramSvg(page);
        await expect(svg).toHaveAttribute('aria-roledescription', 'sankey');
        await expect(svg.locator('.node')).toHaveCount(6);
        await expect(svg.locator('.link')).toHaveCount(4);
        await expect(svg.locator('.node-labels text')).toHaveText([
          'a',
          'b',
          'c d',
          'e',
          'd',
          'f, "quoted"',
        ]);
      });
    }
  }
});
