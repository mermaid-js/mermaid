import { urlSnapshotTest } from '../../helpers/util.ts';

describe('mermaid', () => {
  describe('registerDiagram', () => {
    it('should work on @mermaid-js/mermaid-example-diagram', () => {
      const url = 'http://localhost:9000/external-diagrams-example-diagram.html';
      urlSnapshotTest(url, {}, false, false);
    });
  });
});
