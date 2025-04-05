import { urlSnapshotTest } from '../../helpers/util.ts';

describe.skip('Examples', () => {
  it('should render all examples', () => {
    urlSnapshotTest('http://localhost:9000/examples.html');
  });
});
