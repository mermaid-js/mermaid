/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util';

describe('Entity Relationship Diagram', () => {
  it('should render a simple ER diagram', () => {
    imgSnapshotTest(
      `
    erDiagram
        CUSTOMER !-?< ORDER : places
        ORDER !-!< LINE-ITEM : contains
      `,
      {logLevel : 1}
    );
    cy.get('svg');
  });

  it('should render an ER diagram with a recursive relationship', () => {
    imgSnapshotTest(
      `
    erDiagram
        CUSTOMER !-?< CUSTOMER : refers
        CUSTOMER !-?< ORDER : places
        ORDER !-!< LINE-ITEM : contains
      `,
      {logLevel : 1}
    );
    cy.get('svg');
  });

  it('should render an ER diagram with multiple relationships between the same two entities', () => {
    imgSnapshotTest(
      `
    erDiagram
        CUSTOMER !-!< ADDRESS : "invoiced at"
        CUSTOMER !-!< ADDRESS : "receives goods at"
      `,
      {logLevel : 1}
    );
    cy.get('svg');
  });

  it('should render a cyclical ER diagram', () => {
    imgSnapshotTest(
      `
    erDiagram
        A !-!< B : likes
        B !-!< C : likes
        C !-!< A : likes
      `,
      {logLevel : 1}
    );
    cy.get('svg');

  });

  it('should render a not-so-simple ER diagram', () => {
    imgSnapshotTest(
      `
    erDiagram
        DELIVERY-ADDRESS !-?< ORDER : receives
        CUSTOMER >!-!< DELIVERY-ADDRESS : has
        CUSTOMER !-?< ORDER : places
        CUSTOMER !-?< INVOICE : "liable for"
        INVOICE !-!< ORDER : covers
        ORDER !-!< ORDER-ITEM : includes
        PRODUCT-CATEGORY !-!< PRODUCT : contains
        PRODUCT !-?< ORDER-ITEM : "ordered in"
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
        CUSTOMER !-?< ORDER : places
        ORDER !-!< LINE-ITEM : contains
      `,
      `
    erDiagram
        CUSTOMER !-?< ORDER : places
        ORDER !-!< LINE-ITEM : contains
      `
      ],
      {logLevel : 1}
    );
    cy.get('svg');
  });
});
