import { urlSnapshotTest } from '../../helpers/util.ts';

describe('mermaid', () => {
  describe('registerDiagram', () => {
    it('should work on @mermaid-js/mermaid-example-diagram', () => {
      const url = '/external-diagrams-example-diagram.html';
      urlSnapshotTest(url, {}, false, false);
    });
  });
});
