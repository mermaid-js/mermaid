import { urlSnapshotTest, openURLAndVerifyRendering } from '../../helpers/util.ts';

describe('CSS injections', () => {
  it('should not allow CSS injections outside of the diagram', () => {
    urlSnapshotTest('/ghsa1.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
  it('should not allow adding styletags affecting the page', () => {
    urlSnapshotTest('/ghsa3.html', {
      logLevel: 1,
      flowchart: { htmlLabels: false },
    });
  });
  it('should not allow manipulating styletags using arrowheads', () => {
    openURLAndVerifyRendering('/xss23-css.html', {
      logLevel: 1,
      arrowMarkerAbsolute: false,
      flowchart: { htmlLabels: true },
    });
  });
});
