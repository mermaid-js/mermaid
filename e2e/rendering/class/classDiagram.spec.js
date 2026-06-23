import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('Class diagram', () => {
  test('16: should render multiple class diagrams', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      [
        `
    classDiagram
      Class01 "1" <|--|> "*" AveryLongClass : Cool
      &lt;&lt;interface&gt;&gt; Class01
      Class03 "1" *-- "*" Class04
      Class05 "1" o-- "many" Class06
      Class07 "1" .. "*" Class08
      Class09 "1" --> "*" C2 : Where am i?
      Class09 "*" --* "*" C3
      Class09 "1" --|> "1" Class07
      Class07  : equals()
      Class07  : Object[] elementData
      Class01  : size()
      Class01  : int chimp
      Class01  : int gorilla
      Class08 "1" <--> "*" C2: Cool label
      class Class10 {
        &lt;&lt;service&gt;&gt;
        int id
        test()
      }
      `,
        `
    classDiagram
      Class01 "1" <|--|> "*" AveryLongClass : Cool
      &lt;&lt;interface&gt;&gt; Class01
      Class03 "1" *-- "*" Class04
      Class05 "1" o-- "many" Class06
      Class07 "1" .. "*" Class08
      Class09 "1" --> "*" C2 : Where am i?
      Class09 "*" --* "*" C3
      Class09 "1" --|> "1" Class07
      Class07  : equals()
      Class07  : Object[] elementData
      Class01  : size()
      Class01  : int chimp
      Class01  : int gorilla
      Class08 "1" <--> "*" C2: Cool label
      class Class10 {
        &lt;&lt;service&gt;&gt;
        int id
        test()
      }
      `,
      ],
      {}
    );
  });

  // test('17: should render a class diagram when useMaxWidth is true (default)', async ({ page }, testInfo) => {
  //   await renderGraph(page, testInfo,
  //     `
  //   classDiagram
  //     Class01 <|-- AveryLongClass : Cool
  //     Class01 : size()
  //     Class01 : int chimp
  //     Class01 : int gorilla
  //     Class01 : -int privateChimp
  //     Class01 : +int publicGorilla
  //     Class01 : #int protectedMarmoset
  //     `,
  //     { class: { useMaxWidth: true } }
  //   );
  //   page.locator('svg')
  //     .should((svg) => {
  //       expect(svg).to.have.attr('width', '100%');
  //       const height = parseFloat(svg.attr('height'));
  //       expect(height).to.be.within(332, 333);
  //      // expect(svg).to.have.attr('height', '218');
  //       const style = svg.attr('style');
  //       expect(style).toMatch(/^max-width: [\d.]+px;$/);
  //       const maxWidthValue = parseInt(style.match(/[\d.]+/g).join(''));
  //       // use within because the absolute value can be slightly different depending on the environment ±5%
  //       expect(maxWidthValue).to.be.within(203, 204);
  //     });
  // });

  // test('18: should render a class diagram when useMaxWidth is false', async ({ page }, testInfo) => {
  //   await renderGraph(page, testInfo,
  //     `
  //   classDiagram
  //     Class01 <|-- AveryLongClass : Cool
  //     Class01 : size()
  //     Class01 : int chimp
  //     Class01 : int gorilla
  //     Class01 : -int privateChimp
  //     Class01 : +int publicGorilla
  //     Class01 : #int protectedMarmoset
  //     `,
  //     { class: { useMaxWidth: false } }
  //   );
  //   page.locator('svg')
  //     .should((svg) => {
  //       const width = parseFloat(svg.attr('width'));
  //       // use within because the absolute value can be slightly different depending on the environment ±5%
  //       expect(width).to.be.within(100, 101);
  //       const height = parseFloat(svg.attr('height'));
  //       expect(height).to.be.within(332, 333);
  //      // expect(svg).to.have.attr('height', '332');
  //      // expect(svg).to.not.have.attr('style');
  //     });
  // });

  test('should handle notes with anchor tag having target attribute', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `classDiagram
        class test { }
        note for test "<a href='https://mermaid.js.org/' target="_blank"><code>note about mermaid</code></a>"`
    );

    await expect(page.locator('svg a')).toHaveAttribute('target', '_blank');
    await expect(page.locator('svg a')).toHaveAttribute('rel', 'noopener');
  });
});
