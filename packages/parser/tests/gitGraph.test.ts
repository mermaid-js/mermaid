import { describe, expect, it } from 'vitest';
import type { Branch, Merge } from '../src/language/index.js';
import { gitGraphParse as parse } from './test-util.js';
import type { Commit } from '../src/language/index.js';
import type { Checkout, CherryPicking } from '../src/language/generated/ast.js';

describe('Parsing Commit Statements', () => {
  it('should parse a simple commit', () => {
    const result = parse(`gitGraph\n  commit\n`);
    expect(result.value.statements[0].$type).toBe('Commit');
  });

  it('should parse multiple commits', () => {
    const result = parse(`gitGraph\n  commit\n  commit\n  commit\n`);
    expect(result.value.statements).toHaveLength(3);
  });

  it('should parse commits with all properties', () => {
    const result = parse(`gitGraph\n  commit id:"1" msg:"Fix bug" tag:"v1.2" type:NORMAL\n`);
    const commit = result.value.statements[0] as Commit;
    expect(commit.$type).toBe('Commit');
    expect(commit.id).toBe('1');
    expect(commit.message).toBe('Fix bug');
    expect(commit.tags).toEqual(['v1.2']);
    expect(commit.type).toBe('NORMAL');
  });

  it('should handle commit messages with special characters', () => {
    const result = parse(`gitGraph\n  commit msg:"Fix issue #123: Handle errors"\n`);
    const commit = result.value.statements[0] as Commit;
    expect(commit.message).toBe('Fix issue #123: Handle errors');
  });

  it('should parse commits with only a message and no other properties', () => {
    const result = parse(`gitGraph\n  commit msg:"Initial release"\n`);
    const commit = result.value.statements[0] as Commit;
    expect(commit.message).toBe('Initial release');
    expect(commit.id).toBeUndefined();
    expect(commit.type).toBeUndefined();
  });

  it('should ignore malformed properties and not break parsing', () => {
    const result = parse(`gitGraph\n  commit id:"2" msg:"Malformed commit" oops:"ignored"\n`);
    const commit = result.value.statements[0] as Commit;
    expect(commit.id).toBe('2');
    expect(commit.message).toBe('Malformed commit');
    expect(commit.hasOwnProperty('oops')).toBe(false);
  });

  it('should parse multiple commits with different types', () => {
    const result = parse(`gitGraph\n  commit type:NORMAL\n  commit type:REVERSE\n`);
    const commit1 = result.value.statements[0] as Commit;
    const commit2 = result.value.statements[1] as Commit;
    expect(commit1.type).toBe('NORMAL');
    expect(commit2.type).toBe('REVERSE');
  });
});

describe('Parsing Branch Statements', () => {
  it('should parse a branch with a simple name', () => {
    const result = parse(`gitGraph\n commit\n commit\n branch master\n`);
    const branch = result.value.statements[2] as Branch;
    expect(branch.name).toBe('master');
  });

  it('should parse a branch with an order property', () => {
    const result = parse(`gitGraph\n commit\n  branch feature order:1\n`);
    const branch = result.value.statements[1] as Branch;
    expect(branch.name).toBe('feature');
    expect(branch.order).toBe(1);
  });

  it('should handle branch names with special characters', () => {
    const result = parse(`gitGraph\n  branch feature/test-branch\n`);
    const branch = result.value.statements[0] as Branch;
    expect(branch.name).toBe('feature/test-branch');
  });

  it('should parse branches with hyphens and underscores', () => {
    const result = parse(`gitGraph\n  branch my-feature_branch\n`);
    const branch = result.value.statements[0] as Branch;
    expect(branch.name).toBe('my-feature_branch');
  });

  it('should correctly handle branch without order property', () => {
    const result = parse(`gitGraph\n  branch feature\n`);
    const branch = result.value.statements[0] as Branch;
    expect(branch.name).toBe('feature');
    expect(branch.order).toBeUndefined();
  });
});

