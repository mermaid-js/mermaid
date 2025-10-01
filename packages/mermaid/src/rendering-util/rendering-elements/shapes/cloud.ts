import { log } from '../../../logger.js';
import type { Bounds, D3Selection, Point } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';
import type { Node } from '../../types.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';
import rough from 'roughjs';

const ICON_SIZE = 30;
const ICON_PADDING = 15;
export async function cloud<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, halfPadding, label } = await labelHelper(
    parent,
    node,
    getNodeClasses(node)
  );

  let w = bbox.width + 2 * halfPadding;
  let h = bbox.height + 2 * halfPadding;

  let labelXOffset = -bbox.width / 2;
  const labelYOffset = -bbox.height / 2;
  if (node.icon) {
    const minWidthWithIcon = bbox.width + ICON_SIZE + ICON_PADDING * 2 + 2 * halfPadding;
    w = Math.max(w, minWidthWithIcon);
    h = Math.max(h, ICON_SIZE + 2 * halfPadding);

    node.width = w;
    node.height = h;

    const availableTextSpace = w - ICON_SIZE - ICON_PADDING * 2;
    labelXOffset = -w / 2 + ICON_SIZE + ICON_PADDING + availableTextSpace / 2 - bbox.width / 2;
    label.attr('transform', `translate(${labelXOffset}, ${labelYOffset})`);
  } else {
    node.width = w;
    node.height = h;
  }

  // Cloud radii
  const r1 = 0.15 * w;
  const r2 = 0.25 * w;
  const r3 = 0.35 * w;
  const r4 = 0.2 * w;

  let cloudElem;

  // Cloud path
  const path = `M0 0 
    a${r1},${r1} 0 0,1 ${w * 0.25},${-1 * w * 0.1}
    a${r3},${r3} 1 0,1 ${w * 0.4},${-1 * w * 0.1}
    a${r2},${r2} 1 0,1 ${w * 0.35},${w * 0.2}

    a${r1},${r1} 1 0,1 ${w * 0.15},${h * 0.35}
    a${r4},${r4} 1 0,1 ${-1 * w * 0.15},${h * 0.65}

    a${r2},${r1} 1 0,1 ${-1 * w * 0.25},${w * 0.15}
    a${r3},${r3} 1 0,1 ${-1 * w * 0.5},0
    a${r1},${r1} 1 0,1 ${-1 * w * 0.25},${-1 * w * 0.15}

    a${r1},${r1} 1 0,1 ${-1 * w * 0.1},${-1 * h * 0.35}
    a${r4},${r4} 1 0,1 ${w * 0.1},${-1 * h * 0.65}
  H0 V0 Z`;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const roughNode = rc.path(path, options);
    cloudElem = shapeSvg.insert(() => roughNode, ':first-child');
    cloudElem
      .attr('class', 'basic label-container')
      .attr('style', handleUndefinedAttr(node.cssStyles));
  } else {
    cloudElem = shapeSvg
      .insert('path', ':first-child')
      .attr('class', 'basic label-container')
      .attr('style', nodeStyles)
      .attr('d', path);
  }

  // Center the shape
  cloudElem.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, cloudElem);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    return intersect.rect(bounds, point);
  };
  node.intersect = function (point) {
    log.info('Cloud intersect', node, point);
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
