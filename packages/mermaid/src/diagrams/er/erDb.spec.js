import { ErDB } from './erDb.js';

describe('ErDB subgraph behavior', () => {
  let db;

  beforeEach(() => {
    db = new ErDB();
    db.clear();
  });

  describe('add subgraph', () => {
    it('adds subgraphs and returns provided id, title and nodes', () => {
      const id = db.addSubGraph({ text: 'sub1' }, ['A', 'B'], { text: 'Group One', type: 'text' });
      const subgraphs = db.getSubGraphs();

      expect(id).toBe('sub1');
      expect(subgraphs.length).toBe(1);
      expect(subgraphs[0].id).toBe('sub1');
      expect(subgraphs[0].title).toBe('Group One');
      expect(subgraphs[0].nodes).toEqual(['A', 'B']);
    });

    it('handles subgraph without explicit title fallback', () => {
      db.addSubGraph({ text: 'sub1' }, ['A'], { text: '', type: 'text' });
      const subgraphs = db.getSubGraphs()[0];

      expect(subgraphs.id).toBe('sub1');
      expect(subgraphs.title).toBe('');
    });
  });

  describe('makeUniq behavior', () => {
    it('prevents nodes from being added to subsequent subgraphs if already present', () => {
      db.addSubGraph({ text: 'sub1' }, ['A', 'B'], { text: 'sub1', type: 'text' });
      db.addSubGraph({ text: 'sub2' }, ['A', 'C'], { text: 'sub2', type: 'text' });
      const subgraphs = db.getSubGraphs();

      expect(subgraphs.length).toBe(2);
      // sub2 should not contain 'A' because it was already in sub1
      expect(subgraphs[1].nodes).toContain('C');
      expect(subgraphs[1].nodes).not.toContain('A');
    });

    it('allows full removal if all nodes already exist elsewhere', () => {
      db.addSubGraph({ text: 'sub1' }, ['A'], { text: 'sub1', type: 'text' });
      db.addSubGraph({ text: 'sub2' }, ['A'], { text: 'sub2', type: 'text' });
      const sub2 = db.getSubGraphs().find((s) => s.id === 'sub2');

      expect(sub2.nodes).toEqual([]);
    });
  });

  describe('relationship behavior', () => {
    it('stores relationships with subgraph id when entity is a subgraph', () => {
      db.addSubGraph({ text: 'sub1' }, ['X'], { text: 'sub1', type: 'text' });
      const relSpec = { cardA: 'ONLY_ONE', relType: 'IDENTIFYING', cardB: 'ZERO_OR_ONE' };
      db.addRelationship('sub1', 'roleA', 'Y', relSpec);
      const relationships = db.getRelationships();

      expect(relationships.length).toBe(1);
      expect(relationships[0].entityA).toBe('sub1');
      expect(db.getEntity('Y')).toBeDefined();
      expect(relationships[0].entityB).toBe(db.getEntity('Y').id);
    });
  });

  describe('getData cluster behavior', () => {
    it('returns nested cluster nodes with correct parent relationships', () => {
      const outerId = db.addSubGraph({ text: 'sub1' }, ['sub1_1', 'A'], {
        text: 'Group One',
        type: 'text',
      });
      const innerId = db.addSubGraph({ text: 'sub1_1' }, ['B'], {
        text: 'Group Two',
        type: 'text',
      });

      db.addEntity('A');
      db.addEntity('B');

      const data = db.getData();
      const outerCluster = data.nodes.find((node) => node.id === outerId);
      const innerCluster = data.nodes.find((node) => node.id === innerId);
      const customerNode = data.nodes.find((node) => node.label === 'A');
      const accountNode = data.nodes.find((node) => node.label === 'B');

      expect(data.nodes).toHaveLength(4);
      expect(outerCluster).toBeDefined();
      expect(innerCluster).toBeDefined();
      expect(outerCluster.isGroup).toBe(true);
      expect(innerCluster.isGroup).toBe(true);
      expect(outerCluster.label).toBe('Group One');
      expect(innerCluster.label).toBe('Group Two');
      expect(innerCluster.parentId).toBe(outerId);
      expect(customerNode.parentId).toBe(outerId);
      expect(customerNode.isGroup).toBe(false);
      expect(accountNode.parentId).toBe(innerId);
      expect(accountNode.isGroup).toBe(false);
    });

    it('returns edges connected to subgraphs', () => {
      db.addSubGraph({ text: 'sub1' }, ['A'], { text: 'Group One', type: 'text' });

      db.addEntity('A');
      db.addEntity('B');

      const relSpec = { cardA: 'ONLY_ONE', relType: 'IDENTIFYING', cardB: 'ZERO_OR_MORE' };
      db.addRelationship('sub1', 'roleA', 'B', relSpec);

      const data = db.getData();

      expect(data.edges).toHaveLength(1);
      expect(data.edges[0].start).toBe('sub1');
      expect(data.edges[0].end).toBe(db.getEntity('B').id);
    });
  });

  describe('CssStyles and classes behavior', () => {
    it('applies classes and styles to subgraphs', () => {
      db.addSubGraph({ text: 'sub1' }, ['A'], { text: 'sub1', type: 'text' });
      db.setClass(['sub1'], ['B']);
      db.addCssStyles(['sub1'], ['fill:red']);
      const subgraphs = db.getSubGraphs();

      expect(subgraphs.length).toBe(1);
      expect(subgraphs[0].classes).toContain('B');
      expect(subgraphs[0].cssStyles).toContain('fill:red');
    });
  });
});
