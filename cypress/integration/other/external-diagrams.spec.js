import { urlSnapshotTest } from '../../helpers/util';

describe('mermaid', () => {
  describe('registerDiagram', () => {
    it('should work on @mermaid-js/mermaid-mindmap and mermaid-example-diagram', () => {
      const url = 'http://localhost:9000/external-diagrams-mindmap.html';
      urlSnapshotTest(url, {}, false, false);
    });
  });
});
