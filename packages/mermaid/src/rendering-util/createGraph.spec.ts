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

const insertNode = vi.hoisted(() =>
  vi.fn((_parent: unknown, _node: unknown, _renderOptions: { dir?: string }) =>
    Promise.resolve({ node: () => null })
  )
);

vi.mock('./rendering-elements/nodes.js', () => ({ insertNode }));

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

/**
 * Direction-sensitive shapes (fork/join bars) must know the flow direction to
 * orient themselves perpendicular to it. The dagre path passes each subgraph's
 * rankdir during its recursive render; this generic path resolves the same
 * information from the node, its ancestor groups, or the diagram direction.
 */
describe('createGraphWithElements — node direction resolution', () => {
  const data = (nodes: object[], direction?: string) =>
    ({
      nodes,
      edges: [],
      config: {},
      direction,
      type: 'flowchart-v2',
    }) as never;

  jsdomIt('falls back to the diagram-level direction', async ({ svg }) => {
    insertNode.mockClear();
    await createGraphWithElements(select(svg.node()!) as never, data([{ id: 'a' }], 'LR'));

    expect(insertNode).toHaveBeenCalledTimes(1);
    expect(insertNode.mock.calls[0][2].dir).toBe('LR');
  });

  jsdomIt('prefers the node’s own dir over the diagram direction', async ({ svg }) => {
    insertNode.mockClear();
    await createGraphWithElements(
      select(svg.node()!) as never,
      data([{ id: 'a', dir: 'RL' }], 'TB')
    );

    expect(insertNode.mock.calls[0][2].dir).toBe('RL');
  });

  jsdomIt('inherits the nearest ancestor group’s dir', async ({ svg }) => {
    insertNode.mockClear();
    await createGraphWithElements(
      select(svg.node()!) as never,
      data(
        [
          { id: 'grp', isGroup: true, dir: 'LR', label: '', labelType: 'text' },
          { id: 'a', parentId: 'grp' },
        ],
        'TB'
      )
    );

    expect(insertNode).toHaveBeenCalledTimes(1);
    expect(insertNode.mock.calls[0][2].dir).toBe('LR');
  });

  jsdomIt('leaves dir undefined when nothing declares one', async ({ svg }) => {
    insertNode.mockClear();
    await createGraphWithElements(select(svg.node()!) as never, data([{ id: 'a' }]));

    expect(insertNode.mock.calls[0][2].dir).toBeUndefined();
  });
});
