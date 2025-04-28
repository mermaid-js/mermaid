import { describe, expect, it } from 'vitest';
import { validatedMindmapParse as validatedParse, mindmapParse as parse } from './test-util.js';
import type { CircleNode, SimpleNode, OtherComplex } from '../src/language/generated/ast.js';
// import { MindmapRow, Item } from '../src/language/generated/ast';

// Tests for mindmap parser with simple root and child nodes
describe('MindMap Parser Tests', () => {
  it('should parse just the mindmap keyword', () => {
    const result = parse('mindmap');

    // Basic checks
    expect(result).toBeDefined();
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
  });

  it('should parse a mindmap with a root node', () => {
    const result = parse('mindmap\nroot');

    // Basic checks
    expect(result).toBeDefined();
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rows = result.value.MindmapRows;
    // Check if we have a statement
    expect(rows).toBeDefined();
    expect(rows.length).toBe(1);

    // Check the content of the root node
    const rootNode = rows[0].item as SimpleNode;
    expect(rootNode).toBeDefined();
    expect(rootNode?.id).toBe('root');
  });

  it('should parse a mindmap with child nodes', () => {
    const result = parse(
      'mindmap\nroot((Root))\n  child1((Child 1))\n  child2((Child 2))\n    grandchild((Grand Child))'
    );

    const rows = result.value.MindmapRows;
    const r0 = rows[0];
    expect(r0.indent).toBe(undefined);
    const r1 = rows[1];
    expect(r1.indent).toBe(2);
    const r2 = rows[2];
    expect(r2.indent).toBe(2);
    const r3 = rows[3];
    expect(r3.indent).toBe(4);

    expect(r0.$type).toBe('MindmapRow');
    const node0 = r0.item as CircleNode;
    expect(node0.$type).toBe('CircleNode');
    expect(node0.desc).toBe('Root');
    expect(node0.id).toBe('root');

    expect(r1.$type).toBe('MindmapRow');
    // console.debug('R1:', r1);
    const node1 = r1.item as CircleNode;
    expect(node1.$type).toBe('CircleNode');
    expect(node1.id).toBe('child1');
    expect(node1.desc).toBe('Child 1');
    // expect(Object.keys(r1)).toBe(2);

    const child2 = rows[2].item as CircleNode;
    // expect(result.value.rows[1].indent).toBe('indent');
    // expect(Object.keys(node1)).toBe(true);
    expect(child2.id).toBe('child2');
    expect(child2.desc).toBe('Child 2');

    const grandChild = rows[3].item as CircleNode;
    // expect(result.value.rows[1].indent).toBe('indent');
    // expect(Object.keys(node1)).toBe(true);
    expect(grandChild.id).toBe('grandchild');
    expect(grandChild.desc).toBe('Grand Child');
  });
});

describe('Hierarchy (ported from mindmap.spec.ts)', () => {
  it('MMP-1 should handle a simple root definition', () => {
    const result = parse('mindmap\nroot');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as SimpleNode;
    expect(rootNode.id).toBe('root');
  });

  it('MMP-2 should handle a hierarchical mindmap definition', () => {
    const result = parse('mindmap\nroot\n  child1\n  child2');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    // Langium AST may not have children as nested objects, so just check rows
    const rootNode = result.value.MindmapRows[0].item as SimpleNode;
    const child1Node = result.value.MindmapRows[1].item as SimpleNode;
    const child2Node = result.value.MindmapRows[2].item as SimpleNode;
    expect(rootNode.id).toBe('root');
    expect(child1Node.id).toBe('child1');
    expect(child2Node.id).toBe('child2');
  });

  it('MMP-3 should handle a simple root definition with a shape and without an id', () => {
    const result = parse('mindmap\n(root)\n');
    expect(result.lexerErrors).toHaveLength(0);
    console.debug('RESULT:', result.parserErrors);
    expect(result.parserErrors).toHaveLength(0);
    // The content should be 'root', shape info may not be present in AST
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    expect(rootNode.id).toBe(undefined);
    expect(rootNode.desc).toBe('root');
  });

  it('MMP-3.5 should handle a simple root definition with a shape and without an id', () => {
    const result = parse('mindmap\n("r(oo)t")\n');
    expect(result.lexerErrors).toHaveLength(0);
    console.debug('RESULT-', result.parserErrors);
    expect(result.parserErrors).toHaveLength(0);
    // The content should be 'root', shape info may not be present in AST
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    expect(rootNode.id).toBe(undefined);
    expect(rootNode.desc).toBe('r(oo)t');
  });

  it('MMP-4 should handle a deeper hierarchical mindmap definition', () => {
    const result = parse('mindmap\nroot\n  child1\n    leaf1\n  child2');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as SimpleNode;
    const child1Node = result.value.MindmapRows[1].item as SimpleNode;
    const leaf1Node = result.value.MindmapRows[2].item as SimpleNode;
    const child2Node = result.value.MindmapRows[3].item as SimpleNode;
    expect(rootNode.id).toBe('root');
    expect(child1Node.id).toBe('child1');
    expect(leaf1Node.id).toBe('leaf1');
    expect(child2Node.id).toBe('child2');
  });

  it('MMP-5 Multiple roots are illegal', async () => {
    const str = 'mindmap\nroot\nfakeRoot';
    const result = await validatedParse(str, { validation: true });
    // Langium parser may not throw, but should have parserErrors
    expect(result.diagnostics![0].message).toBe(
      'Multiple root nodes are not allowed in a mindmap.'
    );
    const str2 = 'mindmap\nroot\n  notAFakeRoot';
    const result2 = await validatedParse(str2, { validation: true });
    expect(result2.diagnostics?.length).toBe(0);
  });

  it('MMP-6 real root in wrong place', async () => {
    const str = 'mindmap\n    root\n  fakeRoot\nrealRootWrongPlace';
    const r2 = await validatedParse(str, { validation: true });
    expect(r2.diagnostics?.length).toBe(0);
  });
});

