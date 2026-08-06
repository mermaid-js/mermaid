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
  // Reserve a band at the top of each titled subgraph for its title. `clusters.ts`
  // paints the title inside the frame at `top + subGraphTitleTopMargin`, so without
  // this the topmost child sits under the title text (e.g. domus/decoupled-subgraph:
  // node "D" under the "hello" title). This runs in paint only — DOMUS placement and
  // routing (and the DOM-free validator that scores them) never see the grown frame,
  // so it fixes the render without perturbing the layout score. The frame grows
  // upward (top moves up, bottom and every child stay put). The DOM-free layout never
  // measures the title, so its height is estimated from the flowchart font size
  // (one rendered line ≈ 1.5 × fontSize), matching the browser's single-line title.
  const siteConfig = getConfig();
  const { subGraphTitleTotalMargin } = getSubGraphTitleMargins({
    flowchart: siteConfig.flowchart ?? {},
  });
  const titleFontSize = Number((siteConfig as { fontSize?: unknown }).fontSize) || 16;
  const titleBand = Math.round(titleFontSize * 1.5) + subGraphTitleTotalMargin;
  for (const node of data4Layout.nodes) {
    const label = (node as { label?: unknown }).label;
    if (node.isGroup && titleBand > 0 && typeof label === 'string' && label.trim() !== '') {
      node.height = (node.height ?? 0) + titleBand;
      node.y = (node.y ?? 0) - titleBand / 2;
    }
  }

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
      { ...edge, layoutAlgorithm: data4Layout.layoutAlgorithm },
      {},
      data4Layout.type,
      startNode,
      endNode,
      data4Layout.diagramId,
      // DOMUS emits final, node-attached, validated polylines. Paint must not
      // re-clip or re-cut them (that recomputed geometry the validator never saw
      // and manufactured artifacts like border-hugging). Draw them verbatim.
      true
    );
    if (edge.label && !(data4Layout.config as { isLabelNode?: boolean }).isLabelNode) {
      await insertEdgeLabel(groups.rootGroups, edge);
    }

    if (edge.label && !(data4Layout.config as { isLabelNode?: boolean }).isLabelNode) {
      positionEdgeLabel(edge, paths);
    }
  }

  // Render-time post-processing: replace edge crossings with line hops.
  // Default: 'arc'. Set flowchart.lineHops = false to opt out.
  const lineHopsConfig = (
    data4Layout.config?.flowchart as { lineHops?: 'arc' | 'gap' | boolean } | undefined
  )?.lineHops;
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
    // DOMUS computes an authoritative label anchor (edge.x/edge.y) that
    // validateLayout scores. Honor it so the painted label sits exactly where
    // it was validated. Only fall back to the path midpoint when no finite
    // anchor exists. (This branch previously ran on `if (paths)` — always
    // truthy — so the label was ALWAYS placed at the midpoint and never at
    // edge.x/edge.y, diverging paint from validation.)
    if ((!Number.isFinite(x) || !Number.isFinite(y)) && path) {
      const pos = utils.calcLabelPosition(path);
      log.debug('Label ' + edge.label + ' has no finite anchor; using path midpoint abc88', pos);
      x = pos.x;
      y = pos.y;
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
