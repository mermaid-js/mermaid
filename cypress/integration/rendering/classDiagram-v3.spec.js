import { imgSnapshotTest } from '../../helpers/util.ts';
describe('Class diagram V3', () => {
  it('0: should render a simple class diagram', () => {
    imgSnapshotTest(
      `
        classDiagram

        classA -- classB : Inheritance
        classA -- classC : link
        classC -- classD : link
        classB -- classD

        `,
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('1: should render a simple class diagram', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('1.1: should render a simple class diagram without htmlLabels', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('2: should render a simple class diagrams with cardinality', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('2.1: should render a simple class diagrams with cardinality without htmlLabels', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('2.2 should render a simple class diagram with different visibilities', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });
  it('2.3 should render a simple class diagram with different visibilities without htmlLabels', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('3: should render multiple class diagrams', () => {
    imgSnapshotTest(
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

  it('4: should render a simple class diagram with comments', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('5: should render a simple class diagram with abstract method', () => {
    imgSnapshotTest(
      `
    classDiagram
      Class01 <|-- AveryLongClass : Cool
      Class01 : someMethod()*
      `,
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('5.1: should render a simple class diagram with abstract method without htmlLabels', () => {
    imgSnapshotTest(
      `
    classDiagram
      Class01 <|-- AveryLongClass : Cool
      Class01 : someMethod()*
      `,
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('6: should render a simple class diagram with static method', () => {
    imgSnapshotTest(
      `
    classDiagram
      Class01 <|-- AveryLongClass : Cool
      Class01 : someMethod()$
      `,
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('6.1: should render a simple class diagram with static method without htmlLabels', () => {
    imgSnapshotTest(
      `
    classDiagram
      Class01 <|-- AveryLongClass : Cool
      Class01 : someMethod()$
      `,
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('7: should render a simple class diagram with Generic class', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('7.1: should render a simple class diagram with Generic class without htmlLabels', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('8: should render a simple class diagram with Generic class and relations', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('9: should render a simple class diagram with clickable link', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('10: should render a simple class diagram with clickable callback', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('11: should render a simple class diagram with return type on method', () => {
    imgSnapshotTest(
      `
    classDiagram
      class Class10~T~ {
        int[] id
        test(int[] ids) bool
        testArray() bool[]
      }
      `,
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('11.1: should render a simple class diagram with return type on method without htmlLabels', () => {
    imgSnapshotTest(
      `
    classDiagram
      class Class10~T~ {
        int[] id
        test(int[] ids) bool
        testArray() bool[]
      }
      `,
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('12: should render a simple class diagram with generic types', () => {
    imgSnapshotTest(
      `
    classDiagram
      class Class10~T~ {
        int[] id
        List~int~ ids
        test(List~int~ ids) List~bool~
        testArray() bool[]
      }
      `,
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('12.1: should render a simple class diagram with generic types without htmlLabels', () => {
    imgSnapshotTest(
      `
    classDiagram
      class Class10~T~ {
        int[] id
        List~int~ ids
        test(List~int~ ids) List~bool~
        testArray() bool[]
      }
      `,
      { logLevel: 1, htmlLabels: false }
    );
  });

  it('13: should render a simple class diagram with css classes applied', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('14: should render a simple class diagram with css classes applied directly', () => {
    imgSnapshotTest(
      `
    classDiagram
      class Class10:::exClass2 {
        int[] id
        List~int~ ids
        test(List~int~ ids) List~bool~
        testArray() bool[]
      }
      `,
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('15: should render a simple class diagram with css classes applied two multiple classes', () => {
    imgSnapshotTest(
      `
    classDiagram
      class Class10
      class Class20

      cssClass "Class10, class20" exClass2
      `,
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('16a: should render a simple class diagram with static field', () => {
    imgSnapshotTest(
      `
    classDiagram
      class Foo {
        +String bar$
      }
            `,
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('16b: should handle the direction statement with TB', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });
  it('17a: should handle the direction statement with BT', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });
  it('17b: should handle the direction statement with RL', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('18a: should handle the direction statement with LR', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('18b: should render a simple class diagram with notes', () => {
    imgSnapshotTest(
      `
      classDiagram
        note "I love this diagram!\nDo you love it?"
        class Class10 {
            int id
          size()
        }
        note for Class10 "Cool class\nI said it's very cool class!"

        `,
      { logLevel: 1, htmlLabels: true }
    );
  });

  it('1433: should render a simple class with a title', () => {
    imgSnapshotTest(
      `---
title: simple class diagram
---
classDiagram
class Class10
`
    );
  });

  it('should render a class with text label', () => {
    imgSnapshotTest(
      `classDiagram
  class C1["Class 1 with text label"]
  C1 -->  C2`
    );
  });

  it('should render two classes with text labels', () => {
    imgSnapshotTest(
      `classDiagram
  class C1["Class 1 with text label"]
  class C2["Class 2 with chars @?"]
  C1 -->  C2`
    );
  });
  it('should render a class with a text label, members and annotation', () => {
    imgSnapshotTest(
      `classDiagram
  class C1["Class 1 with text label"] {
    &lt;&lt;interface&gt;&gt;
    +member1
  }
  C1 -->  C2`
    );
  });
  it('should render multiple classes with same text labels', () => {
    imgSnapshotTest(
      `classDiagram
class C1["Class with text label"]
class C2["Class with text label"]
class C3["Class with text label"]
C1 --> C2
C3 ..> C2
  `
    );
  });
  it('should render classes with different text labels', () => {
    imgSnapshotTest(
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

  it('should render classLabel if class has already been defined earlier', () => {
    imgSnapshotTest(
      `classDiagram
  Animal <|-- Duck
  class Duck["Duck with text label"]
`
    );
  });
  it('should add classes namespaces', function () {
    imgSnapshotTest(
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
  it('should render a simple class diagram with no members', () => {
    imgSnapshotTest(
      `
      classDiagram
        class Class10
        `,
      { logLevel: 1, htmlLabels: true }
    );
  });
  it('should render a simple class diagram with no members if hideEmptyMembersBox is enabled', () => {
    imgSnapshotTest(
      `
      classDiagram
        class Class10
        `,
      { logLevel: 1, class: { htmlLabels: true, hideEmptyMembersBox: true } }
    );
  });
  it('should render a simple class diagram with no attributes, only methods', () => {
    imgSnapshotTest(
      `
      classDiagram
        class Duck {
          +swim()
          +quack()
        }
      `
    );
  });
  it('should render a simple class diagram with no methods, only attributes', () => {
    imgSnapshotTest(
      `
      classDiagram
        class Duck {
          +String beakColor
          +int age
          +float weight
        }
      `
    );
  });
  it('should render a simple class diagram with style definition', () => {
    imgSnapshotTest(
      `
      classDiagram
        class Class10
        style Class10 fill:#f9f,stroke:#333,stroke-width:4px
        `,
      { logLevel: 1, htmlLabels: true }
    );
  });
  it('should render a simple class diagram with style definition without htmlLabels', () => {
    imgSnapshotTest(
      `
      classDiagram
        class Class10
        style Class10 fill:#f9f,stroke:#333,stroke-width:4px
        `,
      { logLevel: 1, htmlLabels: false }
    );
  });
  it('should render a simple class diagram with classDef definitions', () => {
    imgSnapshotTest(
      `
      classDiagram
        class Class10
        classDef pink fill:#f9f
        classDef bold stroke:#333,stroke-width:6px,color:#fff
        `,
      { logLevel: 1, htmlLabels: true }
    );
  });
  it('should render a simple class diagram with classDefs being applied', () => {
    imgSnapshotTest(
      `
      classDiagram
        class Class10:::pink
        cssClass "Class10" bold
        classDef pink fill:#f9f
        classDef bold stroke:#333,stroke-width:6px,color:#fff
        `,
      { logLevel: 1, htmlLabels: true }
    );
  });
  it('should render a simple class diagram with classDefs being applied without htmlLabels', () => {
    imgSnapshotTest(
      `
      classDiagram
        class Class10:::pink
        cssClass "Class10" bold
        classDef pink fill:#f9f
        classDef bold stroke:#333,stroke-width:6px,color:#fff
        `,
      { logLevel: 1, htmlLabels: false }
    );
  });
  it('should render a simple class diagram with markdown styling', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });
  it('should render a simple class diagram with markdown styling without htmlLabels', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: false }
    );
  });
  it('should render a simple class diagram with the handDrawn look', () => {
    imgSnapshotTest(
      `
      classDiagram
        class Class10
        `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  it('should render a simple class diagram with styles and the handDrawn look', () => {
    imgSnapshotTest(
      `
      classDiagram
        class Class10
        style Class10 fill:#f9f,stroke:#333,stroke-width:4px,color:white
        `,
      { logLevel: 1, htmlLabels: true, look: 'handDrawn' }
    );
  });
  it('should render a simple class diagram with styles and the handDrawn look without htmlLabels', () => {
    imgSnapshotTest(
      `
      classDiagram
        class Class10
        style Class10 fill:#f9f,stroke:#333,stroke-width:4px,color:white
        `,
      { logLevel: 1, htmlLabels: false, look: 'handDrawn' }
    );
  });
  it('should render a full class diagram with the handDrawn look', () => {
    imgSnapshotTest(
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
  it('should render a simple class diagram with a custom theme', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });
  it('should render a simple class diagram with a custom theme and the handDrawn look', () => {
    imgSnapshotTest(
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
  it('should render a full class diagram using elk', () => {
    imgSnapshotTest(
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
      { logLevel: 1, htmlLabels: true }
    );
  });
});