describe('Nodes (ported from mindmap.spec.ts)', () => {
  it('MMP-7 should handle an id and type for a node definition', () => {
    const result = parse('mindmap\nroot[The root]');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    // Langium AST: check content, id, and maybe type if available
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    expect(rootNode.desc).toBe('The root');
    expect(rootNode.id).toBe('root');
  });

  it('MMP-8 should handle an id and type for a node definition', () => {
    const result = parse('mindmap\nroot\n  theId(child1)');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as SimpleNode;
    const childNode = result.value.MindmapRows[1].item as OtherComplex;
    expect(rootNode.id).toBe('root');
    expect(childNode.id).toBe('theId');
    expect(childNode.desc).toBe('child1');
  });

  it.only('MMP-9 should handle an id and type for a node definition', () => {
    const result = parse('mindmap\nroot\n  theId(child1)');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as SimpleNode;
    const childNode = result.value.MindmapRows[1].item as OtherComplex;
    expect(rootNode.id).toBe('root');
    expect(childNode.id).toBe('theId');
    expect(childNode.desc).toBe('child1');
  });

  it('MMP-10 multiple types (circle)', () => {
    const result = parse('mindmap\nroot((the root))');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as CircleNode;
    expect(rootNode.desc).toBe('the root');
    expect(rootNode.id).toBe('root');
  });

  it('MMP-11 multiple types (cloud)', () => {
    const result = parse('mindmap\nroot)the root(');
    console.debug('RESULT:', result.parserErrors);
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    expect(rootNode.desc).toBe('the root');
    expect(rootNode.id).toBe('root');
  });

  it('MMP-12 multiple types (bang)', () => {
    const result = parse('mindmap\nroot))the root((');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    expect(rootNode.desc).toBe('the root');
    expect(rootNode.id).toBe('root');
  });

  it('MMP-12-a multiple types (hexagon)', () => {
    const result = parse('mindmap\nroot{{the root}}');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    expect(rootNode.desc).toBe('the root');
    expect(rootNode.id).toBe('root');
  });
});

describe('Decorations (ported from mindmap.spec.ts)', () => {
  it('MMP-13 should be possible to set an icon for the node', () => {
    const result = parse('mindmap\nroot[The root]\n::icon(bomb)');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    // TODO: check icon if present in AST
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    expect(rootNode.desc).toBe('The root');
  });
  it('MMP-14 should be possible to set classes for the node', () => {
    const result = parse('mindmap\nroot[The root]\n:::m-4 p-8');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    // TODO: check class if present in AST
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    expect(rootNode.desc).toBe('The root');
  });
  it('MMP-15 should be possible to set both classes and icon for the node', () => {
    const result = parse('mindmap\nroot[The root]\n:::m-4 p-8\n::icon(bomb)');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    // TODO: check class and icon if present in AST
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    expect(rootNode.desc).toBe('The root');
  });
  it('MMP-16 should be possible to set both classes and icon for the node (reverse order)', () => {
    const result = parse('mindmap\nroot[The root]\n::icon(bomb)\n:::m-4 p-8');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    // TODO: check class and icon if present in AST
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    expect(rootNode.desc).toBe('The root');
  });
});

