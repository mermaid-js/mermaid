import { urlSnapshotTest } from '../../helpers/util.ts';

describe('Marker Unique IDs Per Diagram', () => {
  it('Should show an arrow and a cross markers on the links', () => {
    urlSnapshotTest('http://localhost:9000/marker_unique_id_requirement.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
});
