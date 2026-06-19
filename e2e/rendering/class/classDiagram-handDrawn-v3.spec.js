import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('Class diagram V3 HD', () => {
  test('HD-0: should render a simple class diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
        classDiagram

        classA -- classB : Inheritance
        classA -- classC : link
        classC -- classD : link
        classB -- classD

        `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-1: should render a simple class diagram', async ({ page }, testInfo) => {
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-1.1: should render a simple class diagram without htmlLabels', async ({
    page,
  }, testInfo) => {
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
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });

  test('HD-2: should render a simple class diagrams with cardinality', async ({
    page,
  }, testInfo) => {
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-2.1: should render a simple class diagrams with cardinality without htmlLabels', async ({
    page,
  }, testInfo) => {
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
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });

  test('HD-2.2 should render a simple class diagram with different visibilities', async ({
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD-2.3 should render a simple class diagram with different visibilities without htmlLabels', async ({
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
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });

  test('HD-3: should render multiple class diagrams', async ({ page }, testInfo) => {
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-4: should render a simple class diagram with comments', async ({ page }, testInfo) => {
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-5: should render a simple class diagram with abstract method', async ({
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-5.1: should render a simple class diagram with abstract method without htmlLabels', async ({
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
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });

  test('HD-6: should render a simple class diagram with static method', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      Class01 <|-- AveryLongClass : Cool
      Class01 : someMethod()$
      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-6.1: should render a simple class diagram with static method without htmlLabels', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      Class01 <|-- AveryLongClass : Cool
      Class01 : someMethod()$
      `,
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });

  test('HD-7: should render a simple class diagram with Generic class', async ({
    page,
  }, testInfo) => {
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-7.1: should render a simple class diagram with Generic class without htmlLabels', async ({
    page,
  }, testInfo) => {
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
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });

  test('HD-8: should render a simple class diagram with Generic class and relations', async ({
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-9: should render a simple class diagram with clickable link', async ({
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-10: should render a simple class diagram with clickable callback', async ({
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-11: should render a simple class diagram with return type on method', async ({
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-11.1: should render a simple class diagram with return type on method without htmlLabels', async ({
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
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });

  test('HD-12: should render a simple class diagram with generic types', async ({
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-12.1: should render a simple class diagram with generic types without htmlLabels', async ({
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
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });

  test('HD-13: should render a simple class diagram with css classes applied', async ({
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

      cssClass "Class10" exClass2
      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-14: should render a simple class diagram with css classes applied directly', async ({
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-15: should render a simple class diagram with css classes applied two multiple classes', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      class Class10
      class Class20

      cssClass "Class10, class20" exClass2
      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-16a: should render a simple class diagram with static field', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      class Foo {
        +String bar$
      }
            `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-16b: should handle the direction statement with TB', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        direction TB
        class Student {
          -idCard : IdCard
        }
        class IdCard{
          -id : int
          -name : string
        }
        class Bike{
          -id : int
          -name : string
        }
        Student "1" --o "1" IdCard : carries
        Student "1" --o "1" Bike : rides

      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD-17a: should handle the direction statement with BT', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        direction BT
        class Student {
          -idCard : IdCard
        }
        class IdCard{
          -id : int
          -name : string
        }
        class Bike{
          -id : int
          -name : string
        }
        Student "1" --o "1" IdCard : carries
        Student "1" --o "1" Bike : rides

      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD-17b: should handle the direction statement with RL', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        direction RL
        class Student {
          -idCard : IdCard
        }
        class IdCard{
          -id : int
          -name : string
        }
        class Bike{
          -id : int
          -name : string
        }
        Student "1" --o "1" IdCard : carries
        Student "1" --o "1" Bike : rides

      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-18a: should handle the direction statement with LR', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        direction LR
        class Student {
          -idCard : IdCard
        }
        class IdCard{
          -id : int
          -name : string
        }
        class Bike{
          -id : int
          -name : string
        }
        Student "1" --o "1" IdCard : carries
        Student "1" --o "1" Bike : rides

      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-18b: should render a simple class diagram with notes', async ({ page }, testInfo) => {
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD-1433: should render a simple class with a title', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
title: simple class diagram
---
classDiagram
class Class10
`,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD: should render a class with text label', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `classDiagram
  class C1["Class 1 with text label"]
  C1 -->  C2`,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD: should render two classes with text labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `classDiagram
  class C1["Class 1 with text label"]
  class C2["Class 2 with chars @?"]
  C1 -->  C2`,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a class with a text label, members and annotation', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `classDiagram
  class C1["Class 1 with text label"] {
    &lt;&lt;interface&gt;&gt;
    +member1
  }
  C1 -->  C2`,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render multiple classes with same text labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `classDiagram
class C1["Class with text label"]
class C2["Class with text label"]
class C3["Class with text label"]
C1 --> C2
C3 ..> C2
  `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render classes with different text labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `classDiagram
class C1["OneWord"]
class C2["With, Comma"]
class C3["With (Brackets)"]
class C4["With [Brackets]"]
class C5["With {Brackets}"]
class C7["With 1 number"]
class C8["With . period..."]
class C9["With - dash"]
class C10["With _ underscore"]
class C11["With ' single quote"]
class C12["With ~!@#$%^&*()_+=-/?"]
class C13["With Città foreign language"]
  `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD: should render classLabel if class has already been defined earlier', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `classDiagram
  Animal <|-- Duck
  class Duck["Duck with text label"]
`,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should add classes namespaces', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
      namespace Namespace1 {
        class C1
        class C2
      }
      C1 --> C2
      class C3
      class C4
      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with no members', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Class10
        `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with no members if hideEmptyMembersBox is enabled', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Class10
        `,
      { logLevel: 1, class: { htmlLabels: true, hideEmptyMembersBox: true }, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with no attributes, only methods', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Duck {
          +swim()
          +quack()
        }
      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with no methods, only attributes', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Duck {
          +String beakColor
          +int age
          +float weight
        }
      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with style definition', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Class10
        style Class10 fill:#f9f,stroke:#333,stroke-width:4px
        `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with style definition without htmlLabels', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Class10
        style Class10 fill:#f9f,stroke:#333,stroke-width:4px
        `,
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with classDef definitions', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Class10
        classDef pink fill:#f9f
        classDef bold stroke:#333,stroke-width:6px,color:#fff
        `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with classDefs being applied', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Class10:::pink
        cssClass "Class10" bold
        classDef pink fill:#f9f
        classDef bold stroke:#333,stroke-width:6px,color:#fff
        `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with classDefs being applied without htmlLabels', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Class10:::pink
        cssClass "Class10" bold
        classDef pink fill:#f9f
        classDef bold stroke:#333,stroke-width:6px,color:#fff
        `,
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with markdown styling', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Class10 {
          +attribute *italic**
          ~attribute **bold***
          _italicmethod_()
          __boldmethod__()
          _+_swim_()a_
          __+quack() test__
        }
        `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with markdown styling without htmlLabels', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Class10 {
          +attribute *italic**
          ~attribute **bold***
          _italicmethod_()
          __boldmethod__()
          _+_swim_()a_
          __+quack() test__
        }
        `,
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with the handDrawn look', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Class10
        `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with styles and the handDrawn look', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Class10
        style Class10 fill:#f9f,stroke:#333,stroke-width:4px,color:white
        `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with styles and the handDrawn look without htmlLabels', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
        class Class10
        style Class10 fill:#f9f,stroke:#333,stroke-width:4px,color:white
        `,
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });
  test('HD: should render a full class diagram with the handDrawn look', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram
      note "I love this diagram!\nDo you love it?"
      Class01 <|-- AveryLongClass : Cool
      &lt;&lt;interface&gt;&gt; Class01
      Class03 "1" *-- "*" Class04
      Class05 "1" o-- "many" Class06
      Class07 "1" .. "*" Class08
      Class09 "1" --> "*" C2 : Where am i?
      Class09 "*" --* "*" C3
      Class09 "1" --|> "1" Class07
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
      note for Class10 "Cool class\nI said it's very cool class!"
      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with a custom theme', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    %%{
      init: {
        'theme': 'base',
        'themeVariables': {
          'primaryColor': '#BB2528',
          'primaryTextColor': '#fff',
          'primaryBorderColor': '#7C0000',
          'lineColor': '#F83d29',
          'secondaryColor': '#006100',
          'tertiaryColor': '#fff'
        }
      }
    }%%
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a simple class diagram with a custom theme and the handDrawn look', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    %%{
      init: {
        'theme': 'base',
        'themeVariables': {
          'primaryColor': '#BB2528',
          'primaryTextColor': '#fff',
          'primaryBorderColor': '#7C0000',
          'lineColor': '#F83d29',
          'secondaryColor': '#006100',
          'tertiaryColor': '#fff'
        }
      }
    }%%
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
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  test('HD: should render a full class diagram using elk', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
---
  config:
    layout: elk
---
    classDiagram
      note "I love this diagram!\nDo you love it?"
      Class01 <|-- AveryLongClass : Cool
      &lt;&lt;interface&gt;&gt; Class01
      Class03 "1" *-- "*" Class04
      Class05 "1" o-- "many" Class06
      Class07 "1" .. "*" Class08
      Class09 "1" --> "*" C2 : Where am i?
      Class09 "*" --* "*" C3
      Class09 "1" --|> "1" Class07
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
      note for Class10 "Cool class\nI said it's very cool class!"
      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD: should render nested namespaces with dot notation', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
      namespace Company.Engineering.Backend {
        class Developer {
          +writeCode()
        }
      }
      namespace Company.Engineering.Frontend {
        class Designer {
          +createMockup()
        }
      }
      namespace Company.Engineering {
        class TechLead {
          +planSprint()
        }
      }
      TechLead --> Developer : leads
      TechLead --> Designer : leads
    `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD: should render syntactically nested namespaces', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
      namespace Platform {
        namespace Auth {
          class UserService {
            +login()
            +logout()
          }
        }
        namespace Data {
          class Repository {
            +find()
            +save()
          }
        }
        class Gateway {
          +route()
        }
      }
      Gateway --> UserService : delegates
      Gateway --> Repository : delegates
    `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD: should render a namespace with a custom label', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
      namespace Auth["Authentication Service"] {
        class UserService {
          +login()
          +logout()
        }
        class TokenManager {
          +generate()
        }
      }
      UserService --> TokenManager : uses
    `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });

  test('HD: should render compact mode with hierarchicalNamespaces: false', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
      namespace Company.Engineering.Backend {
        class Developer {
          +writeCode()
        }
      }
      namespace Company.Engineering.Frontend {
        class Designer {
          +createMockup()
        }
      }
      namespace Company {
        class CEO {
          +makeDecisions()
        }
      }
      CEO --> Developer : oversees
      CEO --> Designer : oversees
    `,
      { class: { hierarchicalNamespaces: false } }
    );
  });

  test('HD: should render a self-referential class diagram with multiplicity labels', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
      class SelfReferential{
          +int id
          +int self_referential_id
          +SelfReferential referenced
      }
      SelfReferential "1" --> "0..1" SelfReferential : referenced
      `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
});
