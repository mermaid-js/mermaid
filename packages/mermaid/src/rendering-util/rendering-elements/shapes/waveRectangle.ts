import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';

function createWaveRectanglePathD(x: number, y: number, width: number, height: number) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const pathData = `M ${x} ${y}
    Q ${x + halfWidth / 2} ${y + halfHeight}, ${x + halfWidth} ${y}
    Q ${x + (3 * halfWidth) / 2} ${y - halfHeight}, ${x + width} ${y}
    L ${x + width} ${y + height}
    Q ${x + (3 * halfWidth) / 2} ${y + halfHeight}, ${x + halfWidth} ${y + height}
    Q ${x + halfWidth / 2} ${y + 3 * halfHeight}, ${x} ${y + height}
    L ${x} ${y}
    Z`;
  return pathData;
}

export const waveRectangle = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding + 20;

  let shape: d3.Selection<SVGPathElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles } = node;

  if (node.look === 'handdrawn') {
    // @ts-ignore - rough is not typed
    const rc = rough.svg(shapeSvg);
    const pathData = createWaveRectanglePathD(0, 0, w, h);
    const shapeNode = rc.path(pathData, userNodeOverrides(node, {}));

    shape = shapeSvg.insert(() => shapeNode, ':first-child');
    shape.attr('class', 'basic label-container');
    if (cssStyles) {
      shape.attr('style', cssStyles);
    }
  } else {
    const pathData = createWaveRectanglePathD(0, 0, w, h);
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
    const pos = intersect.polygon(node, point);
    return pos;
  };

  return shapeSvg;
};
