/* eslint-env jest */
import { imgSnapshotTest, renderGraph } from '../../helpers/util';

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

  it('should render an ER diagrams when useMaxWidth is true (default)', () => {
    renderGraph(
      `
    erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
      `,
      { er: { useMaxWidth: true } }
    );
    cy.get('svg')
      .should((svg) => {
        expect(svg).to.have.attr('width', '100%');
        expect(svg).to.have.attr('height', '465');
        const style = svg.attr('style');
        expect(style).to.match(/^max-width: [\d.]+px;$/);
        const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
        // use within because the absolute value can be slightly different depending on the environment ±5%
        expect(maxWidthValue).to.be.within(140 * .95, 140 * 1.05);
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
    cy.get('svg')
      .should((svg) => {
        const width = parseFloat(svg.attr('width'));
        // use within because the absolute value can be slightly different depending on the environment ±5%
        expect(width).to.be.within(140 * .95, 140 * 1.05);
        expect(svg).to.have.attr('height', '465');
        expect(svg).to.not.have.attr('style');
      });
  });
});
