import { imgSnapshotTest, renderGraph } from '../../helpers/util';

describe('Entity Relationship Diagram', () => {
  it('should render a simple ER diagram', () => {
    imgSnapshotTest(
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it('should render an ER diagram with a recursive relationship', () => {
    imgSnapshotTest(
      `
    erDiagram
        CUSTOMER ||..o{ CUSTOMER : refers
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it('should render an ER diagram with multiple relationships between the same two entities', () => {
    imgSnapshotTest(
      `
    erDiagram
        CUSTOMER ||--|{ ADDRESS : "invoiced at"
        CUSTOMER ||--|{ ADDRESS : "receives goods at"
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it('should render a cyclical ER diagram', () => {
    imgSnapshotTest(
      `
    erDiagram
        A ||--|{ B : likes
        B ||--|{ C : likes
        C ||--|{ A : likes
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it('should render a not-so-simple ER diagram', () => {
    imgSnapshotTest(
      `
    erDiagram
        CUSTOMER }|..|{ DELIVERY-ADDRESS : has
        CUSTOMER ||--o{ ORDER : places
        CUSTOMER ||--o{ INVOICE : "liable for"
        DELIVERY-ADDRESS ||--o{ ORDER : receives
        INVOICE ||--|{ ORDER : covers
        ORDER ||--|{ ORDER-ITEM : includes
        PRODUCT-CATEGORY ||--|{ PRODUCT : contains
        PRODUCT ||--o{ ORDER-ITEM : "ordered in"
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it('should render multiple ER diagrams', () => {
    imgSnapshotTest(
      [
        `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
        `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      ],
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it('should render an ER diagram with blank or empty labels', () => {
    imgSnapshotTest(
      `
    erDiagram
        BOOK }|..|{ AUTHOR : ""
        BOOK }|..|{ GENRE : " "
        AUTHOR }|..|{ GENRE : "  "
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it('should render an ER diagrams when useMaxWidth is true (default)', () => {
    renderGraph(
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { er: { useMaxWidth: true } }
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      // expect(svg).to.have.attr('height', '465');
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      // use within because the absolute value can be slightly different depending on the environment ±5%
      expect(maxWidthValue).to.be.within(140 * 0.95, 140 * 1.05);
    });
  });

  it('should render an ER when useMaxWidth is false', () => {
    renderGraph(
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { er: { useMaxWidth: false } }
    );
    cy.get('svg').should((svg) => {
      const width = parseFloat(svg.attr('width'));
      // use within because the absolute value can be slightly different depending on the environment ±5%
      expect(width).to.be.within(140 * 0.95, 140 * 1.05);
      // expect(svg).to.have.attr('height', '465');
      expect(svg).to.not.have.attr('style');
    });
  });

  it('should render entities that have no relationships', () => {
    renderGraph(
      `
    erDiagram
        DEAD_PARROT
        HERMIT
        RECLUSE
        SOCIALITE }o--o{ SOCIALITE : "interacts with"
        RECLUSE }o--o{ SOCIALITE : avoids
      `,
      { er: { useMaxWidth: false } }
    );
    cy.get('svg');
  });

  it('should render entities with and without attributes', () => {
    renderGraph(
      `
    erDiagram
        BOOK { string title }
        AUTHOR }|..|{ BOOK : writes
        BOOK { float price }
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it.only('should render entities with generic and array attributes', () => {
    renderGraph(
      `
    erDiagram
        BOOK {
          string title
          string[] authors
          type~T~ type
        }
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it('should render entities and attributes with big and small entity names', () => {
    renderGraph(
      `
    erDiagram
        PRIVATE_FINANCIAL_INSTITUTION {
          string name
          int    turnover
        }
        PRIVATE_FINANCIAL_INSTITUTION ||..|{ EMPLOYEE : employs
        EMPLOYEE { bool officer_of_firm }
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it('should render entities with keys', () => {
    renderGraph(
      `
    erDiagram
      AUTHOR_WITH_LONG_ENTITY_NAME {
        string name PK
      }
      AUTHOR_WITH_LONG_ENTITY_NAME }|..|{ BOOK : writes
      BOOK {
          float price
          string author FK
          string title PK
        }
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it('should render entities with comments', () => {
    renderGraph(
      `
    erDiagram
      AUTHOR_WITH_LONG_ENTITY_NAME {
        string name "comment"
      }
      AUTHOR_WITH_LONG_ENTITY_NAME }|..|{ BOOK : writes
      BOOK {
          string author
          string title "author comment"
          float price "price comment"
        }
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it('should render entities with keys and comments', () => {
    renderGraph(
      `
    erDiagram
      AUTHOR_WITH_LONG_ENTITY_NAME {
        string name PK "comment"
      }
      AUTHOR_WITH_LONG_ENTITY_NAME }|..|{ BOOK : writes
      BOOK {
          string description
          float price "price comment"
          string title PK "title comment"
          string author FK
        }
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });

  it('should render entities with aliases', () => {
    renderGraph(
      `
    erDiagram
      T1 one or zero to one or more T2 : test
      T2 one or many optionally to zero or one T3 : test
      T3 zero or more to zero or many T4 : test
      T4 many(0) to many(1) T5 : test
      T5 many optionally to one T6 : test
      T6 only one optionally to only one T1 : test
      T4 0+ to 1+ T6 : test
      T1 1 to 1 T3 : test
      `,
      { logLevel: 1 }
    );
    cy.get('svg');
  });
});
