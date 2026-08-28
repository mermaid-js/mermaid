import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { buildLaneModel } from '../lanes.js';
import type { Node } from '../../../types.js';

const group = (id: string, parentId?: string): Node =>
  ({ id, isGroup: true, ...(parentId ? { parentId } : {}) }) as Node;
const leaf = (id: string, parentId?: string): Node =>
  ({ id, isGroup: false, ...(parentId ? { parentId } : {}) }) as Node;

describe('buildLaneModel', () => {
  const model = buildLaneModel([
    group('sales'),
    leaf('a', 'sales'),
    group('ops'),
    group('nested', 'ops'),
    leaf('b', 'nested'),
    leaf('loose'),
  ]);

  it('treats a group with no parent as a lane', () => {
    expect(model.isLane('sales')).toBe(true);
    expect(model.isLane('ops')).toBe(true);
  });

  it('does not treat a nested group as a lane', () => {
    expect(model.isLane('nested')).toBe(false);
  });

  it('does not treat content as a lane', () => {
    expect(model.isLane('a')).toBe(false);
    expect(model.isLane('loose')).toBe(false);
  });

  it('resolves content to its lane', () => {
    expect(model.laneIdOf('a')).toBe('sales');
  });

  it('resolves content nested deeper than the lane to the outermost container', () => {
    expect(model.laneIdOf('b')).toBe('ops');
  });

  it('resolves a lane itself to null, so a band is distinguishable from its content', () => {
    expect(model.laneIdOf('sales')).toBeNull();
  });

  it('resolves a nested group to its lane', () => {
    expect(model.laneIdOf('nested')).toBe('ops');
  });

  it('returns null for a node outside every lane', () => {
    expect(model.laneIdOf('loose')).toBeNull();
  });

  it('returns null for an id that is not in the graph', () => {
    expect(model.laneIdOf('missing')).toBeNull();
    expect(model.isLane('missing')).toBe(false);
  });

  it('survives a malformed parent cycle rather than hanging', () => {
    const a = { id: 'a', isGroup: true, parentId: 'b' } as Node;
    const b = { id: 'b', isGroup: true, parentId: 'a' } as Node;
    const cyclic = buildLaneModel([a, b]);

    expect(cyclic.isLane('a')).toBe(false);
    expect(cyclic.laneIdOf('a')).toBe('b');
  });
});

/**
 * A group with no parent, spelled out inline. The leading negation is excluded because
 * `!isGroup && !parentId` selects loose content, which is a different question.
 */
const INLINE_LANE_TEST = /(^|[^!\w.])[\w.]*isGroup\s*&&\s*!\s*[\w.]*parentId/;

const swimlanesRoot = () => {
  const candidates = [
    resolve(process.cwd(), 'packages/mermaid/src/rendering-util/layout-algorithms/swimlanes'),
    resolve(process.cwd(), 'src/rendering-util/layout-algorithms/swimlanes'),
  ];
  const root = candidates.find((candidate) => existsSync(candidate));
  if (!root) {
    throw new Error(`Swimlanes source was not found at: ${candidates.join(', ')}`);
  }
  return root;
};

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : sourceFiles(path);
    }
    return entry.isFile() && entry.name.endsWith('.ts') && !entry.name.includes('.spec.')
      ? [path]
      : [];
  });

describe('one definition of a lane', () => {
  it('recognises the inline form without confusing it with the loose-node predicate', () => {
    expect(INLINE_LANE_TEST.test('const lanes = nodes.filter((n) => n.isGroup && !n.parentId);')).toBe(
      true
    );
    expect(INLINE_LANE_TEST.test('if (isGroup && !parentId) {')).toBe(true);
    expect(
      INLINE_LANE_TEST.test('const loose = nodes.filter((n) => !n.isGroup && !n.parentId);')
    ).toBe(false);
  });

  it('is answered by lanes.ts alone, so no call site can drift from it', () => {
    const root = swimlanesRoot();
    const offenders = sourceFiles(root)
      .filter((file) => !file.endsWith(`${join('swimlanes', 'lanes.ts')}`))
      .filter((file) => INLINE_LANE_TEST.test(readFileSync(file, 'utf8')))
      .map((file) => relative(root, file))
      .sort();

    expect(offenders).toEqual([]);
  });
});
