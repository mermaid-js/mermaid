import rough from 'roughjs';
import type { Bounds, D3Selection, Point } from '../../../types.js';
import type { Node } from '../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';
import { placeGlyphCaption } from './umlInterface.js';

export const PORT_SIZE = 12;

/**
 * UML component port: a small fixed-size square with its name as a caption below.
 * The component diagram renderer moves it onto its component's border after layout.
 */
export async function umlPort<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node), {
    ignoreMinWidth: true,
  });
  const half = PORT_SIZE / 2;

  let rectElem;
  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const roughNode = rc.rectangle(-half, -half, PORT_SIZE, PORT_SIZE, userNodeOverrides(node, {}));
    rectElem = shapeSvg.insert(() => roughNode, ':first-child');
    rectElem
      .attr('class', 'basic label-container')
      .attr('style', handleUndefinedAttr(node.cssStyles));
  } else {
    rectElem = shapeSvg
      .insert('rect', ':first-child')
      .attr('class', 'basic label-container')
      .attr('style', nodeStyles)
      .attr('x', -half)
      .attr('y', -half)
      .attr('width', PORT_SIZE)
      .attr('height', PORT_SIZE);
  }

  updateNodeBounds(node, rectElem, placeGlyphCaption(node, label, bbox, half));
  // Clip against the square alone; the caption below is not part of the port.
  node.calcIntersect = function (bounds: Bounds, point: Point) {
    return intersect.rect({ ...bounds, width: PORT_SIZE, height: PORT_SIZE }, point);
  };
  node.intersect = function (point) {
    return intersect.rect({ ...node, width: PORT_SIZE, height: PORT_SIZE }, point);
  };
  return shapeSvg;
}
