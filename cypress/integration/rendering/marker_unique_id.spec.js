import { urlSnapshotTest } from '../../helpers/util.ts';

describe('Marker Unique IDs Per Diagram', () => {
  it('should render a blue arrow tip in second digram', () => {
    urlSnapshotTest('http://localhost:9000/marker_unique_id.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
});
