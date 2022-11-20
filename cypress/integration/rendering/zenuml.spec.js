import { imgSnapshotTest } from '../../helpers/util.js';

describe('Zen UML', () => {
  it('Only a Zen UML container with loaded css', () => {
    imgSnapshotTest(`zenuml`, {});
    cy.get('link[href="./style.css"]').should('exist');
    cy.get('.zenuml').should('exist');
  });

  it('Basic Zen UML diagram', () => {
    imgSnapshotTest(
      `
    zenuml
			A.method() {
        if(x) {
          B.method() {
            selfCall() { return X }
          }
        }
      }
    `,
      {}
    );
  });
});
