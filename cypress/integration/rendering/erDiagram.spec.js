/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util';

describe('Entity Relationship Diagram', () => {
  it('should render a simple ER diagram', () => {
    imgSnapshotTest(
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      {logLevel : 1}
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
      {logLevel : 1}
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
      {logLevel : 1}
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
      {logLevel : 1}
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
      {logLevel : 1}
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
      `
      ],
      {logLevel : 1}
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
      {logLevel : 1}
    );
    cy.get('svg');
  });
});
