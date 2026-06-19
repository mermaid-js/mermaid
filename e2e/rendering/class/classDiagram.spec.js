import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('Class diagram', () => {
  test('1: should render a simple class diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      Class01 <|-- AveryLongClass : Cool
      &lt;&lt;interface&gt;&gt; Class01
      Class03 *-- Class04
      Class05 o-- Class06
      Class07 .. Class08
      Class09 --> C2 : Where am i?
      Class09 --* C3
      Class09 --|> Class07
      Class12 <|.. Class08
      Class11 ..>Class12
      Class07 : equals()
      Class07 : Object[] elementData
      Class01 : size()
      Class01 : int chimp
      Class01 : int gorilla
      Class01 : -int privateChimp
      Class01 : +int publicGorilla
      Class01 : #int protectedMarmoset
      Class08 <--> C2: Cool label
      class Class10 {
        &lt;&lt;service&gt;&gt;
        int id
        test()
      }
      `,
      { logLevel: 1 }
    );
  });

  test('2: should render a simple class diagrams with cardinality', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
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
      {}
    );
  });

  test('3: should render a simple class diagram with different visibilities', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      Class01 <|-- AveryLongClass : Cool
      &lt;&lt;interface&gt;&gt; Class01
      Class01 : -privateMethod()
      Class01 : +publicMethod()
      Class01 : #protectedMethod()
      Class01 : -int privateChimp
      Class01 : +int publicGorilla
      Class01 : #int protectedMarmoset
      `,
      {}
    );
  });

  test('4: should render a simple class diagram with comments', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      %% this is a comment
      Class01 <|-- AveryLongClass : Cool
      &lt;&lt;interface&gt;&gt; Class01
      Class03 *-- Class04
      Class05 o-- Class06
      Class07 .. Class08
      Class09 --> C2 : Where am i?
      Class09 --* C3
      Class09 --|> Class07
      Class07 : equals()
      Class07 : Object[] elementData
      Class01 : size()
      Class01 : int chimp
      Class01 : int gorilla
      Class08 <--> C2: Cool label
      class Class10 {
        &lt;&lt;service&gt;&gt;
        int id
        test()
      }
      `,
      {}
    );
  });

  test('5: should render a simple class diagram with abstract method', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      Class01 <|-- AveryLongClass : Cool
      Class01 : someMethod()*
      `,
      {}
    );
  });

  test('6: should render a simple class diagram with static method', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      Class01 <|-- AveryLongClass : Cool
      Class01 : someMethod()$
      `,
      {}
    );
  });

  test('7: should render a simple class diagram with Generic class', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
    class Class01~T~
      Class01 : size()
      Class01 : int chimp
      Class01 : int gorilla
      Class08 <--> C2: Cool label
      class Class10~T~ {
        &lt;&lt;service&gt;&gt;
        int id
        test()
      }
      `,
      {}
    );
  });

  test('8: should render a simple class diagram with Generic class and relations', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
    Class01~T~ <|-- AveryLongClass : Cool
    Class03~T~ *-- Class04~T~
      Class01 : size()
      Class01 : int chimp
      Class01 : int gorilla
      Class08 <--> C2: Cool label
      class Class10~T~ {
        &lt;&lt;service&gt;&gt;
        int id
        test()
      }
      `,
      {}
    );
  });

  test('9: should render a simple class diagram with clickable link', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
    Class01~T~ <|-- AveryLongClass : Cool
    Class03~T~ *-- Class04~T~
      Class01 : size()
      Class01 : int chimp
      Class01 : int gorilla
      Class08 <--> C2: Cool label
      class Class10~T~ {
        &lt;&lt;service&gt;&gt;
        int id
        test()
      }
      link Class01 "google.com" "A Tooltip"
      `,
      {}
    );
  });

  test('10: should render a simple class diagram with clickable callback', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
    Class01~T~ <|-- AveryLongClass : Cool
    Class03~T~ *-- Class04~T~
      Class01 : size()
      Class01 : int chimp
      Class01 : int gorilla
      Class08 <--> C2: Cool label
      class Class10~T~ {
        &lt;&lt;service&gt;&gt;
        int id
        test()
      }
      callback Class01 "functionCall" "A Tooltip"
      `,
      {}
    );
  });

  test('11: should render a simple class diagram with return type on method', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      class Class10~T~ {
        int[] id
        test(int[] ids) bool
        testArray() bool[]
      }
      `,
      {}
    );
  });

  test('12: should render a simple class diagram with generic types', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      class Class10~T~ {
        int[] id
        List~int~ ids
        test(List~int~ ids) List~bool~
        testArray() bool[]
      }
      `,
      {}
    );
  });

  test('13: should render a simple class diagram with css classes applied', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      class Class10 {
        int[] id
        List~int~ ids
        test(List~int~ ids) List~bool~
        testArray() bool[]
      }

      class Class10:::exClass2
      `,
      {}
    );
  });

  test('14: should render a simple class diagram with css classes applied directly', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      class Class10:::exClass2 {
        int[] id
        List~int~ ids
        test(List~int~ ids) List~bool~
        testArray() bool[]
      }
      `,
      {}
    );
  });

  test('15: should render a simple class diagram with css classes applied to multiple classes', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      class Class10
      class Class20

      cssClass "Class10, Class20" exClass2
      class Class20:::exClass2
      `,
      {}
    );
  });

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

  test('19: should render a simple class diagram with notes', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      note "I love this diagram!\nDo you love it?"
      class Class10 {
        int id
        size()
      }
      note for Class10 "Cool class\nI said it's very cool class!"
      `,
      { logLevel: 1 }
    );
  });

  test('should render class diagram with newlines in title', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        Animal <|-- \`Du\nck\`
        Animal : +int age
        Animal : +String gender
        Animal: +isMammal()
        Animal: +mate()
        class \`Du\nck\` {
          +String beakColor
          +String featherColor
          +swim()
          +quack()
        }
      `
    );
  });

  test('should render class diagram with many newlines in title', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      class \`This\nTitle\nHas\nMany\nNewlines\` {
        +String Also
        -String Many
        #int Members
        +And()
        -Many()
        #Methods()
      }
    `
    );
  });

  test('should render with newlines in title and an annotation', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      class \`This\nTitle\nHas\nMany\nNewlines\` {
        +String Also
        -String Many
        #int Members
        +And()
        -Many()
        #Methods()
      }
      &lt;&lt;Interface&gt;&gt; \`This\nTitle\nHas\nMany\nNewlines\`  
    `
    );
  });

  test('should handle newline title in namespace', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      namespace testingNamespace {
      class \`This\nTitle\nHas\nMany\nNewlines\` {
        +String Also
        -String Many
        #int Members
        +And()
        -Many()
        #Methods()
      }
    }
    `
    );
  });

  test('should handle newline in string label', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class A["This has\na newline!"] {
          +String boop
          -Int beep
          #double bop
        }

        class B["This title also has\na newline"]
        B : +with(more)
        B : -methods()
      `
    );
  });

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

  test.describe('Include char sequence "graph" in text (#6795)', () => {
    test('has a label with char sequence "graph"', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        classDiagram
          class Person {
            +String name
            -Int id
            #double age
            +Text demographicProfile
          }
        `,
        { flowchart: { defaultRenderer: 'elk' } }
      );
    });
  });

  test('should handle backticks for namespace and class names', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
          namespace \`A::B\` {
              class \`IPC::Sender\`
          }
          RenderProcessHost --|> \`IPC::Sender\`
      `,
      {}
    );
  });

  test('should handle an empty class body with empty braces', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      ` classDiagram
        class FooBase~T~ {}
    class Bar {
        +Zip
        +Zap()
    }
    FooBase <|-- Ba
        `,
      { flowchart: { defaultRenderer: 'elk' } }
    );
  });
});
