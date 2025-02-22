import { urlSnapshotTest } from '../../helpers/util.ts';

describe('Marker Unique IDs Per Diagram', () => {
  it('Should show the arrow pointers (pointing right and down)', () => {
    urlSnapshotTest('http://localhost:9000/marker_unique_id_timeline.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
});
