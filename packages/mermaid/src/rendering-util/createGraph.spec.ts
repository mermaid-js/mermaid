/**
 * Cluster-label measurement.
 *
 * `insertCluster` paints a plain cluster label through `createLabel`, which uses
 * an infinite width, while `labelHelper` falls back to `flowchart.wrappingWidth`
 * (200px) when `node.width` is undefined. Layouts that size a compound node from
 * the measured label — ELK does — therefore measured something narrower than what
 * gets painted. `unwrapGroupLabels` lets such a layout ask for the measurement to
 * match the paint, without core having to know which layout is running.
 */
import { describe, expect, vi } from 'vitest';
import { jsdomIt } from '../tests/util.js';
import type { ClusterNode } from './types.js';

const labelHelper = vi.hoisted(() =>
  vi.fn((_parent: unknown, _node: { width?: number }) =>
    Promise.resolve({
      shapeSvg: { remove: () => undefined },
      bbox: { width: 0, height: 0 },
    })
  )
);

vi.mock('./rendering-elements/shapes/util.js', () => ({ labelHelper }));

const { createGraphWithElements } = await import('./createGraph.js');
const { select } = await import('d3');

const groupNode = (overrides: Partial<ClusterNode> = {}) =>
  ({
    id: 'grp',
    isGroup: true,
    label: 'A cluster label that is wider than two hundred pixels',
    labelType: 'text',
    padding: 8,
    ...overrides,
  }) as ClusterNode;

const layoutData = (node: ClusterNode) =>
  ({
    nodes: [node],
    edges: [],
    config: {},
    type: 'flowchart-v2',
  }) as never;

describe('createGraphWithElements — cluster label measurement', () => {
  jsdomIt('measures wrapped by default, so dagre is untouched', async ({ svg }) => {
    labelHelper.mockClear();
    await createGraphWithElements(select(svg.node()!) as never, layoutData(groupNode()));

    expect(labelHelper).toHaveBeenCalledTimes(1);
    expect(labelHelper.mock.calls[0][1].width).toBeUndefined();
  });

  jsdomIt('measures unwrapped when the layout asks for it', async ({ svg }) => {
    labelHelper.mockClear();
    await createGraphWithElements(select(svg.node()!) as never, layoutData(groupNode()), {
      unwrapGroupLabels: true,
    });

    expect(labelHelper.mock.calls[0][1].width).toBe(Number.POSITIVE_INFINITY);
  });

  jsdomIt('keeps markdown labels wrapped — those are the ones meant to wrap', async ({ svg }) => {
    labelHelper.mockClear();
    await createGraphWithElements(
      select(svg.node()!) as never,
      layoutData(groupNode({ labelType: 'markdown' })),
      { unwrapGroupLabels: true }
    );

    expect(labelHelper.mock.calls[0][1].width).toBeUndefined();
  });
});
