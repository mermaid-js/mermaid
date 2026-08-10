/**
 * `LayoutMermaidFlowchartWithHola` — the master pipeline (guide §8).
 *
 *     flatten → split into components → run the full connected algorithm on
 *     each independently → restore parallel edges, self-loops and labels →
 *     pack left to right → write back
 *
 * DOM-free: it reads the sizes measured earlier and writes `node.x/y` and
 * `edge.points`.
 */

import { log } from '../../../logger.js';
import type { LayoutData } from '../../types.js';
import type { Bounds, DeferredEdge, HolaNode, Point } from './model.js';
import { resolveOptions, deriveBaseEdgeLength } from './options.js';
import type { HolaOptions } from './options.js';
import { DiagnosticCollector } from './diagnostics.js';
import type { HolaDiagnostic } from './diagnostics.js';
import { flattenFlowchart } from './adapter/flattenFlowchart.js';
import { placeEdgeLabels } from './adapter/labels.js';
import { packComponentsLeftToRight, weaklyConnectedComponents } from './components/components.js';
import { layoutConnectedHola } from './connected/layoutConnectedHola.js';
import type { ConnectedLayoutResult } from './connected/layoutConnectedHola.js';

export interface HolaFaithfulResult {
  diagnostics: HolaDiagnostic[];
  bounds?: Bounds;
  componentCount: number;
}

export function runHolaFaithfulLayoutCore(
  data: LayoutData,
  overrides?: Partial<HolaOptions>
): HolaFaithfulResult {
  const diagnostics = new DiagnosticCollector();
  const baseOptions = resolveOptions(overrides);

  const flat = flattenFlowchart(data, diagnostics);
  if (flat.graph.nodes.size === 0) {
    return { diagnostics: diagnostics.all(), componentCount: 0 };
  }

  const options: HolaOptions = {
    ...baseOptions,
    baseEdgeLength: deriveBaseEdgeLength([...flat.graph.nodes.values()], baseOptions),
  };

  const components = weaklyConnectedComponents(flat.graph);
  const selfLoopsByNode = new Map<string, DeferredEdge[]>();
  for (const loop of flat.selfLoops) {
    const list = selfLoopsByNode.get(loop.source);
    if (list) {
      list.push(loop);
    } else {
      selfLoopsByNode.set(loop.source, [loop]);
    }
  }

  const results: ConnectedLayoutResult[] = [];
  for (const component of components) {
    const selfLoops: DeferredEdge[] = [];
    for (const id of component.graph.nodes.keys()) {
      selfLoops.push(...(selfLoopsByNode.get(id) ?? []));
    }
    results.push(
      layoutConnectedHola({
        componentId: component.id,
        graph: component.graph,
        options,
        diagnostics,
        selfLoops,
      })
    );
  }

  // Labels are placed per component, before packing, so a rigid translation
  // moves them with everything else.
  const labelsByComponent = results.map((result) =>
    placeEdgeLabels(
      result.edges
        .map((edge) => {
          const info = flat.labels.get(edge.originalEdgeId);
          return info
            ? {
                originalEdgeId: edge.originalEdgeId,
                width: info.width,
                height: info.height,
                route: edge.points,
              }
            : undefined;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined),
      options.edgeLabelOffset
    )
  );

  const bounds = packComponentsLeftToRight(
    results.map((result, index) => ({
      bounds: result.bounds,
      translate: (dx: number, dy: number) =>
        translateComponent(result, labelsByComponent[index], dx, dy),
    })),
    Math.max(options.componentGap, 2 * options.baseEdgeLength)
  );

  writeBack(data, results, labelsByComponent, flat.originalNodes);

  log.debug(
    `[hola-faithful] ${components.length} component(s), ${flat.graph.nodes.size} nodes, ` +
      `${diagnostics.length} diagnostic(s)`
  );

  return { diagnostics: diagnostics.all(), bounds, componentCount: components.length };
}

function translateComponent(
  result: ConnectedLayoutResult,
  labels: { originalEdgeId: string; x: number; y: number }[],
  dx: number,
  dy: number
): void {
  for (const node of result.nodes.values()) {
    node.x += dx;
    node.y += dy;
  }
  for (const edge of result.edges) {
    edge.points = edge.points.map((p: Point) => ({ x: p.x + dx, y: p.y + dy }));
  }
  for (const label of labels) {
    label.x += dx;
    label.y += dy;
  }
}

/**
 * Parallel edges are merged into a single topological edge, so a route is
 * produced in *that* edge's direction. An original edge declared the other way
 * round (`b --> a` folded into the topological `a—b`) must still be handed back
 * running from its own start node to its own end node: the first point is what
 * the renderer treats as the tail and the last is where it puts the arrowhead.
 */
function orientRoute(
  route: { points: Point[]; source: string; target: string },
  start?: string,
  end?: string
): Point[] {
  const reversed = route.source !== route.target && start === route.target && end === route.source;
  return reversed ? [...route.points].reverse() : route.points;
}

function writeBack(
  data: LayoutData,
  results: ConnectedLayoutResult[],
  labels: { originalEdgeId: string; x: number; y: number }[][],
  originalNodes: Map<string, { id: string }>
): void {
  const positioned = new Map<string, HolaNode>();
  for (const result of results) {
    for (const [id, node] of result.nodes) {
      positioned.set(id, node);
    }
  }

  for (const node of data.nodes) {
    const laid = positioned.get(node.id);
    if (laid) {
      node.x = laid.x;
      node.y = laid.y;
    }
  }

  // Subgraph containers are not rendered in this version (guide §3.2).
  data.nodes = data.nodes.filter((node) => node.isGroup !== true);
  for (const node of data.nodes) {
    node.parentId = undefined;
  }

  const routes = new Map<string, { points: Point[]; source: string; target: string }>();
  for (const result of results) {
    for (const edge of result.edges) {
      routes.set(edge.originalEdgeId, {
        points: edge.points,
        source: edge.source,
        target: edge.target,
      });
    }
  }
  const labelPositions = new Map<string, { x: number; y: number }>();
  for (const list of labels) {
    for (const label of list) {
      labelPositions.set(label.originalEdgeId, label);
    }
  }

  const kept = [];
  for (const edge of data.edges) {
    const route = routes.get(edge.id);
    if (!route) {
      // An edge with a subgraph-container endpoint, or one whose component
      // failed: omit it rather than draw something meaningless.
      continue;
    }
    edge.points = orientRoute(route, edge.start, edge.end);
    edge.hasIntersectionPoints = true;
    const label = labelPositions.get(edge.id);
    if (label) {
      edge.x = label.x;
      edge.y = label.y;
    }
    kept.push(edge);
  }
  data.edges = kept;

  void originalNodes;
}
