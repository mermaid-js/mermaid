import { urlSnapshotTest } from '../../helpers/util.ts';

describe('Marker Unique IDs Per Diagram', () => {
  it('Should show the arrow pointer (pointing right)', () => {
    urlSnapshotTest('http://localhost:9000/marker_unique_id_journey.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
});
