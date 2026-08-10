/**
 * Where along a node's side each edge attaches (guide §19.8).
 *
 * `spreadPorts` is the whole decision: every end asks for the point nearest its own
 * far end — the attachment that needs no bend — and ends that ask for the same place
 * are pushed apart by as little as the side allows.
 */

import { describe, expect, it } from 'vitest';
import { spreadPorts } from './finalRouting.js';

describe('spreading attachment points along one node side', () => {
  it('grants every request when they are already far enough apart', () => {
    expect(spreadPorts([0, 40, 80], 0, 100, 14)).toEqual([0, 40, 80]);
  });

  it('parts two ends that ask for the same point', () => {
    // The first keeps its request, the second gives way — so an edge that can run
    // straight to the middle of a side keeps running straight.
    expect(spreadPorts([50, 50], 0, 100, 14)).toEqual([50, 64]);
  });

  it('keeps the straight edge straight when the other end asks from far off', () => {
    // A node whose side spans [502, 556]: one edge wants 502 (its far end is away to
    // one side, so the request is clamped), the other wants the centre at 529.
    expect(spreadPorts([502, 529], 502, 556, 14)).toEqual([502, 529]);
  });

  it('never leaves the usable span', () => {
    const spread = spreadPorts([-100, 0, 500], 0, 100, 14);
    for (const position of spread) {
      expect(position).toBeGreaterThanOrEqual(0);
      expect(position).toBeLessThanOrEqual(100);
    }
  });

  it('tightens the gap rather than overflow a short side', () => {
    // Five ends on a 20px span cannot be 14 apart; 5 apart is what fits.
    const spread = spreadPorts([0, 0, 0, 0, 0], 0, 20, 14);
    expect(spread).toEqual([0, 5, 10, 15, 20]);
  });

  it('keeps the given order, so spreading cannot make two edges cross', () => {
    const spread = spreadPorts([10, 12, 14, 16], 0, 100, 20);
    for (let i = 1; i < spread.length; i++) {
      expect(spread[i]).toBeGreaterThan(spread[i - 1]);
    }
  });

  it('pulls a block back inside the span from the far end', () => {
    // All four want the top of the span; they end up filling it downwards.
    expect(spreadPorts([100, 100, 100, 100], 0, 100, 14)).toEqual([58, 72, 86, 100]);
  });

  it('leaves a lone end exactly where it asked', () => {
    expect(spreadPorts([37], 0, 100, 14)).toEqual([37]);
  });
});
