import { describe, expect, it } from 'vitest';
import { BlockState, findTreePath, variablesConnectedTo } from './blocks.js';
import type { SeparationConstraint } from './types.js';

describe('IPSEP-COLA block machinery', () => {
  describe('§11 INITIALIZE_QPSC_STATE', () => {
    it('gives every variable its own block at its initial position', () => {
      const state = new BlockState([0, 10, 20]);

      expect(state.variableCount).toBe(3);
      expect(state.nonEmptyBlocks()).toHaveLength(3);
      expect(state.positions()).toEqual([0, 10, 20]);
      expect(state.offset).toEqual([0, 0, 0]);
    });
  });

  describe('§5 UPDATE_BLOCK_POSITION', () => {
    it('moves a block to the mean of its variables desired positions', () => {
      const state = new BlockState([0, 0]);
      const c: SeparationConstraint = { left: 0, right: 1, gap: 10 };
      state.mergeBlocks(state.blockOf[0], state.blockOf[1], c);

      // Variable 0 wants 100 and variable 1 wants 130, but the merge froze them
      // 10 apart. Minimising (p0-100)² + (p0+10-130)² puts p0 at 110.
      state.updateBlockPosition(state.blockOf[0], [100, 130]);

      expect(state.position(0)).toBeCloseTo(110);
      expect(state.position(1)).toBeCloseTo(120);
    });
  });

  describe('§6 MERGE_BLOCKS', () => {
    it('makes the merging constraint hold with equality', () => {
      const state = new BlockState([0, 3]);
      const c: SeparationConstraint = { left: 0, right: 1, gap: 10 };

      expect(state.violation(c)).toBe(7);
      state.mergeBlocks(state.blockOf[0], state.blockOf[1], c);

      expect(state.violation(c)).toBeCloseTo(0);
      expect(state.blockOf[0]).toBe(state.blockOf[1]);
      expect(state.blockOf[0].variableCount).toBe(2);
      expect(state.blockOf[0].activeConstraints.has(c)).toBe(true);
    });

    it('preserves the centre of mass of the merged variables', () => {
      const state = new BlockState([0, 0]);
      const c: SeparationConstraint = { left: 0, right: 1, gap: 10 };
      state.mergeBlocks(state.blockOf[0], state.blockOf[1], c);

      expect((state.position(0) + state.position(1)) / 2).toBeCloseTo(0);
    });

    it('empties the absorbed block', () => {
      const state = new BlockState([0, 5, 12]);
      const right = state.blockOf[1];
      state.mergeBlocks(state.blockOf[0], right, { left: 0, right: 1, gap: 8 });

      expect(right.empty).toBe(true);
      expect(right.variableCount).toBe(0);
      expect(state.nonEmptyBlocks()).toHaveLength(2);
    });
  });

  describe('§8 Lagrange multipliers', () => {
    // For `left + gap <= right` under the projection objective the multiplier
    // works out to `position(right) - targetX[right]`: positive when the
    // constraint is genuinely holding the pair apart, negative when the block —
    // not the constraint — is what stops a variable reaching its target.
    it('is positive while the constraint is doing real work', () => {
      const state = new BlockState([0, 0]);
      const c: SeparationConstraint = { left: 0, right: 1, gap: 10 };
      state.mergeBlocks(state.blockOf[0], state.blockOf[1], c);

      // Both variables want to sit at 0, i.e. closer than the gap allows.
      const targetX = [0, 0];
      state.updateBlockPosition(state.blockOf[0], targetX);
      state.computeLagrangeMultipliers(0, state.blockOf[0].activeConstraints, targetX);

      expect(state.lagrangeMultiplier.get(c)!).toBeGreaterThan(0);
    });

    it('is negative for an active constraint the objective wants released', () => {
      const state = new BlockState([0, 0]);
      const c: SeparationConstraint = { left: 0, right: 1, gap: 10 };
      state.mergeBlocks(state.blockOf[0], state.blockOf[1], c);

      // Variable 1 wants to be far to the right, which the constraint does not
      // oppose — only the rigid block does. The pair should come apart.
      const targetX = [0, 100];
      state.updateBlockPosition(state.blockOf[0], targetX);
      state.computeLagrangeMultipliers(0, state.blockOf[0].activeConstraints, targetX);

      expect(state.lagrangeMultiplier.get(c)!).toBeLessThan(0);
    });
  });

  describe('§9 SPLIT_BLOCKS', () => {
    it('splits a block whose constraint is no longer wanted, and reports it', () => {
      const state = new BlockState([0, 0]);
      const c: SeparationConstraint = { left: 0, right: 1, gap: 10 };
      state.mergeBlocks(state.blockOf[0], state.blockOf[1], c);

      // Variable 1 wants 100; only the merge is keeping it at 5.
      const noSplitOccurred = state.splitBlocks([0, 100]);

      expect(noSplitOccurred).toBe(false);
      expect(state.blockOf[0]).not.toBe(state.blockOf[1]);
      expect(state.nonEmptyBlocks()).toHaveLength(2);
    });

    it('leaves a block alone when every active constraint is still binding', () => {
      const state = new BlockState([0, 0]);
      const c: SeparationConstraint = { left: 0, right: 1, gap: 10 };
      state.mergeBlocks(state.blockOf[0], state.blockOf[1], c);

      const noSplitOccurred = state.splitBlocks([0, 0]);

      expect(noSplitOccurred).toBe(true);
      expect(state.blockOf[0]).toBe(state.blockOf[1]);
    });
  });

  describe('§7 EXPAND_BLOCK', () => {
    it('satisfies a violated constraint between two variables of the same block', () => {
      // Chain 0 -> 1 -> 2 with gap 10 each, then demand 0 + 100 <= 2.
      const state = new BlockState([0, 0, 0]);
      const a: SeparationConstraint = { left: 0, right: 1, gap: 10 };
      const b: SeparationConstraint = { left: 1, right: 2, gap: 10 };
      state.mergeBlocks(state.blockOf[0], state.blockOf[1], a);
      state.mergeBlocks(state.blockOf[0], state.blockOf[2], b);

      const violated: SeparationConstraint = { left: 0, right: 2, gap: 100 };
      expect(state.violation(violated)).toBeGreaterThan(0);

      const expanded = state.expandBlock(state.blockOf[0], violated, [0, 0, 0]);

      expect(expanded).toBe(true);
      expect(state.violation(violated)).toBeCloseTo(0);
      expect(state.blockOf[0].activeConstraints.has(violated)).toBe(true);
    });

    it('reports failure instead of looping when no forward edge is on the path', () => {
      // The only active edge runs 1 -> 0, so a violated 0 -> 1 constraint has no
      // candidate split constraint on its tree path.
      const state = new BlockState([0, 0]);
      const reverse: SeparationConstraint = { left: 1, right: 0, gap: 10 };
      state.mergeBlocks(state.blockOf[1], state.blockOf[0], reverse);

      const violated: SeparationConstraint = { left: 0, right: 1, gap: 50 };
      expect(state.expandBlock(state.blockOf[0], violated, [0, 0])).toBe(false);
    });
  });

  describe('§10 tree utilities', () => {
    const chain: SeparationConstraint[] = [
      { left: 0, right: 1, gap: 1 },
      { left: 1, right: 2, gap: 1 },
      { left: 2, right: 3, gap: 1 },
    ];

    it('finds the unique path through the active tree', () => {
      expect(findTreePath(0, 3, new Set(chain))).toEqual([0, 1, 2, 3]);
      expect(findTreePath(3, 1, new Set(chain))).toEqual([3, 2, 1]);
      expect(findTreePath(2, 2, new Set(chain))).toEqual([2]);
    });

    it('returns undefined when the variables are not connected', () => {
      expect(findTreePath(0, 3, new Set(chain.slice(0, 1)))).toBeUndefined();
    });

    it('collects every reachable variable', () => {
      expect([...variablesConnectedTo(1, new Set(chain))].sort()).toEqual([0, 1, 2, 3]);
      expect([...variablesConnectedTo(2, new Set(chain.slice(2)))].sort()).toEqual([2, 3]);
    });
  });
});
