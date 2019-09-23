/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util.js';

describe('Sequencediagram', () => {
  it('should render a simple info diagrams', () => {
    imgSnapshotTest(
      `
    info
       showInfo
      `,
      {}
    );
  });
});
