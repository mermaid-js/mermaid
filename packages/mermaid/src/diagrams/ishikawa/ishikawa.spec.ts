import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { layoutFishbone, renderer } from './ishikawaRenderer.js';
import type { IshikawaNode } from './ishikawaTypes.js';
import { IshikawaDB } from './ishikawaDb.js';
import { drawNode, positionNode } from './svgDraw.js';
import getStyles from './styles.js';
import detector from './detector.js';
import { select } from 'd3';

let db: IshikawaDB;

beforeEach(() => {
  addDiagrams();
  db = new IshikawaDB();
  db.clear();
});

describe('Ishikawa Diagram', () => {
  it('should detect ishikawa diagram', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Customer complaints increasing"
      category "People"
        "Lack of training"
        "Poor communication"
      category "Process"
        "Inefficient workflow"
        "Missing procedures"
      category "Equipment"
        "Outdated tools"
        "Maintenance issues"
    `);

    expect(diagram.type).toBe('ishikawa-beta');
  });

  it('should parse problem statement', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Customer complaints increasing"
    `);

    const db = diagram.db as any;
    expect(db.getProblemStatement()).toBe('Customer complaints increasing');
  });

  it('should parse categories', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Customer complaints increasing"
      category "People"
      category "Process"
      category "Equipment"
    `);

    const db = diagram.db as any;
    const categories = db.getCategories();
    expect(categories).toContain('People');
    expect(categories).toContain('Process');
    expect(categories).toContain('Equipment');
  });

  it('should parse nodes with different shapes', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Customer complaints increasing"
      category "People"
        [Lack of training]
        (Poor communication)
        ((Inadequate supervision))
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    expect(root).toBeDefined();
    expect(root.children).toHaveLength(1);
    expect(root.children[0].description).toBe('People');
    expect(root.children[0].children).toHaveLength(3);
  });

  it('should handle complex fishbone structure', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Product quality issues"
      category "Materials"
        "Poor quality raw materials"
        "Inconsistent suppliers"
      category "Methods"
        "Outdated procedures"
        "Lack of standardization"
      category "Machines"
        "Equipment breakdowns"
        "Inadequate maintenance"
      category "Environment"
        "Temperature fluctuations"
        "Humidity issues"
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    expect(root.description).toBe('Product quality issues');
    expect(root.children).toHaveLength(4);

    const categories = db.getCategories();
    expect(categories).toContain('Materials');
    expect(categories).toContain('Methods');
    expect(categories).toContain('Machines');
    expect(categories).toContain('Environment');
  });

  // Additional comprehensive tests
  it('should handle all node shape types', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Test all shapes"
      category "Shapes"
        "Default shape"
        [Square shape]
        (Rounded square)
        ((Circle shape))
        )Cloud shape(
        ))Bang shape((
        {{Hexagon shape}}
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    const shapeNode = root.children[0];
    expect(shapeNode.children).toHaveLength(7);

    // Check node types
    expect(db.type2Str(shapeNode.children[0].type)).toBe('no-border');
    expect(db.type2Str(shapeNode.children[1].type)).toBe('rect');
    expect(db.type2Str(shapeNode.children[2].type)).toBe('rounded-rect');
    expect(db.type2Str(shapeNode.children[3].type)).toBe('circle');
    expect(db.type2Str(shapeNode.children[4].type)).toBe('cloud');
    expect(db.type2Str(shapeNode.children[5].type)).toBe('bang');
    expect(db.type2Str(shapeNode.children[6].type)).toBe('hexagon');
  });

  it('should handle nodes with IDs and descriptions', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Test with IDs"
      category "People"
        training "Lack of training"
        communication "Poor communication"
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    const peopleNode = root.children[0];
    expect(peopleNode.children).toHaveLength(2);
    expect(peopleNode.children[0].nodeId).toBe('training');
    expect(peopleNode.children[0].description).toBe('Lack of training');
    expect(peopleNode.children[1].nodeId).toBe('communication');
    expect(peopleNode.children[1].description).toBe('Poor communication');
  });

  it('should handle empty categories', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Test empty categories"
      category "Empty Category"
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    expect(root.children).toHaveLength(1);
    expect(root.children[0].description).toBe('Empty Category');
    expect(root.children[0].children).toHaveLength(0);
  });

  it('should handle comments', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      %% This is a comment
      problem "Test with comments"
      %% Another comment
      category "People"
        "Lack of training"
        %% Inline comment
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    expect(root.description).toBe('Test with comments');
    expect(root.children).toHaveLength(1);
    expect(root.children[0].children).toHaveLength(1);
  });

  it('should handle special characters in text', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Test with special chars: & < > '"
      category "Special"
        "Node with & < > ' chars"
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    expect(root.description).toBe("Test with special chars: &amp; &lt; &gt; '");
    expect(root.children[0].children[0].description).toBe("Node with &amp; &lt; &gt; ' chars");
  });

  it('should handle multiline problem statements', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Multiline
      problem statement"
      category "Test"
        "Simple node"
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    expect(root.description).toBe('Multiline\n      problem statement');
  });

  it('should handle whitespace variations', async () => {
    const diagram = await Diagram.fromText(`
ishikawa
problem "Minimal whitespace"
category "People"
  "Lack of training"
  "Poor communication"
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    expect(root.description).toBe('Minimal whitespace');
    expect(root.children).toHaveLength(1);
    expect(root.children[0].children).toHaveLength(2);
  });

  it('should handle multiple categories with same name', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Test duplicate categories"
      category "People"
        "Training issue"
      category "People"
        "Communication issue"
    `);

    const db = diagram.db as any;
    const categories = db.getCategories();
    expect(categories).toContain('People');
    expect(categories.filter((c: string) => c === 'People')).toHaveLength(1); // Should deduplicate

    const root = db.getIshikawa();
    expect(root.children).toHaveLength(2); // But nodes should be separate
  });

  it('should handle nodes with class decorations', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Test with classes"
      category "People"
        "Lack of training"
        :::error
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    const peopleNode = root.children[0];
    expect(peopleNode.children).toHaveLength(1);
    expect(peopleNode.children[0].class).toBe('error');
  });

  it('should handle nodes with icon decorations', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Test with icons"
      category "People"
        "Lack of training"
        ::icon(fa:fa-user)
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    const peopleNode = root.children[0];
    expect(peopleNode.children).toHaveLength(1);
    expect(peopleNode.children[0].icon).toBe('fa:fa-user');
  });

  it('should handle deep nesting', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Test deep nesting"
      category "Level 1"
        "Level 2"
          "Level 3"
            "Level 4"
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    expect(root.children).toHaveLength(1);
    expect(root.children[0].children).toHaveLength(1);
    expect(root.children[0].children[0].children).toHaveLength(1);
    expect(root.children[0].children[0].children[0].children).toHaveLength(1);
  });

  it('should handle mixed indentation styles', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Test mixed indentation"
      category "People"
        "Node 1"
          "Node 2"
        "Node 3"
          "Node 4"
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    const peopleNode = root.children[0];
    expect(peopleNode.children).toHaveLength(2);
    expect(peopleNode.children[0].children).toHaveLength(1);
    expect(peopleNode.children[1].children).toHaveLength(1);
  });

  it('should handle empty problem statement', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem ""
      category "Test"
        "Simple node"
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    expect(root.description).toBe('');
  });

  it('should handle problem statement with quotes', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Problem with \\"quotes\\" inside"
      category "Test"
        "Simple node"
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();
    expect(root.description).toBe('Problem with "quotes" inside');
  });

  it('should handle category names with special characters', async () => {
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Test special category names"
      category "People & Process"
      category "Materials/Supplies"
      category "Equipment (Tools)"
    `);

    const db = diagram.db as any;
    const categories = db.getCategories();
    expect(categories).toContain('People & Process');
    expect(categories).toContain('Materials/Supplies');
    expect(categories).toContain('Equipment (Tools)');
  });

  // Test case to reproduce the specific error
  it('should handle incorrect syntax gracefully', async () => {
    // This test reproduces the error: "ishikawaproblem" instead of "ishikawa problem"
    // cspell:ignore ishikawaproblem
    const incorrectSyntax = `
      ishikawaproblem "Software bugs in production"
      category "People"
        "Lack of training"
    `;

    // This should throw a parse error with a clear message
    await expect(Diagram.fromText(incorrectSyntax)).rejects.toThrow();
  });

  it('should provide helpful error message for incorrect syntax', async () => {
    // cspell:ignore ishikawaproblem
    const incorrectSyntax = `
      ishikawaproblem "Customer complaint"
      category "People"
        "Lack of training"
    `;

    await expect(Diagram.fromText(incorrectSyntax)).rejects.toThrow(/Parse error/);
  });

  it('should calculate different distances for causes with different sub-cause counts', async () => {
    // Create a test diagram with causes having different numbers of sub-causes
    const diagram = await Diagram.fromText(`
      ishikawa
      problem "Test distance calculation"
      category "Testing"
        cause1 "Cause with 2 sub-causes"
          "Sub-cause 1"
          "Sub-cause 2"
        cause2 "Cause with 8 sub-causes"
          "Sub-cause 1"
          "Sub-cause 2"
          "Sub-cause 3"
          "Sub-cause 4"
          "Sub-cause 5"
          "Sub-cause 6"
          "Sub-cause 7"
          "Sub-cause 8"
    `);

    const db = diagram.db as any;
    const root = db.getIshikawa();

    // Get the category and its causes
    const category = root.children[0];
    expect(category.description).toBe('Testing');
    expect(category.children).toHaveLength(2);

    const cause1 = category.children[0];
    const cause2 = category.children[1];

    // Verify sub-cause counts
    expect(cause1.children).toHaveLength(2); // 2 sub-causes
    expect(cause2.children).toHaveLength(8); // 8 sub-causes

    // Test the layout function to get positioned nodes
    const { nodes } = layoutFishbone(root, {});

    // Find the positioned cause nodes
    const positionedCause1 = nodes.find((node: any) => node.id === cause1.id);
    const positionedCause2 = nodes.find((node: any) => node.id === cause2.id);

    expect(positionedCause1).toBeDefined();
    expect(positionedCause2).toBeDefined();
    expect(positionedCause1?.x).toBeDefined();
    expect(positionedCause1?.y).toBeDefined();
    expect(positionedCause2?.x).toBeDefined();
    expect(positionedCause2?.y).toBeDefined();

    // Calculate distances from spine (spine is at x=100, y=400)
    const spineX = 100;
    const spineY = 400;

    // Type guard to ensure nodes are defined
    if (
      !positionedCause1 ||
      !positionedCause2 ||
      positionedCause1.x === undefined ||
      positionedCause1.y === undefined ||
      positionedCause2.x === undefined ||
      positionedCause2.y === undefined
    ) {
      throw new Error('Positioned nodes not found or missing coordinates');
    }

    const distance1 = Math.sqrt(
      Math.pow(positionedCause1.x - spineX, 2) + Math.pow(positionedCause1.y - spineY, 2)
    );

    const distance2 = Math.sqrt(
      Math.pow(positionedCause2.x - spineX, 2) + Math.pow(positionedCause2.y - spineY, 2)
    );

    // The cause with fewer sub-causes (cause1: 2 sub-causes) should be positioned closer to the spine
    // than the cause with more sub-causes (cause2: 8 sub-causes)
    expect(distance1).toBeLessThan(distance2);

    // Both causes should have different distances (they should not be the same)
    expect(distance1).not.toBeCloseTo(distance2, -1);
  });

  describe('ishikawaDb', () => {
    describe('clear', () => {
      it('should clear all data', () => {
        db.addNode(0, 'problem', 'Test problem', db.nodeType.DEFAULT);
        db.addCategory('Test Category');
        expect(db.getIshikawa()).toBeTruthy();
        expect(db.getCategories().length).toBeGreaterThan(0);

        db.clear();

        expect(db.getIshikawa()).toBeNull();
        expect(db.getCategories()).toHaveLength(0);
      });
    });

    describe('getParent', () => {
      it('should return parent node for level 1', () => {
        db.addNode(0, 'problem', 'Root', db.nodeType.DEFAULT);
        db.addNode(1, 'category', 'Category', db.nodeType.DEFAULT);
        const parent = (db as any).getParent(2);
        expect(parent).toBeTruthy();
        expect(parent.level).toBe(1);
      });

      it('should return null when no parent exists', () => {
        db.clear();
        const parent = (db as any).getParent(0);
        expect(parent).toBeNull();
      });
    });

    describe('setProblemStatement', () => {
      it('should set problem statement and create root node', () => {
        db.clear();
        db.setProblemStatement('New Problem');
        expect(db.getProblemStatement()).toBe('New Problem');
        expect(db.getIshikawa()).toBeTruthy();
        expect(db.getIshikawa()?.description).toBe('New Problem');
      });

      it('should update existing root node', () => {
        db.clear();
        db.addNode(0, 'problem', 'Old Problem', db.nodeType.DEFAULT);
        db.setProblemStatement('Updated Problem');
        expect(db.getProblemStatement()).toBe('Updated Problem');
      });
    });

    describe('addCategory', () => {
      it('should add category to list', () => {
        db.clear();
        db.setProblemStatement('Test');
        const category = db.addCategory('New Category');
        expect(category).toBe('New Category');
        expect(db.getCategories()).toContain('New Category');
      });

      it('should not add duplicate categories', () => {
        db.clear();
        db.setProblemStatement('Test');
        db.addCategory('Category');
        db.addCategory('Category');
        expect(db.getCategories().filter((c) => c === 'Category')).toHaveLength(1);
      });
    });

    describe('addNode', () => {
      it('should add root node when nodes array is empty', () => {
        db.clear();
        db.addNode(0, 'problem', 'Root', db.nodeType.DEFAULT);
        const root = db.getIshikawa();
        expect(root).toBeTruthy();
        expect(root?.level).toBe(0);
        expect(root?.description).toBe('Root');
      });

      it('should add child node to parent', () => {
        db.clear();
        db.addNode(0, 'problem', 'Root', db.nodeType.DEFAULT);
        db.addNode(1, 'category', 'Category', db.nodeType.DEFAULT);
        const root = db.getIshikawa();
        expect(root?.children).toHaveLength(1);
        expect(root?.children[0].description).toBe('Category');
      });

      it('should throw error when trying to add second root', () => {
        db.clear();
        db.addNode(0, 'problem', 'Root 1', db.nodeType.DEFAULT);
        expect(() => {
          db.addNode(0, 'problem', 'Root 2', db.nodeType.DEFAULT);
        }).toThrow('There can be only one root');
      });

      it('should apply padding for specific node types', () => {
        db.clear();
        db.addNode(0, 'problem', 'Root', db.nodeType.DEFAULT);
        db.addNode(1, 'category', 'Rect', db.nodeType.RECT);
        db.addNode(1, 'category', 'Rounded', db.nodeType.ROUNDED_RECT);
        db.addNode(1, 'category', 'Hexagon', db.nodeType.HEXAGON);

        const root = db.getIshikawa();
        const rectNode = root?.children.find((c) => c.description === 'Rect');
        const roundedNode = root?.children.find((c) => c.description === 'Rounded');
        const hexagonNode = root?.children.find((c) => c.description === 'Hexagon');

        expect(rectNode?.padding).toBeGreaterThan(root?.padding ?? 0);
        expect(roundedNode?.padding).toBeGreaterThan(root?.padding ?? 0);
        expect(hexagonNode?.padding).toBeGreaterThan(root?.padding ?? 0);
      });
    });

    describe('getType', () => {
      it('should return RECT for [', () => {
        expect(db.getType('[', ']')).toBe(db.nodeType.RECT);
      });

      it('should return ROUNDED_RECT for ( )', () => {
        expect(db.getType('(', ')')).toBe(db.nodeType.ROUNDED_RECT);
      });

      it('should return CLOUD for ( without )', () => {
        expect(db.getType('(', ']')).toBe(db.nodeType.CLOUD);
      });

      it('should return CIRCLE for ((', () => {
        expect(db.getType('((', '))')).toBe(db.nodeType.CIRCLE);
      });

      it('should return CLOUD for )', () => {
        expect(db.getType(')', '(')).toBe(db.nodeType.CLOUD);
      });

      it('should return BANG for ))', () => {
        expect(db.getType('))', '((')).toBe(db.nodeType.BANG);
      });

      it('should return HEXAGON for {{', () => {
        expect(db.getType('{{', '}}')).toBe(db.nodeType.HEXAGON);
      });

      it('should return DEFAULT for unknown', () => {
        expect(db.getType('unknown', '')).toBe(db.nodeType.DEFAULT);
      });
    });

    describe('setElementForNodeId and getElementByNodeId', () => {
      it('should store and retrieve element by node id', () => {
        const mockElement = { test: 'element' } as any;
        db.setElementForNodeId(1, mockElement);
        const retrieved = db.getElementByNodeId(1);
        expect(retrieved).toBe(mockElement);
      });

      it('should return undefined for non-existent node id', () => {
        const retrieved = db.getElementByNodeId(999);
        expect(retrieved).toBeUndefined();
      });
    });

    describe('decorateNode', () => {
      it('should add icon to last node', () => {
        db.clear();
        db.addNode(0, 'problem', 'Root', db.nodeType.DEFAULT);
        db.decorateNode({ icon: 'fa:fa-user' });
        const root = db.getIshikawa();
        expect(root?.icon).toBe('fa:fa-user');
      });

      it('should add class to last node', () => {
        db.clear();
        db.addNode(0, 'problem', 'Root', db.nodeType.DEFAULT);
        db.decorateNode({ class: 'error' });
        const root = db.getIshikawa();
        expect(root?.class).toBe('error');
      });

      it('should add both icon and class', () => {
        db.clear();
        db.addNode(0, 'problem', 'Root', db.nodeType.DEFAULT);
        db.decorateNode({ icon: 'fa:fa-user', class: 'error' });
        const root = db.getIshikawa();
        expect(root?.icon).toBe('fa:fa-user');
        expect(root?.class).toBe('error');
      });

      it('should handle undefined decoration', () => {
        db.clear();
        db.addNode(0, 'problem', 'Root', db.nodeType.DEFAULT);
        expect(() => db.decorateNode(undefined)).not.toThrow();
      });
    });

    describe('nodeTypeToString', () => {
      it('should convert all node types to strings', () => {
        expect(db.nodeTypeToString(db.nodeType.DEFAULT)).toBe('no-border');
        expect(db.nodeTypeToString(db.nodeType.RECT)).toBe('rect');
        expect(db.nodeTypeToString(db.nodeType.ROUNDED_RECT)).toBe('rounded-rect');
        expect(db.nodeTypeToString(db.nodeType.CIRCLE)).toBe('circle');
        expect(db.nodeTypeToString(db.nodeType.CLOUD)).toBe('cloud');
        expect(db.nodeTypeToString(db.nodeType.BANG)).toBe('bang');
        expect(db.nodeTypeToString(db.nodeType.HEXAGON)).toBe('hexagon');
        expect(db.nodeTypeToString(999)).toBe('no-border'); // Unknown type
      });
    });
  });

  describe('layoutFishbone', () => {
    it('should handle empty root with no categories', () => {
      const root: IshikawaNode = {
        id: 0,
        nodeId: 'root',
        level: 0,
        description: 'Problem',
        type: db.nodeType.DEFAULT,
        children: [],
        width: 200,
        padding: 20,
      };

      const result = layoutFishbone(root, {});
      expect(result.nodes).toHaveLength(1);
      expect(result.edges).toHaveLength(0);
    });

    it('should layout single category', () => {
      const root: IshikawaNode = {
        id: 0,
        nodeId: 'root',
        level: 0,
        description: 'Problem',
        type: db.nodeType.DEFAULT,
        children: [
          {
            id: 1,
            nodeId: 'cat1',
            level: 1,
            description: 'Category 1',
            type: db.nodeType.DEFAULT,
            children: [],
            width: 200,
            padding: 20,
          },
        ],
        width: 200,
        padding: 20,
      };

      const result = layoutFishbone(root, {});
      expect(result.nodes.length).toBeGreaterThan(1);
      expect(result.edges.length).toBeGreaterThan(0);
      expect(root.x).toBeDefined();
      expect(root.y).toBeDefined();
    });

    it('should layout multiple categories with alternating positions', () => {
      const root: IshikawaNode = {
        id: 0,
        nodeId: 'root',
        level: 0,
        description: 'Problem',
        type: db.nodeType.DEFAULT,
        children: [
          {
            id: 1,
            nodeId: 'cat1',
            level: 1,
            description: 'Category 1',
            type: db.nodeType.DEFAULT,
            children: [],
            width: 200,
            padding: 20,
          },
          {
            id: 2,
            nodeId: 'cat2',
            level: 1,
            description: 'Category 2',
            type: db.nodeType.DEFAULT,
            children: [],
            width: 200,
            padding: 20,
          },
        ],
        width: 200,
        padding: 20,
      };

      const result = layoutFishbone(root, {});
      expect(result.nodes.length).toBeGreaterThan(2);
      const cat1 = result.nodes.find((n) => n.id === 1);
      const cat2 = result.nodes.find((n) => n.id === 2);
      expect(cat1?.y).toBeLessThan(cat2?.y ?? 0); // First category should be above (top)
    });

    it('should layout categories with causes and sub-causes', () => {
      const root: IshikawaNode = {
        id: 0,
        nodeId: 'root',
        level: 0,
        description: 'Problem',
        type: db.nodeType.DEFAULT,
        children: [
          {
            id: 1,
            nodeId: 'cat1',
            level: 1,
            description: 'Category 1',
            type: db.nodeType.DEFAULT,
            children: [
              {
                id: 2,
                nodeId: 'cause1',
                level: 2,
                description: 'Cause 1',
                type: db.nodeType.DEFAULT,
                children: [
                  {
                    id: 3,
                    nodeId: 'sub1',
                    level: 3,
                    description: 'Sub-cause 1',
                    type: db.nodeType.DEFAULT,
                    children: [],
                    width: 200,
                    padding: 20,
                  },
                ],
                width: 200,
                padding: 20,
              },
            ],
            width: 200,
            padding: 20,
          },
        ],
        width: 200,
        padding: 20,
      };

      const result = layoutFishbone(root, {});
      expect(result.nodes.length).toBeGreaterThan(3);
      expect(result.edges.length).toBeGreaterThan(0);
    });

    it('should calculate dynamic spine length for many categories', () => {
      const categories = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        nodeId: `cat${i}`,
        level: 1,
        description: `Category ${i}`,
        type: db.nodeType.DEFAULT,
        children: [],
        width: 200,
        padding: 20,
      }));

      const root: IshikawaNode = {
        id: 0,
        nodeId: 'root',
        level: 0,
        description: 'Problem',
        type: db.nodeType.DEFAULT,
        children: categories,
        width: 200,
        padding: 20,
      };

      const result = layoutFishbone(root, {});
      expect(result.nodes.length).toBeGreaterThan(10);
      // Spine should be longer for more categories
      const lastCategory = result.nodes.find((n) => n.id === 10);
      expect(lastCategory?.x).toBeDefined();
    });
  });

  describe('svgDraw', () => {
    beforeEach(() => {
      // Create a mock SVG element in the DOM
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'test-svg');
      document.body.appendChild(svg);
    });

    afterEach(() => {
      const svg = document.getElementById('test-svg');
      if (svg) {
        document.body.removeChild(svg);
      }
    });

    describe('drawNode', () => {
      it('should draw a default node', async () => {
        db.clear();
        db.addNode(0, 'problem', 'Test Node', db.nodeType.DEFAULT);
        const root = db.getIshikawa();
        if (!root) {
          throw new Error('Root not found');
        }

        const svg = select('#test-svg');
        const node: any = {
          ...root,
          x: 100,
          y: 100,
          section: 0,
        };

        await drawNode(db, svg as any, node, 0, {});

        const element = db.getElementById(root.id);
        expect(element).toBeDefined();
      });

      it('should draw a rect node', async () => {
        db.clear();
        db.addNode(0, 'problem', 'Rect Node', db.nodeType.RECT);
        const root = db.getIshikawa();
        if (!root) {
          throw new Error('Root not found');
        }

        const svg = select('#test-svg');
        const node: any = {
          ...root,
          x: 100,
          y: 100,
          section: 0,
        };

        await drawNode(db, svg as any, node, 0, {});
        expect(db.getElementByNodeId(root.id)).toBeDefined();
      });

      it('should draw a circle node', async () => {
        db.clear();
        db.addNode(0, 'problem', 'Circle Node', db.nodeType.CIRCLE);
        const root = db.getIshikawa();
        if (!root) {
          throw new Error('Root not found');
        }

        const svg = select('#test-svg');
        const node: any = {
          ...root,
          x: 100,
          y: 100,
          section: 0,
        };

        await drawNode(db, svg as any, node, 0, {});
        expect(db.getElementByNodeId(root.id)).toBeDefined();
      });

      it('should draw a cloud node', async () => {
        db.clear();
        db.addNode(0, 'problem', 'Cloud Node', db.nodeType.CLOUD);
        const root = db.getIshikawa();
        if (!root) {
          throw new Error('Root not found');
        }

        const svg = select('#test-svg');
        const node: any = {
          ...root,
          x: 100,
          y: 100,
          section: 0,
        };

        await drawNode(db, svg as any, node, 0, {});
        expect(db.getElementByNodeId(root.id)).toBeDefined();
      });

      it('should draw a hexagon node', async () => {
        db.clear();
        db.addNode(0, 'problem', 'Hexagon Node', db.nodeType.HEXAGON);
        const root = db.getIshikawa();
        if (!root) {
          throw new Error('Root not found');
        }

        const svg = select('#test-svg');
        const node: any = {
          ...root,
          x: 100,
          y: 100,
          section: 0,
        };

        await drawNode(db, svg as any, node, 0, {});
        expect(db.getElementByNodeId(root.id)).toBeDefined();
      });

      it('should apply class to node element', async () => {
        db.clear();
        db.addNode(0, 'problem', 'Class Node', db.nodeType.DEFAULT);
        db.decorateNode({ class: 'error' });
        const root = db.getIshikawa();
        if (!root) {
          throw new Error('Root not found');
        }

        const svg = select('#test-svg');
        const node: any = {
          ...root,
          x: 100,
          y: 100,
          section: 0,
        };

        await drawNode(db, svg as any, node, 0, {});
        const element = db.getElementById(root.id);
        expect(element).toBeDefined();
      });
    });

    describe('positionNode', () => {
      it('should position node at specified coordinates', () => {
        db.clear();
        db.addNode(0, 'problem', 'Test Node', db.nodeType.DEFAULT);
        const root = db.getIshikawa();
        if (!root) {
          throw new Error('Root not found');
        }

        const svg = select('#test-svg');
        const nodeEl = svg.append('g');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.setElementForNodeId(root.id, nodeEl as any);

        const node: any = {
          ...root,
          x: 150,
          y: 200,
          width: 100,
          height: 50,
        };

        positionNode(db, node);
        const element = db.getElementByNodeId(root.id);
        expect(element?.attr('transform')).toContain('translate(100, 175)'); // x - width/2, y - height/2
      });

      it('should handle missing element gracefully', () => {
        db.clear();
        const node: any = {
          id: 999,
          x: 150,
          y: 200,
          width: 100,
          height: 50,
        };

        expect(() => positionNode(db, node)).not.toThrow();
      });
    });
  });

  describe('styles', () => {
    it('should generate styles with default options', () => {
      const styles = getStyles({});
      expect(styles).toContain('.ishikawa-container');
      expect(styles).toContain('.ishikawa-problem');
      expect(styles).toContain('.ishikawa-category');
      expect(styles).toContain('.ishikawa-cause');
    });

    it('should use custom colors when provided', () => {
      const styles = getStyles({
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        textColor: '#0000ff',
      });
      expect(styles).toContain('#ff0000');
      expect(styles).toContain('#00ff00');
      expect(styles).toContain('#0000ff');
    });

    it('should include all section styles', () => {
      const styles = getStyles({});
      for (let i = 0; i <= 7; i++) {
        expect(styles).toContain(`.section-${i}`);
      }
    });
  });

  describe('detector', () => {
    it('should detect ishikawa diagram', () => {
      expect(detector.detector('ishikawa')).toBe(true);
      expect(detector.detector('  ishikawa')).toBe(true);
      expect(detector.detector('\nishikawa')).toBe(true);
    });

    it('should not detect non-ishikawa text', () => {
      expect(detector.detector('flowchart')).toBe(false);
      expect(detector.detector('graph')).toBe(false);
      expect(detector.detector('')).toBe(false);
    });

    it('should load diagram definition', async () => {
      const result = await detector.loader();
      expect(result.id).toBe('ishikawa-beta');
      expect(result.diagram).toBeDefined();
      expect(result.diagram.db).toBeDefined();
      expect(result.diagram.renderer).toBeDefined();
      expect(result.diagram.parser).toBeDefined();
      expect(result.diagram.styles).toBeDefined();
    });
  });

  describe('renderer.draw', () => {
    beforeEach(() => {
      // Create a mock SVG element in the DOM
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'test-render');
      document.body.appendChild(svg);
    });

    afterEach(() => {
      const svg = document.getElementById('test-render');
      if (svg) {
        document.body.removeChild(svg);
      }
    });

    it('should render a simple ishikawa diagram', async () => {
      const text = `
        ishikawa
        problem "Test Problem"
        category "People"
          "Lack of training"
      `;

      const diagram = await Diagram.fromText(text);
      await renderer.draw(text, 'test-render', '1.0.0', diagram);

      const svg = document.getElementById('test-render');
      expect(svg).toBeTruthy();
    });

    it('should handle diagram with no root', async () => {
      const text = `ishikawa`;
      const diagram = await Diagram.fromText(text);
      // Mock the db to return null for getIshikawa
      const originalGetIshikawa = (diagram.db as any).getIshikawa;
      (diagram.db as any).getIshikawa = () => null;

      await renderer.draw(text, 'test-render', '1.0.0', diagram);
      // Should not throw, just return early

      (diagram.db as any).getIshikawa = originalGetIshikawa;
    });

    it('should render complex diagram with multiple categories and causes', async () => {
      const text = `
        ishikawa
        problem "Complex Problem"
        category "People"
          cause1 "Cause 1"
            "Sub-cause 1"
            "Sub-cause 2"
          cause2 "Cause 2"
        category "Process"
          "Process cause"
      `;

      const diagram = await Diagram.fromText(text);
      await renderer.draw(text, 'test-render', '1.0.0', diagram);

      const svg = document.getElementById('test-render');
      expect(svg).toBeTruthy();
    });
  });
});
