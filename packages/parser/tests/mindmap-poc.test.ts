import { describe, expect, it } from 'vitest';
import { validatedMindmapParse as validatedParse, mindmapParse as parse } from './test-util.js';
import type { CircleNode, SimpleNode, OtherComplex } from '../src/language/generated/ast.js';

describe('Nodes (ported from mindmap.spec.ts)', () => {
  it('MMP-21 should be possible to have comments in a mindmap', () => {
    const result = parse(
      'mindmap\nroot(Root)\n  Child(Child)\n    a(a)\n\n    %% This is a comment\n    b[New Stuff]'
    );
    expect(result.lexerErrors).toHaveLength(0);
    console.debug(result.parserErrors);
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
});
