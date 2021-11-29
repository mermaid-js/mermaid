import { imgSnapshotTest } from '../../helpers/util';

describe('Flowchart', () => {
  it('34: testing the label width in percy', () => {
    imgSnapshotTest(
      `graph TD
      A[Christmas]
      `,
      { theme: 'forest', fontFamily: '"Noto Sans SC", sans-serif' }
    );
  });
});
