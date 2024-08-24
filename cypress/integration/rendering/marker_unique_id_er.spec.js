import { urlSnapshotTest } from '../../helpers/util.ts';

describe('Marker Unique IDs Per Diagram', () => {
  it('Should show a marker on each end of each link', () => {
    urlSnapshotTest('http://localhost:9000/marker_unique_id_er.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
});
