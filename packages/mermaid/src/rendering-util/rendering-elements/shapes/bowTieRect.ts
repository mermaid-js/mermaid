import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';

function createBowTieRectPathD(x: number, y: number, totalWidth: number, totalHeight: number) {
  return `M ${x},${y + totalHeight} A ${totalHeight} ${totalHeight} 0 0 1 ${x} ${y} H${x + totalWidth} A ${totalHeight} ${totalHeight} 0 0 0 ${x + totalWidth} ${y + totalHeight}Z`;
}

export const bowTieRect = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const w = bbox.width + node.padding + 20;
  const h = bbox.height + node.padding;

  let shape: d3.Selection<SVGPathElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles } = node;

  if (node.look === 'handdrawn') {
    // @ts-ignore - rough is not typed
    const rc = rough.svg(shapeSvg);
    const pathData = createBowTieRectPathD(0, 0, w, h);
    const shapeNode = rc.path(pathData, userNodeOverrides(node, {}));

    shape = shapeSvg.insert(() => shapeNode, ':first-child');
    shape.attr('class', 'basic label-container');
    if (cssStyles) {
      shape.attr('style', cssStyles);
    }
  } else {
    const pathData = createBowTieRectPathD(0, 0, w, h);
    shape = shapeSvg
      .insert('path', ':first-child')
      .attr('d', pathData)
      .attr('class', 'basic label-container')
      .attr('style', cssStyles)
      .attr('style', nodeStyles);
  }

  shape.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, shape);

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);
    return pos;
  };

  return shapeSvg;
};
