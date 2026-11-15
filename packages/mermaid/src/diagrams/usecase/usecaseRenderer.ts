import { select } from 'd3';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { markdownToLines } from '../../rendering-util/handle-markdown-text.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { UsecaseLayoutData, UsecaseLayoutEdge, UsecaseLayoutNode } from './usecaseTypes.js';
import utils from '../../utils.js';
import type { UsecaseDB } from './usecaseTypes.js';

export const USECASE_MARKERS: UsecaseLayoutData['markers'] = [
  'point',
  'circle',
  'cross',
  'extension',
];

const ACTOR_SHAPES: Record<string, true> = {
  usecaseActor: true,
  usecaseActorHollow: true,
  usecaseActorAwesome: true,
  usecaseActorIcon: true,
};

export const usecaseDomId = (diagramId: string, modelId: string): string => {
  const [safeDiagramId, safeModelId] = [diagramId, modelId].map(
    (value) => value.replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'element'
  );
  return `usecase-${safeDiagramId}-${safeModelId}`;
};

const usecaseNodeDomId = (modelId: string): string =>
  `usecase-${modelId.replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'element'}`;

const getAccessibleLabel = (label: string, labelType?: string): string => {
  if (labelType !== 'markdown') {
    return label;
  }
  return markdownToLines(label)
    .map((line) => line.map((word) => word.content).join(' '))
    .join('\n');
};

export const getUsecaseNodeAccessibleName = (node: UsecaseLayoutNode): string => {
  const label = getAccessibleLabel(node.label ?? node.id, node.labelType);
  if (ACTOR_SHAPES[node.shape]) {
    const variant = node.actorType && node.actorType !== 'normal' ? `${node.actorType} ` : '';
    const business = node.business ? 'business ' : '';
    const stereotype = node.stereotype ? `, stereotype ${node.stereotype}` : '';
    return `${business}${variant}actor ${label}${stereotype}`;
  }
  if (node.shape === 'note') {
    return `Note for ${node.noteTargetLabel ?? node.noteTarget ?? ''}: ${label}`;
  }
  if (node.shape === 'usecaseJsonTable') {
    const rows = (node.jsonRows ?? [])
      .map((row) => `${row.accessibleKey}: ${row.value}`)
      .join('; ');
    return rows ? `${label}: ${rows}` : label;
  }
  const stereotype = node.stereotype ? `, stereotype ${node.stereotype}` : '';
  return `${node.business ? 'business ' : ''}use case ${label}${stereotype}`;
};

export const getUsecaseBoundaryAccessibleName = (
  boundary: Extract<UsecaseLayoutData['nodes'][number], { isGroup: true }>
): string =>
  `${boundary.boundaryType} system boundary ${getAccessibleLabel(
    boundary.label ?? boundary.id,
    boundary.labelType
  )}`;

export const getUsecaseEdgeAccessibleName = (edge: UsecaseLayoutEdge): string => {
  if (edge.relationshipType === 'note') {
    return '';
  }
  const relation =
    edge.relationshipType === 'association' && edge.label
      ? `association ${getAccessibleLabel(edge.label, edge.labelType)}`
      : edge.relationshipType;
  return `${relation} from ${edge.sourceLabel} to ${edge.targetLabel}`;
};

