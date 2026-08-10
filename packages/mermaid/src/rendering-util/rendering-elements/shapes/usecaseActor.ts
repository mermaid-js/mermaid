import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, insertLabel, labelHelper, updateNodeBounds } from './util.js';

export type UsecaseActorVariant = 'normal' | 'hollow' | 'awesome' | 'icon';

export type UsecaseActorNode = Node & {
  labelType?: 'text' | 'markdown';
  actorType?: UsecaseActorVariant;
  icon?: string;
  business?: boolean;
  stereotype?: string;
  accessibleName?: string;
};

const ACTOR_FIGURE_WIDTH = 56;
const ACTOR_FIGURE_HEIGHT = 72;

const ACTOR_LABEL_GAP = 8;
const STEREOTYPE_LABEL_GAP = 2;
const DEFAULT_ACTOR_PADDING = 8;

const variantClass: Record<UsecaseActorVariant, string> = {
  normal: 'usecase-actor-shape usecase-actor-normal',
  hollow: 'usecase-actor-hollow',
  awesome: 'usecase-actor-awesome',
  icon: 'usecase-actor-icon',
};

const BUSINESS_MARKER_ANGLE = Math.PI / 3;
const BUSINESS_MARKER_OFFSET_RATIO = 0.6;

const businessMarkerPathForCircle = (centerY: number, radius: number): string => {
  const centerOffset = radius * BUSINESS_MARKER_OFFSET_RATIO;
  const halfChord = radius * Math.sqrt(1 - BUSINESS_MARKER_OFFSET_RATIO ** 2);
  const directionX = Math.cos(BUSINESS_MARKER_ANGLE);
  const directionY = -Math.sin(BUSINESS_MARKER_ANGLE);
  const centerX = centerOffset * -directionY;
  const markerCenterY = centerY + centerOffset * directionX;
  const deltaX = halfChord * directionX;
  const deltaY = halfChord * directionY;

  return `M ${centerX - deltaX} ${markerCenterY - deltaY} L ${centerX + deltaX} ${
    markerCenterY + deltaY
  }`;
};

const businessMarkerPath: Record<UsecaseActorVariant, string> = {
  normal: businessMarkerPathForCircle(-24, 12),
  hollow: businessMarkerPathForCircle(-23, 9),
  awesome: businessMarkerPathForCircle(-21, 13),
  icon: 'M 12 -8 L 26 -26',
};

interface MeasuredBox {
  width: number;
  height: number;
  x?: number;
  y?: number;
  left?: number;
  top?: number;
}

type ActorGlyphRenderer = (
  group: D3Selection<SVGGElement>,
  node: UsecaseActorNode
) => void | Promise<void>;

