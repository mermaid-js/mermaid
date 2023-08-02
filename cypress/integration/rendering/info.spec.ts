import { imgSnapshotTest } from '../../helpers/util.js';

describe('info diagram', () => {
  it('should handle an info definition', () => {
    imgSnapshotTest(`info`);
  });

  it('should handle an info definition with showInfo', () => {
    imgSnapshotTest(`info showInfo`);
  });
});
