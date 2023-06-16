import { imgSnapshotTest } from '../../helpers/util.js';

describe('info diagram', () => {
  it('should handle an info definition', () => {
    imgSnapshotTest(`info`);
    cy.get('svg');
  });

  it('should handle an info definition with showInfo', () => {
    imgSnapshotTest(`info showInfo`);
    cy.get('svg');
  });
});
