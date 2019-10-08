/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util';

describe('Class diagram', () => {
  it('should render a simple class diagram', () => {
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
});
