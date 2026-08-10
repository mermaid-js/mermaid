import rough from 'roughjs';
import type { Bounds, D3Selection, Point } from '../../../types.js';
import type { Node } from '../../types.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, insertLabel, labelHelper, updateNodeBounds } from './util.js';

type BusinessUsecaseNode = Node & {
  business?: boolean;
  stereotype?: string;
  accessibleName?: string;
};

interface MeasuredBox {
  width: number;
  height: number;
  x?: number;
  y?: number;
  left?: number;
  top?: number;
}

const positionLabel = (label: D3Selection<SVGGElement>, bbox: MeasuredBox, centerY: number) => {
  const viewportOffsetX = (bbox.x ?? 0) - (bbox.left ?? 0);
  const viewportOffsetY = (bbox.y ?? 0) - (bbox.top ?? 0);
  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - viewportOffsetX},${centerY - bbox.height / 2 - viewportOffsetY})`
  );
};

export async function usecaseBusiness<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  const businessNode = node as BusinessUsecaseNode;
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const labelNode: Node = businessNode.stereotype ? { ...node, stereotype: undefined } : node;
  const {
    shapeSvg,
    bbox: labelBox,
    halfPadding,
    label,
  } = await labelHelper(parent, labelNode, getNodeClasses(node, 'usecase-business-shape'));

  label.attr('class', 'label usecase-label');
  let stereotypeLabel: D3Selection<SVGGElement> | undefined;
  let stereotypeBox: MeasuredBox | undefined;
  if (businessNode.stereotype) {
    const stereotype = await insertLabel(shapeSvg, `«${businessNode.stereotype}»`, {
      labelStyle: labelStyles,
      useHtmlLabels: node.useHtmlLabels,
      padding: 0,
      centerLabel: true,
    });
    stereotypeLabel = stereotype.label.attr('class', 'label usecase-stereotype');
    stereotypeBox = stereotype.bbox;
  }

  const labelGap = stereotypeBox ? 2 : 0;
  const labelHeight = labelBox.height + (stereotypeBox?.height ?? 0) + labelGap;
  const labelWidth = Math.max(labelBox.width, stereotypeBox?.width ?? 0);
  const padding = halfPadding ?? 10;
  const radiusX = labelWidth / 2 + padding * 2;
  const radiusY = labelHeight / 2 + padding;
  const markerInset = Math.min(Math.max(padding / 5, 1), padding / 2);
  const markerStartX = labelWidth / 2 + markerInset;
  const markerEndX = radiusX - markerInset;
  const normalizedStartX = markerStartX / radiusX;
  const normalizedEndX = markerEndX / radiusX;
  const markerStartY = radiusY * Math.sqrt(Math.max(0, 1 - normalizedStartX * normalizedStartX));
  const markerEndY = -radiusY * Math.sqrt(Math.max(0, 1 - normalizedEndX * normalizedEndX));

  if (stereotypeLabel && stereotypeBox) {
    positionLabel(stereotypeLabel, stereotypeBox, -labelHeight / 2 + stereotypeBox.height / 2);
  }
  positionLabel(label, labelBox, labelHeight / 2 - labelBox.height / 2);

  let ellipseElement;
  if (node.look === 'handDrawn') {
    // @ts-expect-error roughjs accepts the underlying SVG group through a D3 selection at runtime.
    const rc = rough.svg(shapeSvg);
    const roughEllipse = rc.ellipse(0, 0, radiusX * 2, radiusY * 2, userNodeOverrides(node, {}));
    ellipseElement = shapeSvg
      .insert(() => roughEllipse, ':first-child')
      .attr('class', 'basic label-container usecase-business-ellipse');
  } else {
    ellipseElement = shapeSvg
      .insert('ellipse', ':first-child')
      .attr('class', 'basic label-container usecase-business-ellipse')
      .attr('style', nodeStyles)
      .attr('rx', radiusX)
      .attr('ry', radiusY)
      .attr('cx', 0)
      .attr('cy', 0);
  }

  shapeSvg
    .append('path')
    .attr('class', 'usecase-business-marker')
    .attr('d', `M ${markerStartX} ${markerStartY} L ${markerEndX} ${markerEndY}`)
    .attr('fill', 'none')
    .attr('style', nodeStyles || null);

  shapeSvg.attr('role', 'img');
  if (businessNode.accessibleName) {
    shapeSvg.attr('aria-label', businessNode.accessibleName);
  }

  updateNodeBounds(node, ellipseElement);
  node.calcIntersect = (bounds: Bounds, point: Point) =>
    intersect.ellipse(bounds, bounds.width / 2, bounds.height / 2, point);
  node.intersect = (point) => intersect.ellipse(node, radiusX, radiusY, point);
  return shapeSvg;
}
