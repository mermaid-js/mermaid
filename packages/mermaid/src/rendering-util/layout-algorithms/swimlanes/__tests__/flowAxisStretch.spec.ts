import { describe, expect, it } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { flowAxisStretch } from '../direction/lrTransform.js';

type LayoutNodes = NonNullable<LayoutData['nodes']>;

const HOST_SIZE = { width: 100, height: 40 };
const HOST_STRETCH = HOST_SIZE.width / HOST_SIZE.height;
// Small and square, like a boundary event: counting it would pull the average width down.
const ANCHORED_SIZE = { width: 36, height: 36 };
const LABEL_SIZE = { width: 400, height: 21 };
const GROUP_SIZE = { width: 600, height: 400 };

const host: LayoutNodes[number] = { id: 'host', isGroup: false, ...HOST_SIZE };

describe('flowAxisStretch', () => {
  it('is the average node width over the average node height', () => {
    expect(flowAxisStretch([host])).toBe(HOST_STRETCH);
  });

  it('does not count an anchored node', () => {
    const anchored: LayoutNodes[number] = {
      id: 'anchored',
      isGroup: false,
      ...ANCHORED_SIZE,
      metadata: { anchorTo: { hostId: host.id } },
    };

    expect(flowAxisStretch([host, anchored])).toBe(HOST_STRETCH);
  });

  it('counts a node that merely sits next to the host', () => {
    const neighbour: LayoutNodes[number] = { id: 'neighbour', isGroup: false, ...ANCHORED_SIZE };

    expect(flowAxisStretch([host, neighbour])).toBeLessThan(HOST_STRETCH);
  });

  it('does not count an edge label or a group', () => {
    const label: LayoutNodes[number] = {
      id: 'label',
      isGroup: false,
      isEdgeLabel: true,
      ...LABEL_SIZE,
    };
    const group: LayoutNodes[number] = { id: 'group', isGroup: true, ...GROUP_SIZE };

    expect(flowAxisStretch([host, label, group])).toBe(HOST_STRETCH);
  });

  it('never goes below 1', () => {
    const tall: LayoutNodes[number] = { id: 'tall', isGroup: false, width: 20, height: 80 };

    expect(flowAxisStretch([tall])).toBe(1);
  });

  it('is 1 when there is nothing to measure', () => {
    expect(flowAxisStretch([])).toBe(1);
  });
});
