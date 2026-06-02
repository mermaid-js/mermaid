import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MindmapDB } from './mindmapDb.js';
import type { MindmapLayoutNode, MindmapLayoutEdge } from './mindmapDb.js';
import type { Edge } from '../../rendering-util/types.js';

// Mock the getConfig function
vi.mock('../../diagram-api/diagramAPI.js', () => ({
  getConfig: vi.fn(() => ({
    mindmap: {
      layoutAlgorithm: 'cose-bilkent',
      padding: 10,
      maxNodeWidth: 200,
      useMaxWidth: true,
    },
  })),
}));

describe('MindmapDb getData function', () => {
  let db: MindmapDB;

  beforeEach(() => {
    db = new MindmapDB();
    // Clear the database before each test
    db.clear();
  });

  describe('getData', () => {
    it('should return empty data when no mindmap is set', () => {
      const result = db.getData();

      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
      expect(result.config).toBeDefined();
      expect(result.rootNode).toBeUndefined();
    });

    it('should return structured data for simple mindmap', () => {
      // Create a simple mindmap structure
      db.addNode(0, 'root', 'Root Node', 0);
      db.addNode(1, 'child1', 'Child 1', 0);
      db.addNode(1, 'child2', 'Child 2', 0);

      const result = db.getData();

      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);
      expect(result.config).toBeDefined();
      expect(result.rootNode).toBeDefined();

      // Check root node
      const rootNode = (result.nodes as MindmapLayoutNode[]).find((n) => n.id === '0');
      expect(rootNode).toBeDefined();
      expect(rootNode?.label).toBe('Root Node');
      expect(rootNode?.level).toBe(0);

      // Check child nodes
      const child1 = (result.nodes as MindmapLayoutNode[]).find((n) => n.id === '1');
      expect(child1).toBeDefined();
      expect(child1?.label).toBe('Child 1');
      expect(child1?.level).toBe(1);

      // Check edges
      expect(result.edges).toContainEqual(
        expect.objectContaining({
          start: '0',
          end: '1',
          depth: 0,
        })
      );
    });

    it('should return structured data for hierarchical mindmap', () => {
      // Create a hierarchical mindmap structure
      db.addNode(0, 'root', 'Root Node', 0);
      db.addNode(1, 'child1', 'Child 1', 0);
      db.addNode(2, 'grandchild1', 'Grandchild 1', 0);
      db.addNode(2, 'grandchild2', 'Grandchild 2', 0);
      db.addNode(1, 'child2', 'Child 2', 0);

      const result = db.getData();

      expect(result.nodes).toHaveLength(5);
      expect(result.edges).toHaveLength(4);

      // Check that all levels are represented
      const levels = result.nodes.map((n) => (n as MindmapLayoutNode).level);
      expect(levels).toContain(0); // root
      expect(levels).toContain(1); // children
      expect(levels).toContain(2); // grandchildren

      // Check edge relationships
      const edgeRelations = result.edges.map(
        (e) => `${(e as MindmapLayoutEdge).start}->${(e as MindmapLayoutEdge).end}`
      );
      expect(edgeRelations).toContain('0->1'); // root to child1
      expect(edgeRelations).toContain('1->2'); // child1 to grandchild1
      expect(edgeRelations).toContain('1->3'); // child1 to grandchild2
      expect(edgeRelations).toContain('0->4'); // root to child2
    });

    it('should preserve node properties in processed data', () => {
      // Add a node with specific properties
      db.addNode(0, 'root', 'Root Node', 2); // type 2 = rectangle

      // Set additional properties
      const mindmap = db.getMindmap();
      if (mindmap) {
        mindmap.width = 150;
        mindmap.height = 75;
        mindmap.padding = 15;
        mindmap.section = 1;
        mindmap.class = 'custom-class';
        mindmap.icon = 'star';
      }

      const result = db.getData();

      expect(result.nodes).toHaveLength(1);
      const node = result.nodes[0] as MindmapLayoutNode;

      expect(node.type).toBe(2);
      expect(node.width).toBe(150);
      expect(node.height).toBe(75);
      expect(node.padding).toBe(15);
      expect(node.section).toBeUndefined(); // Root node has undefined section
      expect(node.cssClasses).toBe('mindmap-node section-root section--1 custom-class');
      expect(node.icon).toBe('star');
    });

    it('should generate unique edge IDs', () => {
      db.addNode(0, 'root', 'Root Node', 0);
      db.addNode(1, 'child1', 'Child 1', 0);
      db.addNode(1, 'child2', 'Child 2', 0);
      db.addNode(1, 'child3', 'Child 3', 0);

      const result = db.getData();

      const edgeIds = result.edges.map((e: Edge) => e.id);
      const uniqueIds = new Set(edgeIds);

      expect(edgeIds).toHaveLength(3);
      expect(uniqueIds.size).toBe(3); // All IDs should be unique
    });

    it('should handle nodes with missing optional properties', () => {
      db.addNode(0, 'root', 'Root Node', 0);

      const result = db.getData();
      const node = result.nodes[0] as MindmapLayoutNode;

      // Should handle undefined/missing properties gracefully
      expect(node.section).toBeUndefined(); // Root node has undefined section
      expect(node.cssClasses).toBe('mindmap-node section-root section--1'); // Root node gets special classes
      expect(node.icon).toBeUndefined();
      expect(node.x).toBeUndefined();
      expect(node.y).toBeUndefined();
    });

    it('should assign correct section classes based on sibling position', () => {
      // Create the example mindmap structure:
      // A
      //   a0
      //     aa0
      //   a1
      //     aaa
      //   a2
      db.addNode(0, 'A', 'A', 0); // Root
      db.addNode(1, 'a0', 'a0', 0); // First child of root
      db.addNode(2, 'aa0', 'aa0', 0); // Child of a0
      db.addNode(1, 'a1', 'a1', 0); // Second child of root
      db.addNode(2, 'aaa', 'aaa', 0); // Child of a1
      db.addNode(1, 'a2', 'a2', 0); // Third child of root

      const result = db.getData();

      // Find nodes by their labels
      const nodeA = result.nodes.find((n) => n.label === 'A') as MindmapLayoutNode;
      const nodeA0 = result.nodes.find((n) => n.label === 'a0') as MindmapLayoutNode;
      const nodeAa0 = result.nodes.find((n) => n.label === 'aa0') as MindmapLayoutNode;
      const nodeA1 = result.nodes.find((n) => n.label === 'a1') as MindmapLayoutNode;
      const nodeAaa = result.nodes.find((n) => n.label === 'aaa') as MindmapLayoutNode;
      const nodeA2 = result.nodes.find((n) => n.label === 'a2') as MindmapLayoutNode;

      // Check section assignments
      expect(nodeA.section).toBeUndefined(); // Root has undefined section
      expect(nodeA0.section).toBe(0); // First child of root
      expect(nodeAa0.section).toBe(0); // Inherits from parent a0
      expect(nodeA1.section).toBe(1); // Second child of root
      expect(nodeAaa.section).toBe(1); // Inherits from parent a1
      expect(nodeA2.section).toBe(2); // Third child of root

      // Check CSS classes
      expect(nodeA.cssClasses).toBe('mindmap-node section-root section--1');
      expect(nodeA0.cssClasses).toBe('mindmap-node section-0');
      expect(nodeAa0.cssClasses).toBe('mindmap-node section-0');
      expect(nodeA1.cssClasses).toBe('mindmap-node section-1');
      expect(nodeAaa.cssClasses).toBe('mindmap-node section-1');
      expect(nodeA2.cssClasses).toBe('mindmap-node section-2');
    });

    it('should preserve custom classes while adding section classes', () => {
      db.addNode(0, 'root', 'Root Node', 0);
      db.addNode(1, 'child', 'Child Node', 0);

      // Add custom classes to nodes
      const mindmap = db.getMindmap();
      if (mindmap) {
        mindmap.class = 'custom-root-class';
        if (mindmap.children?.[0]) {
          mindmap.children[0].class = 'custom-child-class';
        }
      }

      const result = db.getData();
      const rootNode = result.nodes.find((n) => n.label === 'Root Node') as MindmapLayoutNode;
      const childNode = result.nodes.find((n) => n.label === 'Child Node') as MindmapLayoutNode;

      // Should include both section classes and custom classes
      expect(rootNode.cssClasses).toBe('mindmap-node section-root section--1 custom-root-class');
      expect(childNode.cssClasses).toBe('mindmap-node section-0 custom-child-class');
    });

    it('should not create any fake root nodes', () => {
      // Create a simple mindmap
      db.addNode(0, 'A', 'A', 0);
      db.addNode(1, 'a0', 'a0', 0);
      db.addNode(1, 'a1', 'a1', 0);

      const result = db.getData();

      // Check that we only have the expected nodes
      expect(result.nodes).toHaveLength(3);
      expect(result.nodes.map((n) => n.label)).toEqual(['A', 'a0', 'a1']);

      // Check that there's no node with label "mindmap" or any other fake root
      const mindmapNode = result.nodes.find((n) => n.label === 'mindmap');
      expect(mindmapNode).toBeUndefined();

      // Verify the root node has the correct classes
      const rootNode = result.nodes.find((n) => n.label === 'A') as MindmapLayoutNode;
      expect(rootNode.cssClasses).toBe('mindmap-node section-root section--1');
      expect(rootNode.level).toBe(0);
    });

    it('should assign correct section classes to edges', () => {
      // Create the example mindmap structure:
      // A
      //   a0
      //     aa0
      //   a1
      //     aaa
      //   a2
      db.addNode(0, 'A', 'A', 0); // Root
      db.addNode(1, 'a0', 'a0', 0); // First child of root
      db.addNode(2, 'aa0', 'aa0', 0); // Child of a0
      db.addNode(1, 'a1', 'a1', 0); // Second child of root
      db.addNode(2, 'aaa', 'aaa', 0); // Child of a1
      db.addNode(1, 'a2', 'a2', 0); // Third child of root

      const result = db.getData();

      // Should have 5 edges: A->a0, a0->aa0, A->a1, a1->aaa, A->a2
      expect(result.edges).toHaveLength(5);

      // Find edges by their start and end nodes
      const edgeA_a0 = result.edges.find(
        (e) => e.start === '0' && e.end === '1'
      ) as MindmapLayoutEdge;
      const edgeA0_aa0 = result.edges.find(
        (e) => e.start === '1' && e.end === '2'
      ) as MindmapLayoutEdge;
      const edgeA_a1 = result.edges.find(
        (e) => e.start === '0' && e.end === '3'
      ) as MindmapLayoutEdge;
      const edgeA1_aaa = result.edges.find(
        (e) => e.start === '3' && e.end === '4'
      ) as MindmapLayoutEdge;
      const edgeA_a2 = result.edges.find(
        (e) => e.start === '0' && e.end === '5'
      ) as MindmapLayoutEdge;

      // Check edge classes
      expect(edgeA_a0.classes).toBe('edge section-edge-0 edge-depth-1'); // A->a0: section-0, depth-1
      expect(edgeA0_aa0.classes).toBe('edge section-edge-0 edge-depth-2'); // a0->aa0: section-0, depth-2
      expect(edgeA_a1.classes).toBe('edge section-edge-1 edge-depth-1'); // A->a1: section-1, depth-1
      expect(edgeA1_aaa.classes).toBe('edge section-edge-1 edge-depth-2'); // a1->aaa: section-1, depth-2
      expect(edgeA_a2.classes).toBe('edge section-edge-2 edge-depth-1'); // A->a2: section-2, depth-1

      // Check section assignments match the child nodes
      expect(edgeA_a0.section).toBe(0);
      expect(edgeA0_aa0.section).toBe(0);
      expect(edgeA_a1.section).toBe(1);
      expect(edgeA1_aaa.section).toBe(1);
      expect(edgeA_a2.section).toBe(2);
    });

    it('should wrap section numbers when there are more than 11 level 2 nodes', () => {
      db.addNode(0, 'root', 'Example', 0);

      for (let i = 1; i <= 15; i++) {
        db.addNode(1, `child${i}`, `${i}`, 0);
      }

      const result = db.getData();

      expect(result.nodes).toHaveLength(16);

      const child1 = result.nodes.find((n) => n.label === '1') as MindmapLayoutNode;
      const child11 = result.nodes.find((n) => n.label === '11') as MindmapLayoutNode;
      const child12 = result.nodes.find((n) => n.label === '12') as MindmapLayoutNode;
      const child13 = result.nodes.find((n) => n.label === '13') as MindmapLayoutNode;
      const child14 = result.nodes.find((n) => n.label === '14') as MindmapLayoutNode;
      const child15 = result.nodes.find((n) => n.label === '15') as MindmapLayoutNode;

      expect(child1.section).toBe(0);
      expect(child11.section).toBe(10);

      expect(child12.section).toBe(0);
      expect(child13.section).toBe(1);
      expect(child14.section).toBe(2);
      expect(child15.section).toBe(3);

      expect(child12.cssClasses).toBe('mindmap-node section-0');
      expect(child13.cssClasses).toBe('mindmap-node section-1');
      expect(child14.cssClasses).toBe('mindmap-node section-2');
      expect(child15.cssClasses).toBe('mindmap-node section-3');
    });
  });
});