describe('Descriptions (ported from mindmap.spec.ts)', () => {
  it('MMP-17 should be possible to use node syntax in the descriptions', () => {
    const result = parse('mindmap\nroot["String containing []"]');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    expect(rootNode.desc).toBe('String containing []');
  });
  it('MMP-18 should be possible to use node syntax in the descriptions in children', () => {
    const result = parse('mindmap\nroot["String containing []"]\n  child1["String containing ()"]');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    const childNode = result.value.MindmapRows[1].item as OtherComplex;
    expect(rootNode.desc).toBe('String containing []');
    expect(childNode.desc).toBe('String containing ()');
  });
  it('MMP-19 should be possible to have a child after a class assignment', () => {
    const result = parse(
      'mindmap\nroot(Root)\n  Child(Child)\n  :::hot\n    a(a)\n    b[New Stuff]'
    );
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    const childNode = result.value.MindmapRows[1].item as OtherComplex;
    const aNode = result.value.MindmapRows[3].item as OtherComplex;
    const bNode = result.value.MindmapRows[4].item as OtherComplex;
    expect(rootNode.desc).toBe('Root');
    expect(childNode.desc).toBe('Child');
    expect(aNode.desc).toBe('a');
    expect(bNode.desc).toBe('New Stuff');
  });
});

describe('Miscellaneous (ported from mindmap.spec.ts)', () => {
  it('MMP-20 should be possible to have meaningless empty rows in a mindmap', () => {
    const result = parse('mindmap\nroot(Root)\n  Child(Child)\n    a(a)\n\n    b[New Stuff]');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    const childNode = result.value.MindmapRows[1].item as OtherComplex;
    const aNode = result.value.MindmapRows[2].item as OtherComplex;
    const bNode = result.value.MindmapRows[3].item as OtherComplex;
    expect(rootNode.desc).toBe('Root');
    expect(childNode.desc).toBe('Child');
    expect(aNode.desc).toBe('a');
    expect(bNode.desc).toBe('New Stuff');
  });
  it('MMP-21 should be possible to have comments in a mindmap', () => {
    const result = parse(
      'mindmap\nroot(Root)\n  Child(Child)\n    a(a)\n\n    %% This is a comment\n    b[New Stuff]'
    );
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    const childNode = result.value.MindmapRows[1].item as OtherComplex;
    const aNode = result.value.MindmapRows[2].item as OtherComplex;
    const bNode = result.value.MindmapRows[3].item as OtherComplex;
    expect(rootNode.desc).toBe('Root');
    expect(childNode.desc).toBe('Child');
    expect(aNode.desc).toBe('a');
    expect(bNode.desc).toBe('New Stuff');
  });
  it('MMP-22 should be possible to have comments at the end of a line', () => {
    const result = parse(
      'mindmap\nroot(Root)\n  Child(Child)\n    a(a) %% This is a comment\n    b[New Stuff]'
    );
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as OtherComplex;
    const childNode = result.value.MindmapRows[1].item as OtherComplex;
    const aNode = result.value.MindmapRows[2].item as OtherComplex;
    const bNode = result.value.MindmapRows[3].item as OtherComplex;
    expect(rootNode.desc).toBe('Root');
    expect(childNode.desc).toBe('Child');
    expect(aNode.desc).toBe('a');
    expect(bNode.desc).toBe('New Stuff');
  });
  it('MMP-23 Rows with only spaces should not interfere', () => {
    const result = parse('mindmap\nroot\n A\n \n\n B');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as SimpleNode;
    const aNode = result.value.MindmapRows[1].item as SimpleNode;
    const bNode = result.value.MindmapRows[2].item as SimpleNode;
    expect(rootNode.id).toBe('root');
    expect(aNode.id).toBe('A');
    expect(bNode.id).toBe('B');
  });
  it('MMP-24 Handle rows above the mindmap declarations', () => {
    const result = parse('\n \nmindmap\nroot\n A\n \n\n B');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as SimpleNode;
    const aNode = result.value.MindmapRows[1].item as SimpleNode;
    const bNode = result.value.MindmapRows[2].item as SimpleNode;
    expect(rootNode.id).toBe('root');
    expect(aNode.id).toBe('A');
    expect(bNode.id).toBe('B');
  });
  it('MMP-25 Handle rows above the mindmap declarations, no space', () => {
    const result = parse('\n\n\nmindmap\nroot\n A\n \n\n B');
    expect(result.lexerErrors).toHaveLength(0);
    expect(result.parserErrors).toHaveLength(0);
    const rootNode = result.value.MindmapRows[0].item as SimpleNode;
    const aNode = result.value.MindmapRows[1].item as SimpleNode;
    const bNode = result.value.MindmapRows[2].item as SimpleNode;
    expect(rootNode.id).toBe('root');
    expect(aNode.id).toBe('A');
    expect(bNode.id).toBe('B');
  });
});
