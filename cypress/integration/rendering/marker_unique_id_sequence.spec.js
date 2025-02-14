import { urlSnapshotTest } from '../../helpers/util.ts';

describe('Marker Unique IDs Per Diagram', () => {
  it('Should show circles behind the sequence numbers, and three types of pointers (▶, ≻, ×)', () => {
    urlSnapshotTest('http://localhost:9000/marker_unique_id_sequence.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
});