const escapePlainLabel = (label: string): string =>
  label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeMarkdownMarkers = (label: string): string => label.replace(/([*[\\\]_`])/g, '\\$1');

interface UsecaseAccessibleNames {
  nodes: ReadonlyMap<string, string>;
  edges: ReadonlyMap<string, string>;
}

type UsecaseRenderingNode = UsecaseLayoutData['nodes'][number] & {
  hasFoldedStereotype?: boolean;
};

export const prepareUsecaseLayoutData = (
  data: UsecaseLayoutData,
  diagramId: string
): UsecaseLayoutData => {
  data.diagramId = diagramId;
  data.markers = [...USECASE_MARKERS];
  for (const node of data.nodes) {
    const renderingNode = node as UsecaseRenderingNode;
    renderingNode.domId = usecaseNodeDomId(node.id);
    if (node.label !== undefined && node.labelType === 'text') {
      node.label = escapePlainLabel(node.label);
    }
    if (node.stereotype) {
      node.stereotype = escapePlainLabel(node.stereotype);
    }
    if (!node.isGroup && node.shape === 'usecaseJsonTable') {
      node.jsonRows = node.jsonRows?.map((row) => ({
        ...row,
        key: escapePlainLabel(row.key),
        value: escapePlainLabel(row.value),
      }));
    }
    if (
      !node.isGroup &&
      (node.shape === 'usecaseEllipse' || node.shape === 'rect') &&
      node.stereotype
    ) {
      const label = node.label ?? escapePlainLabel(node.id);
      node.label = `«${escapeMarkdownMarkers(node.stereotype)}»<br/>${
        node.labelType === 'text' ? escapeMarkdownMarkers(label) : label
      }`;
      node.labelType = 'markdown';
      renderingNode.hasFoldedStereotype = true;
      delete node.stereotype;
    }
  }
  for (const edge of data.edges) {
    if (edge.label !== undefined && edge.labelType === 'text') {
      edge.label = escapePlainLabel(edge.label);
    }
  }
  return data;
};

const annotateUsecaseElements = (
  svg: SVG,
  data: UsecaseLayoutData,
  accessibleNames: UsecaseAccessibleNames
) => {
  for (const node of data.nodes) {
    const stableDomId =
      typeof node.domId === 'string' ? node.domId : usecaseDomId(data.diagramId, node.id);
    const element = svg.select<SVGGElement>(`#${stableDomId}`);
    const kind = node.isGroup
      ? 'boundary'
      : ACTOR_SHAPES[node.shape]
        ? 'actor'
        : node.shape === 'note'
          ? 'note'
          : node.shape === 'usecaseJsonTable'
            ? 'json'
            : 'usecase';
    const accessibleName = accessibleNames.nodes.get(node.id) ?? node.id;
    element
      .attr('data-usecase-id', node.id)
      .attr('data-usecase-kind', kind)
      .attr('role', 'img')
      .attr('aria-label', accessibleName);
    if (
      !node.isGroup &&
      (node.shape === 'usecaseEllipse' || node.shape === 'rect') &&
      'hasFoldedStereotype' in node &&
      node.hasFoldedStereotype === true
    ) {
      const root = element.node();
      const htmlLabel = root?.querySelector('.nodeLabel');
      const container = htmlLabel?.querySelector('p') ?? htmlLabel;
      const firstLabelNode = container?.firstChild;
      if (container && firstLabelNode?.nodeType === 3) {
        const stereotype = container.ownerDocument.createElement('span');
        stereotype.className = 'usecase-stereotype';
        container.insertBefore(stereotype, firstLabelNode);
        stereotype.appendChild(firstLabelNode);
      } else {
        root
          ?.querySelector('.label tspan tspan, .label tspan')
          ?.classList.add('usecase-stereotype');
      }
    }
  }

  // Index the edges by id so the paths are matched in a single pass instead of
  // re-scanning every path for each edge.
  const edgesById = new Map(data.edges.map((edge) => [edge.id, edge]));
  svg.selectAll<SVGPathElement, unknown>('path[data-et="edge"]').each(function () {
    const edge = edgesById.get(this.getAttribute('data-id') ?? '');
    if (!edge) {
      return;
    }
    const path = select(this);
    path
      .attr('id', usecaseDomId(data.diagramId, edge.id))
      .attr('data-usecase-id', edge.id)
      .attr('data-usecase-kind', edge.internal ? 'note-connector' : 'relationship');
    if (edge.internal) {
      path.attr('aria-hidden', 'true');
    } else {
      path.attr('role', 'img').attr('aria-label', accessibleNames.edges.get(edge.id) ?? edge.id);
    }
  });
};

/**
 * Publishes the configured use-case fonts on the diagram root as the CSS custom properties that
 * `styles.ts` reads through `var(--mermaid-usecase-*, <fallback>)`.
 *
 * This has to be applied twice. The labels are measured while `render` runs, and the measured
 * width is frozen onto each label `foreignObject`; the fonts therefore have to be in force by
 * then. `setupViewPortForSVG` then runs `configureSvgSize`, which assigns the whole `style`
 * attribute (`max-width: …`) and so wipes the custom properties again. Without the second call
 * the finished diagram repaints every label in the fallback font — a different typeface from the
 * one it was measured in — and the wider glyphs spill past the fixed `foreignObject` width, where
 * they are clipped at the trailing edge.
 */
const applyUsecaseFonts = (svg: SVG, data: UsecaseLayoutData): void => {
  svg
    .style('--mermaid-usecase-actor-font-size', `${data.actorFontSize}px`)
    .style('--mermaid-usecase-actor-font-family', data.actorFontFamily)
    .style('--mermaid-usecase-actor-font-weight', data.actorFontWeight)
    .style('--mermaid-usecase-font-size', `${data.usecaseFontSize}px`)
    .style('--mermaid-usecase-font-family', data.usecaseFontFamily)
    .style('--mermaid-usecase-font-weight', data.usecaseFontWeight);
};

/**
 * Main draw function using unified rendering system
 */
const draw: DrawDefinition = async (_text, id, _version, diag) => {
  log.info('Drawing usecase diagram (unified)', id);
  const { layout } = getConfig();

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  const usecaseDb = diag.db as UsecaseDB;
  const data4Layout = usecaseDb.getData();
  const accessibleLabels = new Map(
    data4Layout.nodes.map((node) => [
      node.id,
      getAccessibleLabel(node.label ?? node.id, node.labelType),
    ])
  );
  const accessibleNames: UsecaseAccessibleNames = {
    nodes: new Map(
      data4Layout.nodes.map((node) => [
        node.id,
        node.isGroup
          ? getUsecaseBoundaryAccessibleName(node)
          : getUsecaseNodeAccessibleName(
              node.shape === 'note'
                ? { ...node, noteTargetLabel: accessibleLabels.get(node.noteTarget ?? '') }
                : node
            ),
      ])
    ),
    edges: new Map(
      data4Layout.edges.map((edge) => [
        edge.id,
        getUsecaseEdgeAccessibleName({
          ...edge,
          sourceLabel: accessibleLabels.get(edge.source) ?? edge.sourceLabel,
          targetLabel: accessibleLabels.get(edge.target) ?? edge.targetLabel,
        }),
      ])
    ),
  };
  const svg = getDiagramElement(id, data4Layout.config.securityLevel);

  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  prepareUsecaseLayoutData(data4Layout, id);

  // Set before `render` so the labels are measured in the fonts they will be painted in.
  applyUsecaseFonts(svg, data4Layout);

  await render(data4Layout, svg);
  annotateUsecaseElements(svg, data4Layout, accessibleNames);

  const padding = data4Layout.diagramPadding;
  utils.insertTitle(
    svg,
    'usecaseDiagramTitleText',
    0, // Default title top margin
    usecaseDb.getDiagramTitle?.() ?? ''
  );
  setupViewPortForSVG(svg, padding, 'usecaseDiagram', data4Layout.useMaxWidth);
  // Restore the fonts that `setupViewPortForSVG` just dropped from the `style` attribute.
  applyUsecaseFonts(svg, data4Layout);
};

export const renderer = { draw };
