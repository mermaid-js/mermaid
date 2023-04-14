import flowDb from './flowDb.js';

describe('flow db subgraphs', () => {
  let subgraphs;
  beforeEach(() => {
    subgraphs = [
      { nodes: ['a', 'b', 'c', 'e'] },
      { nodes: ['f', 'g', 'h'] },
      { nodes: ['i', 'j'] },
      { nodes: ['k'] },
    ];
  });
  describe('exist', () => {
    it('should return true when the is exists in a subgraph', () => {
      expect(flowDb.exists(subgraphs, 'a')).toBe(true);
      expect(flowDb.exists(subgraphs, 'h')).toBe(true);
      expect(flowDb.exists(subgraphs, 'j')).toBe(true);
      expect(flowDb.exists(subgraphs, 'k')).toBe(true);
    });
    it('should return false when the is exists in a subgraph', () => {
      expect(flowDb.exists(subgraphs, 'a2')).toBe(false);
      expect(flowDb.exists(subgraphs, 'l')).toBe(false);
    });
  });

  describe('makeUniq', () => {
    it('should remove ids from sungraph that already exists in another subgraph even if it gets empty', () => {
      const subgraph = flowDb.makeUniq({ nodes: ['i', 'j'] }, subgraphs);

      expect(subgraph.nodes).toEqual([]);
    });
    it('should remove ids from sungraph that already exists in another subgraph', () => {
      const subgraph = flowDb.makeUniq({ nodes: ['i', 'j', 'o'] }, subgraphs);

      expect(subgraph.nodes).toEqual(['o']);
    });
    it('should not remove ids from subgraph if they are unique', () => {
      const subgraph = flowDb.makeUniq({ nodes: ['q', 'r', 's'] }, subgraphs);

      expect(subgraph.nodes).toEqual(['q', 'r', 's']);
    });
  });
});
