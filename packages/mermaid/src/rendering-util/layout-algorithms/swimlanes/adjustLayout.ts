import type { LayoutData } from '../../types.js';
import { positionNode } from '../../rendering-elements/nodes.js';
import type { D3Selection } from '../../../types.js';
import { insertCluster } from '../../rendering-elements/clusters.js';
import {
  edgeLabels,
  insertEdge,
  insertEdgeLabel,
  terminalLabels,
} from '../../rendering-elements/edges.js';
import { applyLineJumpsToSvg } from '../../rendering-elements/lineJump.js';
import { log } from '../../../logger.js';
import { getSubGraphTitleMargins } from '../../../utils/subGraphTitleMargins.js';
import { getConfig } from '../../../config.js';
import utils from '../../../utils.js';

export async function adjustLayout(
  data4Layout: LayoutData,
  groups: {
    edgePaths: D3Selection<SVGGElement>;
    rootGroups: D3Selection<SVGGElement>;
    [key: string]: D3Selection<SVGGElement>;
    edgeLabels: D3Selection<SVGGElement>;
  }
): Promise<void> {
  // Render clusters and position nodes; this also populates node.intersect on shapes.
  for (const node of data4Layout.nodes) {
    if (node.isGroup) {
      await insertCluster(groups.clusters, node);
    } else {
      positionNode(node);
    }
  }

  // Build a lookup so we can pass full node objects (with intersect) to insertEdge,
  // matching the behavior of the dagre-based pipeline.
  const nodeById = new Map<string, any>();
  for (const node of data4Layout.nodes) {
    if (node?.id) {
      nodeById.set(node.id, node);
    }
  }

  for (const edge of data4Layout.edges) {
    const startNode = edge.start ? (nodeById.get(edge.start) ?? {}) : {};
    const endNode = edge.end ? (nodeById.get(edge.end) ?? {}) : {};

    const paths = insertEdge(
      groups.edgePaths,
      { ...edge },
      {},
      data4Layout.type,
      startNode,
      endNode,
      data4Layout.diagramId
    );
    if (edge.label) {
      await insertEdgeLabel(groups.rootGroups, edge);
    }

    if (edge.label) {
      positionEdgeLabel(edge, paths);
    }
  }

  // Render-time post-processing: replace edge crossings with line hops.
  // Default: 'arc'. Set swimlane.lineHops = false to opt out.
  const lineHopsConfig = data4Layout.config?.swimlane?.lineHops;
  if (lineHopsConfig !== false) {
    const jumpStyle: 'arc' | 'gap' = lineHopsConfig === 'gap' ? 'gap' : 'arc';
    const edgeGeometries = data4Layout.edges
      .filter((e: any) => Array.isArray(e.points) && e.points.length >= 2)
      .map((e: any) => ({
        id: e.id,
        points: e.points,
        curve: e.curve,
        arrowTypeStart: e.arrowTypeStart,
        arrowTypeEnd: e.arrowTypeEnd,
      }));
    applyLineJumpsToSvg(groups.edgePaths, edgeGeometries, {
      enabled: true,
      jumpRadius: 6,
      jumpStyle,
    });
  }
}

function positionEdgeLabel(edge: any, paths: any) {
  const path = paths?.updatedPath ?? paths?.originalPath;
  const siteConfig = getConfig();
  const { subGraphTitleTotalMargin } = getSubGraphTitleMargins({
    flowchart: siteConfig.flowchart ?? {},
  });
  if (edge.label) {
    const el = edgeLabels.get(edge.id);
    let x = edge.x;
    let y = edge.y;
    if (path) {
      const pos = utils.calcLabelPosition(path);
      log.debug(
        'Moving label ' + edge.label + ' from (',
        x,
        ',',
        y,
        ') to (',
        pos.x,
        ',',
        pos.y,
        ') abc88'
      );
      if (paths) {
        x = pos.x;
        y = pos.y;
      }
    }
    el.attr('transform', `translate(${x}, ${y + subGraphTitleTotalMargin / 2})`);
  }

  if (edge?.startLabelLeft) {
    const el = terminalLabels.get(edge.id).startLeft;
    let x = edge?.x;
    let y = edge?.y;
    if (path) {
      const pos = utils.calcTerminalLabelPosition(edge.arrowTypeStart ? 10 : 0, 'start_left', path);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', `translate(${x}, ${y})`);
  }
  if (edge.startLabelRight) {
    const el = terminalLabels.get(edge.id).startRight;
    let x = edge.x;
    let y = edge.y;
    if (path) {
      const pos = utils.calcTerminalLabelPosition(
        edge.arrowTypeStart ? 10 : 0,
        'start_right',
        path
      );
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', `translate(${x}, ${y})`);
  }
  if (edge.endLabelLeft) {
    const el = terminalLabels.get(edge.id).endLeft;
    let x = edge.x;
    let y = edge.y;
    if (path) {
      const pos = utils.calcTerminalLabelPosition(edge.arrowTypeEnd ? 10 : 0, 'end_left', path);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', `translate(${x}, ${y})`);
  }
  if (edge.endLabelRight) {
    const el = terminalLabels.get(edge.id).endRight;
    let x = edge.x;
    let y = edge.y;
    if (path) {
      const pos = utils.calcTerminalLabelPosition(edge.arrowTypeEnd ? 10 : 0, 'end_right', path);
      x = pos.x;
      y = pos.y;
    }
    el.attr('transform', `translate(${x}, ${y})`);
  }
}
