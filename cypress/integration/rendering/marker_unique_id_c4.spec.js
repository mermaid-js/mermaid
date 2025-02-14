import { urlSnapshotTest } from '../../helpers/util.ts';

describe('Marker Unique IDs Per Diagram', () => {
  it('Should show an arrow on each and of the link', () => {
    urlSnapshotTest('http://localhost:9000/marker_unique_id_c4.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
});
