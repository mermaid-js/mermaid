import { describe, it, expect } from 'vitest';
import {
  assertUniqueSnapshotNames,
  buildFixtureTree,
  fixtureBaseName,
  snapshotNameKey,
} from './mmd-snapshots.ts';

describe('fixtureBaseName', () => {
  it('returns the filename without extension', () => {
    expect(fixtureBaseName('flowchart/handdrawn/fhd1-simple.mmd')).toBe('fhd1-simple');
  });
});

describe('buildFixtureTree', () => {
  it('nests fixtures by folder segments', () => {
    const tree = buildFixtureTree([
      'pie/simple-sports.mmd',
      'flowchart/handdrawn/fhd1-simple.mmd',
      'flowchart/elk/basic.mmd',
    ]);

    expect(tree.fixtures).toEqual([]);
    expect([...tree.children.keys()].sort()).toEqual(['flowchart', 'pie']);
    expect(tree.children.get('pie')!.fixtures).toEqual(['pie/simple-sports.mmd']);
    expect([...tree.children.get('flowchart')!.children.keys()].sort()).toEqual([
      'elk',
      'handdrawn',
    ]);
    expect(tree.children.get('flowchart')!.children.get('handdrawn')!.fixtures).toEqual([
      'flowchart/handdrawn/fhd1-simple.mmd',
    ]);
  });
});

describe('snapshotNameKey', () => {
  it('collapses the folder separator the same way the screenshot name does', () => {
    // A folder boundary and an in-name hyphen flatten identically.
    expect(snapshotNameKey('flowchart/elk/foo.mmd')).toBe(snapshotNameKey('flowchart/elk-foo.mmd'));
    expect(snapshotNameKey('flowchart/elk/foo.mmd')).toBe('flowchart-elk-foo');
  });
});

describe('assertUniqueSnapshotNames', () => {
  it('passes when every fixture maps to a distinct snapshot name', () => {
    expect(() =>
      assertUniqueSnapshotNames(['pie/simple.mmd', 'flowchart/elk/foo.mmd'])
    ).not.toThrow();
  });

  it('throws when two fixtures would share a snapshot name', () => {
    expect(() =>
      assertUniqueSnapshotNames(['flowchart/elk/foo.mmd', 'flowchart/elk-foo.mmd'])
    ).toThrow(/same snapshot name/);
  });
});
