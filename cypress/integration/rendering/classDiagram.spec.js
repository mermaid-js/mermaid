import { imgSnapshotTest, renderGraph } from '../../helpers/util.js';

describe('Class diagram', () => {
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
      { logLevel: 1 }
    );
    cy.get('svg');
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
      {}
    );
    cy.get('svg');
  });

  it('3: should render a simple class diagram with different visibilities', () => {
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
      {}
    );
    cy.get('svg');
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
      {}
    );
    cy.get('svg');
  });

  it('5: should render a simple class diagram with abstract method', () => {
    imgSnapshotTest(
      `
    classDiagram
      Class01 <|-- AveryLongClass : Cool
      Class01 : someMethod()*
      `,
      {}
    );
    cy.get('svg');
  });

  it('6: should render a simple class diagram with static method', () => {
    imgSnapshotTest(
      `
    classDiagram
      Class01 <|-- AveryLongClass : Cool
      Class01 : someMethod()$
      `,
      {}
    );
    cy.get('svg');
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
      {}
    );
    cy.get('svg');
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
      {}
    );
    cy.get('svg');
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
      {}
    );
    cy.get('svg');
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
      {}
    );
    cy.get('svg');
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
      {}
    );
    cy.get('svg');
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
      {}
    );
    cy.get('svg');
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

      class Class10:::exClass2
      `,
      {}
    );
    cy.get('svg');
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
      {}
    );
    cy.get('svg');
  });

  it('15: should render a simple class diagram with css classes applied to multiple classes', () => {
    imgSnapshotTest(
      `
    classDiagram
      class Class10
      class Class20

      cssClass "Class10, Class20" exClass2
      class Class20:::exClass2
      `,
      {}
    );
    cy.get('svg');
  });

  it('16: should render multiple class diagrams', () => {
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
      {}
    );
    cy.get('svg');
  });

  // it('17: should render a class diagram when useMaxWidth is true (default)', () => {
  //   renderGraph(
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
  //   cy.get('svg')
  //     .should((svg) => {
  //       expect(svg).to.have.attr('width', '100%');
  //       const height = parseFloat(svg.attr('height'));
  //       expect(height).to.be.within(332, 333);
  //      // expect(svg).to.have.attr('height', '218');
  //       const style = svg.attr('style');
  //       expect(style).to.match(/^max-width: [\d.]+px;$/);
  //       const maxWidthValue = parseInt(style.match(/[\d.]+/g).join(''));
  //       // use within because the absolute value can be slightly different depending on the environment ±5%
  //       expect(maxWidthValue).to.be.within(203, 204);
  //     });
  // });

  // it('18: should render a class diagram when useMaxWidth is false', () => {
  //   renderGraph(
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
  //   cy.get('svg')
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

  it('19: should render a simple class diagram with notes', () => {
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
      { logLevel: 1 }
    );
    cy.get('svg');
  });
});
