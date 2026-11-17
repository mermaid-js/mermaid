import { select } from 'd3';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type {
  ComponentDB,
  ComponentLayoutCluster,
  ComponentLayoutData,
  ComponentLayoutEdge,
  ComponentLayoutNode,
} from './componentTypes.js';
import utils from '../../utils.js';

export const componentDomId = (diagramId: string, modelId: string): string => {
  const [safeDiagramId, safeModelId] = [diagramId, modelId].map(
    (value) => value.replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'element'
  );
  return `component-${safeDiagramId}-${safeModelId}`;
};

const componentNodeDomId = (modelId: string): string =>
  `component-${modelId.replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'element'}`;

export const getComponentNodeAccessibleName = (node: ComponentLayoutNode): string => {
  const label = node.label ?? node.id;
  if (node.shape === 'note') {
    return `Note for ${node.noteTargetLabel ?? node.noteTarget ?? ''}: ${label}`;
  }
  if (node.shape === 'umlInterface') {
    return `interface ${label}`;
  }
  if (node.shape === 'umlPort') {
    return `port ${label}`;
  }
  if (node.shape === 'usecaseActor') {
    return `actor ${label}${node.stereotype ? `, stereotype ${node.stereotype}` : ''}`;
  }
  const stereotype = node.stereotype ? `, stereotype ${node.stereotype}` : '';
  return `component ${label}${stereotype}`;
};

export const getComponentEdgeAccessibleName = (edge: ComponentLayoutEdge): string => {
  if (edge.relationKind === 'note') {
    return '';
  }
  const label = edge.label ? ` ${edge.label}` : '';
  return `${edge.relationKind}${label} from ${edge.sourceLabel} to ${edge.targetLabel}`;
};

export const getComponentBoundaryAccessibleName = (node: ComponentLayoutCluster): string =>
  `${node.boundaryType === 'package' ? 'package' : 'component'} ${node.label ?? node.id}`;