describe('Parsing Merge Statements', () => {
  it('should parse a merge with a branch name', () => {
    const result = parse(`gitGraph\n merge master\n`);
    const merge = result.value.statements[0] as Merge;
    expect(merge.branch).toBe('master');
  });

  it('should handle merges with additional properties', () => {
    const result = parse(`gitGraph\n  merge feature id:"m1" tag:"release" type:HIGHLIGHT\n`);
    const merge = result.value.statements[0] as Merge;
    expect(merge.branch).toBe('feature');
    expect(merge.id).toBe('m1');
    expect(merge.tags).toEqual(['release']);
    expect(merge.type).toBe('HIGHLIGHT');
  });

  it('should parse merge without any properties', () => {
    const result = parse(`gitGraph\n  merge feature\n`);
    const merge = result.value.statements[0] as Merge;
    expect(merge.branch).toBe('feature');
  });

  it('should ignore malformed properties in merge statements', () => {
    const result = parse(`gitGraph\n  merge feature random:"ignored"\n`);
    const merge = result.value.statements[0] as Merge;
    expect(merge.branch).toBe('feature');
    expect(merge.hasOwnProperty('random')).toBe(false);
  });
});

describe('Parsing Checkout Statements', () => {
  it('should parse a checkout to a named branch', () => {
    const result = parse(
      `gitGraph\n commit id:"1"\n branch develop\n branch fun\n checkout develop\n`
    );
    const checkout = result.value.statements[3] as Checkout;
    expect(checkout.branch).toBe('develop');
  });

  it('should parse checkout to branches with complex names', () => {
    const result = parse(`gitGraph\n  checkout hotfix-123\n`);
    const checkout = result.value.statements[0] as Checkout;
    expect(checkout.branch).toBe('hotfix-123');
  });

  it('should parse checkouts with hyphens and numbers', () => {
    const result = parse(`gitGraph\n  checkout release-2021\n`);
    const checkout = result.value.statements[0] as Checkout;
    expect(checkout.branch).toBe('release-2021');
  });
});

describe('Parsing CherryPicking Statements', () => {
  it('should parse cherry-picking with a commit id', () => {
    const result = parse(`gitGraph\n commit id:"123" commit id:"321" cherry-pick id:"123"\n`);
    const cherryPick = result.value.statements[2] as CherryPicking;
    expect(cherryPick.id).toBe('123');
  });

  it('should parse cherry-picking with multiple properties', () => {
    const result = parse(`gitGraph\n  cherry-pick id:"123" tag:"urgent" parent:"100"\n`);
    const cherryPick = result.value.statements[0] as CherryPicking;
    expect(cherryPick.id).toBe('123');
    expect(cherryPick.tags).toEqual(['urgent']);
    expect(cherryPick.parent).toBe('100');
  });

  describe('Parsing with Accessibility Titles and Descriptions', () => {
    it('should parse accessibility titles', () => {
      const result = parse(`gitGraph\n  accTitle: Accessible Graph\n  commit\n`);
      expect(result.value.accTitle).toBe('Accessible Graph');
    });

    it('should parse multiline accessibility descriptions', () => {
      const result = parse(
        `gitGraph\n  accDescr {\n    Detailed description\n    across multiple lines\n  }\n  commit\n`
      );
      expect(result.value.accDescr).toBe('Detailed description\nacross multiple lines');
    });
  });

  describe('Integration Tests', () => {
    it('should correctly parse a complex graph with various elements', () => {
      const result = parse(`
        gitGraph TB:
        accTitle: Complex Example
        commit id:"init" type:NORMAL
        branch feature
        commit id:"feat1" msg:"Add feature"
        checkout main
        merge feature tag:"v1.0"
        cherry-pick id:"feat1" tag:"critical fix"
      `);
      expect(result.value.accTitle).toBe('Complex Example');
      expect(result.value.statements[0].$type).toBe('Commit');
      expect(result.value.statements[1].$type).toBe('Branch');
      expect(result.value.statements[2].$type).toBe('Commit');
      expect(result.value.statements[3].$type).toBe('Checkout');
      expect(result.value.statements[4].$type).toBe('Merge');
      expect(result.value.statements[5].$type).toBe('CherryPicking');
    });
  });

  describe('Error Handling for Invalid Syntax', () => {
    it('should report errors for unknown properties in commit', () => {
      const result = parse(`gitGraph\n  commit unknown:"oops"\n`);
      expect(result.parserErrors).not.toHaveLength(0);
    });

    it('should report errors for invalid branch order', () => {
      const result = parse(`gitGraph\n  branch feature order:xyz\n`);
      expect(result.parserErrors).not.toHaveLength(0);
    });
  });
});
