import { urlSnapshotTest } from '../../helpers/util.ts';

describe('Hand Draw', () => {
  it('should render the hand drawn look for all diagrams', () => {
    urlSnapshotTest('http://localhost:9000/handDrawn.html', {
      logLevel: 1,
    });
  });
});
