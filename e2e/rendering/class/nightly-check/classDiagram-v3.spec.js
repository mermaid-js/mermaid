import { expect, test } from '@playwright/test';
import { imgSnapshotTest } from '../../../helpers/util.ts';

test.describe('Class diagram V3', () => {
  for (const layout of ['dagre', 'elk']) {
    test(`should keep lollipop interfaces inside their namespace with ${layout} (#8412)`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `classDiagram
          namespace Kitchen {
            class Dishwasher
            class Fridge
            class Toaster
          }
          Dishwasher --() power
          Dishwasher --() water
          Fridge --() power
          Toaster --() power`,
        { layout },
        false,
        async (svg) => {
          const frame = await svg.locator('g.cluster').boundingBox();
          expect(frame).not.toBeNull();
          const interfaces = svg.locator('g.node[id*="-interface"]');
          await expect(interfaces).toHaveCount(4);
          for (const node of await interfaces.all()) {
            const bounds = await node.boundingBox();
            expect(bounds).not.toBeNull();
            expect(bounds.x).toBeGreaterThanOrEqual(frame.x);
            expect(bounds.y).toBeGreaterThanOrEqual(frame.y);
            expect(bounds.x + bounds.width).toBeLessThanOrEqual(frame.x + frame.width);
            expect(bounds.y + bounds.height).toBeLessThanOrEqual(frame.y + frame.height);
          }
        }
      );
    });
  }

  test('3: should render multiple class diagrams', async ({ page }, testInfo) => {
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
      { logLevel: 1, htmlLabels: true }
    );
  });
});
