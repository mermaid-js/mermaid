import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { applyLrDirectionTransform } from '../direction/lrTransform.js';
import type { AnchorSide } from '../anchoredNodes.js';

const HOST_WIDTH = 100;
const HOST_HEIGHT = 40;
const ANNOTATION_SIZE = 36;
const ANNOTATION_GAP = 20;
const REACH = ANNOTATION_GAP + ANNOTATION_SIZE;

function layoutWithAnnotation(side: AnchorSide): LayoutData {
  return {
    nodes: [
      { id: 'lane', isGroup: true, padding: 20 },
      {
        id: 'host',
        parentId: 'lane',
        isGroup: false,
        x: 0,
        y: 0,
        width: HOST_WIDTH,
        height: HOST_HEIGHT,
      },
      {
        id: 'note',
        parentId: 'lane',
        isGroup: false,
        width: ANNOTATION_SIZE,
        height: ANNOTATION_SIZE,
        metadata: { anchorTo: { hostId: 'host', side, gap: ANNOTATION_GAP } },
      },
    ],
    edges: [],
  } as unknown as LayoutData;
}

function laneAndHost(layout: LayoutData) {
  const lane = layout.nodes.find((node) => node.id === 'lane')!;
  const host = layout.nodes.find((node) => node.id === 'host')!;
  return { lane, host, contentTop: (lane as { swimlaneContentTop?: number }).swimlaneContentTop! };
}

describe.each(['LR', 'RL'] as const)('%s: room for a node standing off its host', (direction) => {
  const run = (side: AnchorSide) => {
    const layout = layoutWithAnnotation(side);
    applyLrDirectionTransform(layout, direction);
    return laneAndHost(layout);
  };

  const bodyOf = (lane: LayoutData['nodes'][number]) => {
    const title = lane.groupTitleRect!;
    const laneLeft = lane.x! - lane.width! / 2;
    const laneRight = lane.x! + lane.width! / 2;
    return direction === 'LR'
      ? { left: title.right, right: laneRight }
      : { left: laneLeft, right: title.left };
  };

  it('is kept on the left when the node stands off to the left', () => {
    const { lane, host } = run('left');
    expect(bodyOf(lane).left).toBeLessThanOrEqual(host.x! - HOST_WIDTH / 2 - REACH);
  });

  it('is kept on the right when the node stands off to the right', () => {
    const { lane, host } = run('right');
    expect(bodyOf(lane).right).toBeGreaterThanOrEqual(host.x! + HOST_WIDTH / 2 + REACH);
  });

  it('is kept above when the node stands off above', () => {
    const { host, contentTop } = run('top');
    expect(contentTop).toBeLessThanOrEqual(host.y! - HOST_HEIGHT / 2 - REACH);
  });

  it('is kept below when the node stands off below', () => {
    const { lane, host } = run('bottom');
    expect(lane.y! + lane.height! / 2).toBeGreaterThanOrEqual(host.y! + HOST_HEIGHT / 2 + REACH);
  });
});
