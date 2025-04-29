import { describe, expect, it } from 'vitest';
import { validatedMindmapParse as validatedParse, mindmapParse as parse } from './test-util.js';
import type { CircleNode, SimpleNode, OtherComplex } from '../src/language/generated/ast.js';

describe('Nodes (ported from mindmap.spec.ts)', () => {
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
  it.only('MMP-24 Handle rows above the mindmap declarations', () => {
    const result = parse('\n \nmindmap\nroot\n A\n \n\n B');
    if (result.lexerErrors.length > 0) {
      console.debug('lexerErrors', result.lexerErrors);
    }
    expect(result.lexerErrors).toHaveLength(0);
    if (result.parserErrors.length > 0) {
      console.debug('Error', result.parserErrors);
    }
    expect(result.parserErrors).toHaveLength(0);
    for (const row of result.value.MindmapRows) {
      console.debug('Row', row);
    }
    const rootNode = result.value.MindmapRows[0].item as SimpleNode;
    const aNode = result.value.MindmapRows[1].item as SimpleNode;
    const bNode = result.value.MindmapRows[3].item as SimpleNode;
    expect(rootNode.id).toBe('root');
    expect(aNode.id).toBe('A');
    expect(bNode.id).toBe('B');
  });

  it('MMP-22 should be possible to have comments at the end of a line', () => {
    const result = parse(
      'mindmap\nroot(Root)\n  Child(Child)\n    a(a) %% This is a comment\n    b[New Stuff]'
    );
    if (result.lexerErrors.length > 0) {
      console.debug('lexerErrors', result.lexerErrors);
    }
    if (result.parserErrors.length > 0) {
      console.debug('Error', result.parserErrors);
    }
    for (const row of result.value.MindmapRows) {
      console.debug('Row', row);
    }
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
  // it('MMP-21 should be possible to have comments in a mindmap', () => {
  //   const result = parse(
  //     'mindmap\nroot(Root)\n  Child(Child)\n    a(a)\n\n    %% This is a comment\n    b[New Stuff]'
  //   );
  //   expect(result.lexerErrors).toHaveLength(0);
  //   console.debug(result.parserErrors);
  //   expect(result.parserErrors).toHaveLength(0);
  //   const rootNode = result.value.MindmapRows[0].item as OtherComplex;
  //   const childNode = result.value.MindmapRows[1].item as OtherComplex;
  //   const aNode = result.value.MindmapRows[2].item as OtherComplex;
  //   const bNode = result.value.MindmapRows[3].item as OtherComplex;
  //   expect(rootNode.desc).toBe('Root');
  //   expect(childNode.desc).toBe('Child');
  //   expect(aNode.desc).toBe('a');
  //   expect(bNode.desc).toBe('New Stuff');
  // });
});
