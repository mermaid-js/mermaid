import { urlSnapshotTest, openURLAndVerifyRendering } from '../../helpers/util.ts';

describe('Flowchart elk', () => {
  it('should use dagre as fallback', () => {
    urlSnapshotTest('http://localhost:9000/flow-elk.html', {
      name: 'flow-elk fallback to dagre',
    });
  });
  it('should allow overriding with external package', () => {
    urlSnapshotTest('http://localhost:9000/flow-elk.html?elk=true', {
      name: 'flow-elk overriding dagre with elk',
    });
  });
});
