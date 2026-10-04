import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('Class diagram V3 Dagre', () => {
  test('ELK-3: should render multiple class diagrams', async ({ page }, testInfo) => {
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
      { logLevel: 1, htmlLabels: true, layout: 'dagre' }
    );
  });
});

test.describe('Class diagram V3 ELK', () => {
  test('ELK-4: should keep cardinalities beside their ends and clear of class boxes (#8329)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      [
        `
    classDiagram
      Customer "1" --> "*" Order : places
      Order "1" *-- "1..*" LineItem : contains
      LineItem "*" --> "1" Product : refers to
      Customer "1" -- "0..1" Address : lives at
      `,
        `
    classDiagram
      direction LR
      class Animal {
        +String name
        +eat()
      }
      Animal "1" <|-- "many" Duck
      Animal "1" <|-- "0..n" Fish
      Duck "1" o-- "2..*" Feather
      `,
      ],
      { logLevel: 1, htmlLabels: true, layout: 'elk' }
    );
  });

  test('ELK-5: should keep cardinalities clear of class boxes with SVG labels (#8329)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      [
        `
    classDiagram
      direction LR
      class Animal {
        +String name
        +eat()
      }
      Animal "1" <|-- "many" Duck
      Animal "1" <|-- "0..n" Fish
      Duck "1" o-- "2..*" Feather
      `,
      ],
      { logLevel: 1, htmlLabels: false, layout: 'elk' }
    );
  });

  test('ELK-6: should keep cardinalities beside their ends across namespaces (#8329)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      namespace Shop {
        class Customer
        class Order
      }
      namespace Catalog {
        class Product
      }
      Customer "1" --> "*" Order : places
      Order "*" --> "1..*" Product : contains
      Customer "0..1" -- "1" Address : lives at
      `,
      { logLevel: 1, htmlLabels: true, layout: 'elk' }
    );
  });

  for (const [id, layout] of [
    ['ELK-7', 'elk'],
    ['ELK-8', 'dagre'],
  ]) {
    test(`${id}: should not clip cardinality text in a proportional font with ${layout} (#8329)`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
    classDiagram
      Customer "1" --> "*" Order : places
      Order "1" *-- "1..*" LineItem : contains
      Customer "0..1" -- "1" Address : lives at
      `,
        { logLevel: 1, htmlLabels: true, fontFamily: 'arial', layout }
      );
    });
  }

  test('ELK-9: should keep dagre end labels centred, clear of the class box (#8329)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      direction LR
      class Animal {
        +String name
        +eat()
      }
      Animal "1" <|-- "many" Duck
      Animal "1" <|-- "0..n" Fish
      Duck "1" o-- "2..*" Feather
      `,
      { logLevel: 1, htmlLabels: true, fontFamily: 'arial', layout: 'dagre' }
    );
  });

  test('ELK-10: should keep a cardinality that enters another namespace off its frame (#8335)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      direction LR
      namespace Shop {
        class Customer
        class Order
      }
      namespace Catalog {
        class Product
      }
      Customer "1" --> "*" Order : places
      Order "*" --> "1..*" Product : contains
      Customer "0..1" -- "1" Address : lives at
      `,
      { logLevel: 1, htmlLabels: true, layout: 'elk' }
    );
  });
});
