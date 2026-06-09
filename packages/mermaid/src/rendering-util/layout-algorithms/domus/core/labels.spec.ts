import { describe, it, expect } from 'vitest';
import { EDGE_LABEL_NODE_PREFIX, isEdgeLabelNode, isEdgeLabelNodeId } from './labels.js';

describe('domus/core/labels dummy nodes', () => {
  it('detects edge-label dummy node IDs', () => {
    expect(isEdgeLabelNodeId(`${EDGE_LABEL_NODE_PREFIX}foo`)).toBe(true);
    expect(isEdgeLabelNodeId('foo')).toBe(false);
  });

  it('detects edge-label dummy nodes', () => {
    expect(isEdgeLabelNode({ id: `${EDGE_LABEL_NODE_PREFIX}x` } as any)).toBe(true);
    expect(isEdgeLabelNode({ id: 'x' } as any)).toBe(false);
    expect(isEdgeLabelNode(null)).toBe(false);
  });
});
