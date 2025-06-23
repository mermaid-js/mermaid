import { describe, it, expect, beforeEach } from 'vitest';
import { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { layoutFishbone } from './ishikawaRenderer.js';
import type { IshikawaNode } from './ishikawaTypes.js';

beforeEach(() => {
  addDiagrams();
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

    expect(diagram.type).toBe('ishikawa');
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
    expect(root.children[0].descr).toBe('People');
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
    expect(root.descr).toBe('Product quality issues');
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
    expect(peopleNode.children[0].descr).toBe('Lack of training');
    expect(peopleNode.children[1].nodeId).toBe('communication');
    expect(peopleNode.children[1].descr).toBe('Poor communication');
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
    expect(root.children[0].descr).toBe('Empty Category');
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
    expect(root.descr).toBe('Test with comments');
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
    expect(root.descr).toBe("Test with special chars: &amp; &lt; &gt; '");
    expect(root.children[0].children[0].descr).toBe("Node with &amp; &lt; &gt; ' chars");
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
    expect(root.descr).toBe('Multiline\n      problem statement');
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
    expect(root.descr).toBe('Minimal whitespace');
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
    expect(root.descr).toBe('');
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
    expect(root.descr).toBe('Problem with "quotes" inside');
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
    expect(category.descr).toBe('Testing');
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

    // Both causes should have the same distance from spine since the layout uses
    // the maximum sub-causes across all categories for consistent spacing
    // The distance should be: baseDistance(400) + maxSubCauses(8) * distancePerSubCause(50) = 800
    expect(distance1).toBeCloseTo(800, -1); // Within 10px
    expect(distance2).toBeCloseTo(800, -1); // Within 10px

    // Verify that both causes have the same distance (consistent spacing)
    expect(distance1).toBeCloseTo(distance2, -1);
  });
});
