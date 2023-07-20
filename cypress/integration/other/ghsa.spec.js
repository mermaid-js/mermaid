import { urlSnapshotTest, openUrlAndVerifyRendering } from '../../helpers/util.ts';

describe('CSS injections', () => {
  it('should not allow CSS injections outside of the diagram', () => {
    urlSnapshotTest('http://localhost:9000/ghsa1.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
  it('should not allow adding styletags affecting the page', () => {
    urlSnapshotTest('http://localhost:9000/ghsa3.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
  it('should not allow manipulating styletags using arrowheads', () => {
    openUrlAndVerifyRendering('http://localhost:9000/xss23-css.html', {
      logLevel: 1,
      arrowMarkerAbsolute: false,
      flowchart: { htmlLabels: true },
    });
  });
});
