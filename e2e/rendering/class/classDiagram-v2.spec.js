import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('Class diagram V2', () => {
  test('0: should render a simple class diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
        classDiagram-v2

        classA -- classB : Inheritance
        classA -- classC : link
        classC -- classD : link
        classB -- classD

        `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('1: should render a simple class diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
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
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('2: should render a simple class diagrams with cardinality', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
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
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('2.1 should render a simple class diagram with different visibilities', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
      Class01 <|-- AveryLongClass : Cool
      &lt;&lt;interface&gt;&gt; Class01
      Class01 : -privateMethod()
      Class01 : +publicMethod()
      Class01 : #protectedMethod()
      Class01 : -int privateChimp
      Class01 : +int publicGorilla
      Class01 : #int protectedMarmoset
      `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('3: should render multiple class diagrams', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      [
        `
    classDiagram-v2
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
    classDiagram-v2
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
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('4: should render a simple class diagram with comments', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
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
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('5: should render a simple class diagram with abstract method', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
      Class01 <|-- AveryLongClass : Cool
      Class01 : someMethod()*
      `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('6: should render a simple class diagram with static method', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
      Class01 <|-- AveryLongClass : Cool
      Class01 : someMethod()$
      `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('7: should render a simple class diagram with Generic class', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
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
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('8: should render a simple class diagram with Generic class and relations', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
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
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('9: should render a simple class diagram with clickable link', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
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
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('10: should render a simple class diagram with clickable callback', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
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
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('11: should render a simple class diagram with return type on method', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
      class Class10~T~ {
        int[] id
        test(int[] ids) bool
        testArray() bool[]
      }
      `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('12: should render a simple class diagram with generic types', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
      class Class10~T~ {
        int[] id
        List~int~ ids
        test(List~int~ ids) List~bool~
        testArray() bool[]
      }
      `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('13: should render a simple class diagram with css classes applied', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
      class Class10 {
        int[] id
        List~int~ ids
        test(List~int~ ids) List~bool~
        testArray() bool[]
      }

      cssClass "Class10" exClass2
      `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('14: should render a simple class diagram with css classes applied directly', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
      class Class10:::exClass2 {
        int[] id
        List~int~ ids
        test(List~int~ ids) List~bool~
        testArray() bool[]
      }
      `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('15: should render a simple class diagram with css classes applied two multiple classes', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
      class Class10
      class Class20

      cssClass "Class10, class20" exClass2
      `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('16a: should render a simple class diagram with static field', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    classDiagram-v2
      class Foo {
        +String bar$
      }
            `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('16b: should handle the direction statement with TB', async ({ page }, testInfo) => {
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
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });
  test('17a: should handle the direction statement with BT', async ({ page }, testInfo) => {
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
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });
  test('17b: should handle the direction statement with RL', async ({ page }, testInfo) => {
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
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('18a: should handle the direction statement with LR', async ({ page }, testInfo) => {
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
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('18b: should render a simple class diagram with notes', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram-v2
        note "I love this diagram!\nDo you love it?"
        class Class10 {
            int id
          size()
        }
        note for Class10 "Cool class\nI said it's very cool class!"

        `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('1433: should render a simple class with a title', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
title: simple class diagram
---
classDiagram-v2
class Class10
`
    );
  });

  test('should render a class with text label', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `classDiagram
  class C1["Class 1 with text label"]
  C1 -->  C2`
    );
  });

  test('should render two classes with text labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `classDiagram
  class C1["Class 1 with text label"]
  class C2["Class 2 with chars @?"]
  C1 -->  C2`
    );
  });
  test('should render a class with a text label, members and annotation', async ({
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
  C1 -->  C2`
    );
  });
  test('should render multiple classes with same text labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `classDiagram
class C1["Class with text label"]
class C2["Class with text label"]
class C3["Class with text label"]
C1 --> C2
C3 ..> C2
  `
    );
  });
  test('should render classes with different text labels', async ({ page }, testInfo) => {
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
  `
    );
  });

  test('should render classLabel if class has already been defined earlier', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `classDiagram
  Animal <|-- Duck
  class Duck["Duck with text label"]
`
    );
  });
  test('should add classes namespaces', async ({ page }, testInfo) => {
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
      `
    );
  });
  test('should add notes in namespaces', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram
      note "This is a outer note"
      note for C1 "This is a outer note for C1"
      namespace Namespace1 {
        note "This is a inner note"
        note for C1 "This is a inner note for C1"
        class C1
      }
      `
    );
  });
  test('should render a simple class diagram with no members', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram-v2
        class Class10
        `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });
  test('should render a simple class diagram with style definition', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram-v2
        class Class10
        style Class10 fill:#f9f,stroke:#333,stroke-width:4px
        `,
      { logLevel: 1, flowchart: { htmlLabels: false } }
    );
  });

  test('renders a class diagram with a generic class in a namespace', async ({
    page,
  }, testInfo) => {
    const diagramDefinition = `
      classDiagram-v2
      namespace Company.Project.Module {
        class GenericClass~T~ {
          +addItem(item: T)
          +getItem() T
        }
      }
    `;

    await imgSnapshotTest(page, testInfo, diagramDefinition);
  });

  test('renders a class diagram with nested namespaces and relationships', async ({
    page,
  }, testInfo) => {
    const diagramDefinition = `
      classDiagram-v2
      namespace Company.Project.Module.SubModule {
        class Report {
          +generatePDF(data: List)
          +generateCSV(data: List)
        }
      }
      namespace Company.Project.Module {
        class Admin {
          +generateReport()
        }
      }
      Admin --> Report : generates
    `;

    await imgSnapshotTest(page, testInfo, diagramDefinition);
  });

  test('renders a class diagram with multiple classes and relationships in a namespace', async ({
    page,
  }, testInfo) => {
    const diagramDefinition = `
      classDiagram-v2
      namespace Company.Project.Module {
        class User {
          +login(username: String, password: String)
          +logout()
        }
        class Admin {
          +addUser(user: User)
          +removeUser(user: User)
          +generateReport()
        }
        class Report {
          +generatePDF(reportData: List)
          +generateCSV(reportData: List)
        }
      }
      Admin --> User : manages
      Admin --> Report : generates
    `;

    await imgSnapshotTest(page, testInfo, diagramDefinition);
  });

  test('renders nested namespaces with dot notation', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram-v2
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
    `
    );
  });

  test('renders syntactically nested namespaces', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram-v2
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
    `
    );
  });

  test('renders a namespace with a custom label', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      classDiagram-v2
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
    `
    );
  });

  test('renders compact mode with hierarchicalNamespaces: false', async ({ page }, testInfo) => {
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
});
