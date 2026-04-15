import { imgSnapshotTest } from '../../../helpers/util.ts';

const themes = [
  { theme: 'neo', label: 'neo' },
  { theme: 'neo-dark', label: 'neo-dark' },
  { theme: 'redux', label: 'redux' },
  { theme: 'redux-dark', label: 'redux-dark' },
];

const diagrams = {
  allRelationships: `
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

  cardinality: `
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

  genericClasses: `
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

  directionTB: `
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

  fullWithNotes: `
    classDiagram
      note "I love this diagram!\\nDo you love it?"
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
      note for Class10 "Cool class\\nI said it's very cool class!"
  `,
};

describe('Class diagram — Neo look with new themes', () => {
  // 1. All relationship types + interface + visibility modifiers
  themes.forEach(({ theme, label }) => {
    it(`NEO-1 [${label}]: should render all relationship types with neo look`, () => {
      imgSnapshotTest(diagrams.allRelationships, {
        logLevel: 1,
        htmlLabels: true,
        look: 'neo',
        theme,
      });
    });
  });

  // 2. Cardinality on every relationship type
  themes.forEach(({ theme, label }) => {
    it(`NEO-2 [${label}]: should render cardinality with neo look`, () => {
      imgSnapshotTest(diagrams.cardinality, {
        logLevel: 1,
        htmlLabels: true,
        look: 'neo',
        theme,
      });
    });
  });

  // 3. Generic classes
  themes.forEach(({ theme, label }) => {
    it(`NEO-3 [${label}]: should render generic classes with neo look`, () => {
      imgSnapshotTest(diagrams.genericClasses, {
        logLevel: 1,
        htmlLabels: true,
        look: 'neo',
        theme,
      });
    });
  });

  // 4. Direction TB with aggregation
  themes.forEach(({ theme, label }) => {
    it(`NEO-4 [${label}]: should render direction TB diagram with neo look`, () => {
      imgSnapshotTest(diagrams.directionTB, {
        logLevel: 1,
        htmlLabels: true,
        look: 'neo',
        theme,
      });
    });
  });

  // 5. Full diagram with global and per-class notes
  themes.forEach(({ theme, label }) => {
    it(`NEO-5 [${label}]: should render full diagram with notes using neo look`, () => {
      imgSnapshotTest(diagrams.fullWithNotes, {
        logLevel: 1,
        htmlLabels: true,
        look: 'neo',
        theme,
      });
    });
  });
});
