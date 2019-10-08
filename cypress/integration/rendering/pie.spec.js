/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util.js';

describe('Pie Chart', () => {
  it('should render a simple pie diagram', () => {
    imgSnapshotTest(
      `
    pie title Sports in Sweden
       "Bandy" : 40
       "Ice-Hockey" : 80
       "Football" : 90
      `,
      {}
    );
  });
});