const positionLabel = (label: D3Selection<SVGGElement>, bbox: MeasuredBox, centerY: number) => {
  const originX = (bbox.x ?? 0) - (bbox.left ?? 0);
  const originY = (bbox.y ?? 0) - (bbox.top ?? 0);
  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - originX},${centerY - bbox.height / 2 - originY})`
  );
};

export const appendActorPath = (
  group: D3Selection<SVGGElement>,
  node: UsecaseActorNode,
  pathData: string,
  className: string,
  hollow = false
) => {
  if (node.look === 'handDrawn') {
    // @ts-expect-error roughjs accepts the underlying SVG group through a D3 selection at runtime.
    const rc = rough.svg(group);
    const path = rc.path(pathData, userNodeOverrides(node, hollow ? { fill: 'none' } : {}));
    return group.insert(() => path, ':first-child').attr('class', className);
  }

  const path = group.append('path').attr('class', className).attr('d', pathData);
  if (hollow) {
    path.attr('fill', 'none');
  }
  return path;
};

export const appendActorCircle = (
  group: D3Selection<SVGGElement>,
  node: UsecaseActorNode,
  cx: number,
  cy: number,
  radius: number,
  className: string,
  hollow = false
) => {
  if (node.look === 'handDrawn') {
    // @ts-expect-error roughjs accepts the underlying SVG group through a D3 selection at runtime.
    const rc = rough.svg(group);
    const circle = rc.circle(
      cx,
      cy,
      radius * 2,
      userNodeOverrides(node, hollow ? { fill: 'none' } : {})
    );
    return group.insert(() => circle, ':first-child').attr('class', className);
  }

  const circle = group
    .append('circle')
    .attr('class', className)
    .attr('cx', cx)
    .attr('cy', cy)
    .attr('r', radius);
  if (hollow) {
    circle.attr('fill', 'none');
  }
  return circle;
};

const appendBusinessActorMarker = (
  group: D3Selection<SVGGElement>,
  node: UsecaseActorNode,
  variant: UsecaseActorVariant
) => {
  if (!node.business) {
    return;
  }

  group
    .append('path')
    .attr('class', 'usecase-business-marker usecase-actor-business-marker')
    .attr('d', businessMarkerPath[variant])
    .attr('fill', 'none')
    .attr('style', 'stroke: inherit !important; stroke-width: inherit !important');
};

export async function renderUsecaseActor<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: UsecaseActorNode,
  variant: UsecaseActorVariant,
  drawGlyph: ActorGlyphRenderer
): Promise<D3Selection<SVGGElement>> {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  // Generic icon nodes add a background to their label measurement. Actor icons already render
  // their own frame, so measure the shared actor label without that icon-only decoration.
  const labelNode: Node = variant === 'icon' ? { ...node, icon: undefined } : node;
  const {
    shapeSvg,
    bbox: labelBox,
    label,
  } = await labelHelper(
    parent,
    labelNode,
    getNodeClasses(node, `usecase-actor-variant usecase-actor-${variant}`)
  );

  shapeSvg.attr('role', 'img');
  if (node.accessibleName) {
    shapeSvg.attr('aria-label', node.accessibleName);
  }

  label.attr('class', 'label actor-label usecase-actor-label');

  let stereotypeLabel: D3Selection<SVGGElement> | undefined;
  let stereotypeBox: MeasuredBox | undefined;
  if (node.stereotype) {
    const stereotype = await insertLabel(shapeSvg, `«${node.stereotype}»`, {
      labelStyle: labelStyles,
      useHtmlLabels: node.useHtmlLabels,
      padding: 0,
      centerLabel: true,
    });
    stereotypeLabel = stereotype.label.attr('class', 'label usecase-stereotype');
    stereotypeBox = stereotype.bbox;
  }

  const actorGroup = shapeSvg
    .append('g')
    .attr('class', `usecase-actor-glyph ${variantClass[variant]}`)
    .attr('style', nodeStyles || null);
  await drawGlyph(actorGroup, node);
  appendBusinessActorMarker(actorGroup, node, variant);

  const padding = node.padding ?? DEFAULT_ACTOR_PADDING;
  const stereotypeHeight = stereotypeBox?.height ?? 0;
  const contentHeight =
    ACTOR_FIGURE_HEIGHT +
    ACTOR_LABEL_GAP +
    labelBox.height +
    (stereotypeBox ? stereotypeHeight + STEREOTYPE_LABEL_GAP : 0);
  const totalWidth =
    Math.max(ACTOR_FIGURE_WIDTH, labelBox.width, stereotypeBox?.width ?? 0) + padding * 2;
  const totalHeight = contentHeight + padding * 2;
  const contentTop = -contentHeight / 2;

  actorGroup.attr('transform', `translate(0,${contentTop + ACTOR_FIGURE_HEIGHT / 2})`);

  let nextLabelCenter = contentTop + ACTOR_FIGURE_HEIGHT + ACTOR_LABEL_GAP;
  if (stereotypeLabel && stereotypeBox) {
    nextLabelCenter += stereotypeHeight / 2;
    positionLabel(stereotypeLabel, stereotypeBox, nextLabelCenter);
    nextLabelCenter += stereotypeHeight / 2 + STEREOTYPE_LABEL_GAP;
  }
  positionLabel(label, labelBox, nextLabelCenter + labelBox.height / 2);

  const outline = shapeSvg
    .insert('rect', ':first-child')
    .attr('class', 'usecase-actor-outline')
    .attr('x', -totalWidth / 2)
    .attr('y', -totalHeight / 2)
    .attr('width', totalWidth)
    .attr('height', totalHeight)
    .attr('opacity', 0)
    .attr('aria-hidden', 'true');

  updateNodeBounds(node, outline);
  node.intersect = (point) => intersect.rect(node, point);

  return shapeSvg;
}

const STICK_FIGURE_PATH = [
  'M 0 -12',
  'C 6.627 -12 12 -17.373 12 -24',
  'C 12 -30.627 6.627 -36 0 -36',
  'C -6.627 -36 -12 -30.627 -12 -24',
  'C -12 -17.373 -6.627 -12 0 -12 Z',
  'M 0 -12 V 8',
  'M -17 -5 H 17',
  'M 0 8 L -15 28',
  'M 0 8 L 15 28',
].join(' ');

export async function usecaseActor<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  return renderUsecaseActor(parent, node as UsecaseActorNode, 'normal', (group, actorNode) => {
    appendActorPath(group, actorNode, STICK_FIGURE_PATH, 'usecase-actor-stick');
  });
}