const escapeMarkdownMarkers = (label: string): string => label.replace(/([*[\\\]_`])/g, '\\$1');

const prepareComponentLayoutData = (
  data: ComponentLayoutData,
  diagramId: string
): ComponentLayoutData => {
  data.diagramId = diagramId;
  for (const node of data.nodes) {
    node.domId = componentNodeDomId(node.id);
    // A shape label with `stereotype` set takes the generic stacked-label path, which
    // drops the « » marks; fold it into the label instead, as UML writes it.
    // The actor shape draws its own stereotype line.
    if (node.stereotype && node.shape !== 'usecaseActor') {
      const label = node.label ?? node.id;
      node.label = node.isGroup
        ? `«${node.stereotype}» ${label}`
        : `«${escapeMarkdownMarkers(node.stereotype)}»<br/>${escapeMarkdownMarkers(label)}`;
      if (!node.isGroup) {
        node.labelType = 'markdown';
      }
      delete node.stereotype;
    }
  }
  return data;
};

const annotateComponentElements = (
  svg: SVG,
  data: ComponentLayoutData,
  nodeNames: ReadonlyMap<string, string>
): void => {
  for (const node of data.nodes) {
    const stableDomId =
      typeof node.domId === 'string' ? node.domId : componentDomId(data.diagramId, node.id);
    const element = svg.select<SVGGElement>(`#${stableDomId}`);
    const accessibleName = nodeNames.get(node.id) ?? '';
    element
      .attr('data-component-id', node.id)
      .attr('role', 'img')
      .attr('aria-label', accessibleName);
  }

  const edgesById = new Map(data.edges.map((edge) => [edge.id, edge]));
  svg.selectAll<SVGPathElement, unknown>('path[data-et="edge"]').each(function () {
    const edge = edgesById.get(this.getAttribute('data-id') ?? '');
    if (!edge) {
      return;
    }
    const path = select(this);
    path.attr('id', componentDomId(data.diagramId, edge.id)).attr('data-component-id', edge.id);
    if (edge.internal) {
      path.attr('aria-hidden', 'true');
    } else {
      path.attr('role', 'img').attr('aria-label', getComponentEdgeAccessibleName(edge));
    }
  });
};

const NUMBER_PAIR = /(-?\d*\.?\d+(?:e[+-]?\d+)?)[ ,](-?\d*\.?\d+(?:e[+-]?\d+)?)/gi;

/**
 * Layout places a port as an ordinary child inside its component. Slide it along the
 * axis its edge leaves on until it sits on the component's border, and move the edge's
 * end point by the same amount so the edge stays straight.
 */
const snapPortsToBorders = (svg: SVG, data: ComponentLayoutData): void => {
  const horizontal = data.direction === 'LR' || data.direction === 'RL';
  const byId = new Map(data.nodes.map((node) => [node.id, node]));
  const axis = horizontal ? 'x' : 'y';
  const span = horizontal ? 'width' : 'height';

  for (const port of data.nodes) {
    const parent = port.parentId ? byId.get(port.parentId) : undefined;
    if (port.shape !== 'umlPort' || !parent || port[axis] === undefined) {
      continue;
    }
    const parentCenter = parent[axis];
    const parentSpan = parent[span];
    if (parentCenter === undefined || parentSpan === undefined) {
      continue;
    }
    const attached = data.edges.filter((edge) => edge.start === port.id || edge.end === port.id);
    const farSide = attached.some((edge) => {
      const other = byId.get(edge.start === port.id ? edge.end : edge.start)?.[axis];
      return other === undefined || other >= parentCenter;
    });
    const border = parentCenter + (farSide || attached.length === 0 ? 1 : -1) * (parentSpan / 2);
    const delta = border - port[axis];

    const paths = attached.map((edge) => ({
      edge,
      path: svg.select<SVGPathElement>(
        `path[data-et="edge"][data-id="${edge.id.replace(/["\\]/g, '\\$&')}"]`
      ),
    }));
    const edits = paths.map(({ edge, path }) => {
      const d = path.attr('d') ?? '';
      const pairs = [...d.matchAll(NUMBER_PAIR)].map((match) => ({
        index: match.index,
        length: match[0].length,
        point: [Number(match[1]), Number(match[2])],
      }));
      const ordered = edge.start === port.id ? pairs : [...pairs].reverse();
      const along = horizontal ? 0 : 1;
      const across = 1 - along;
      // The straight run the edge leaves the port on, before its first bend.
      const run = [ordered[0]];
      for (const pair of ordered.slice(1)) {
        if (Math.abs(pair.point[across] - ordered[0].point[across]) >= 0.5) {
          break;
        }
        run.push(pair);
      }
      const limit = run.at(-1);
      if (!limit || run.length < 2) {
        return undefined;
      }
      const start = ordered[0].point[along];
      const moved = start + delta;
      const heading = Math.sign(limit.point[along] - start);
      // Moving the end past the bend would fold the edge back over itself.
      if (heading === 0 || Math.sign(limit.point[along] - moved) !== heading) {
        return undefined;
      }
      for (const pair of run) {
        if (pair === ordered[0] || Math.sign(pair.point[along] - moved) !== heading) {
          pair.point[along] = moved;
        }
      }
      let next = d;
      for (const pair of [...run].sort((a, b) => b.index - a.index)) {
        next =
          next.slice(0, pair.index) +
          `${pair.point[0]},${pair.point[1]}` +
          next.slice(pair.index + pair.length);
      }
      return { path, d: next };
    });
    if (edits.includes(undefined)) {
      continue;
    }

    port[axis] = border;
    const element = svg.select<SVGGElement>(`#${port.domId!}`);
    element.attr('transform', `translate(${port.x ?? 0}, ${port.y ?? 0})`);
    for (const edit of edits) {
      edit?.path.attr('d', edit.d);
    }
  }
};

const draw: DrawDefinition = async (_text, id, _version, diag) => {
  log.info('Drawing component diagram (unified)', id);
  const { layout } = getConfig();

  const componentDb = diag.db as ComponentDB;
  const data4Layout = componentDb.getData();
  const svg = getDiagramElement(id, data4Layout.config.securityLevel);

  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  const nodeNames = new Map(
    data4Layout.nodes.map((node) => [
      node.id,
      node.isGroup
        ? getComponentBoundaryAccessibleName(node)
        : getComponentNodeAccessibleName(node),
    ])
  );
  prepareComponentLayoutData(data4Layout, id);

  await render(data4Layout, svg);
  if (data4Layout.config.look !== 'handDrawn') {
    snapPortsToBorders(svg, data4Layout);
  }
  annotateComponentElements(svg, data4Layout, nodeNames);

  const padding = data4Layout.diagramPadding;
  utils.insertTitle(svg, 'componentDiagramTitleText', 0, componentDb.getDiagramTitle?.() ?? '');
  setupViewPortForSVG(svg, padding, 'componentDiagram', data4Layout.useMaxWidth);
};

export const renderer = { draw };
