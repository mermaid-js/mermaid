import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';
import type { Bounds, Point } from '../../../types.js';

export async function bang<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, halfPadding, label } = await labelHelper(
    parent,
    node,
    getNodeClasses(node)
  );

  const w = bbox.width + 2 * halfPadding;
  const h = bbox.height + 2 * halfPadding;
  const r = 0.15 * w;
  const { cssStyles } = node;

  // Label centered around (0,0)
  label.attr('transform', `translate(${-bbox.width / 2}, ${-bbox.height / 2})`);

  let bangElem;
  const path = `M0 0 
    a${r},${r} 1 0,0 ${w * 0.25},${-1 * h * 0.1}
    a${r},${r} 1 0,0 ${w * 0.25},${0}
    a${r},${r} 1 0,0 ${w * 0.25},${0}
    a${r},${r} 1 0,0 ${w * 0.25},${h * 0.1}

    a${r},${r} 1 0,0 ${w * 0.15},${h * 0.33}
    a${r * 0.8},${r * 0.8} 1 0,0 0,${h * 0.34}
    a${r},${r} 1 0,0 ${-1 * w * 0.15},${h * 0.33}

    a${r},${r} 1 0,0 ${-1 * w * 0.25},${h * 0.15}
    a${r},${r} 1 0,0 ${-1 * w * 0.25},0
    a${r},${r} 1 0,0 ${-1 * w * 0.25},0
    a${r},${r} 1 0,0 ${-1 * w * 0.25},${-1 * h * 0.15}

    a${r},${r} 1 0,0 ${-1 * w * 0.1},${-1 * h * 0.33}
    a${r * 0.8},${r * 0.8} 1 0,0 0,${-1 * h * 0.34}
    a${r},${r} 1 0,0 ${w * 0.1},${-1 * h * 0.33}
  H0 V0 Z`;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const roughNode = rc.path(path, options);
    bangElem = shapeSvg.insert(() => roughNode, ':first-child');
    bangElem.attr('class', 'basic label-container').attr('style', handleUndefinedAttr(cssStyles));
  } else {
    bangElem = shapeSvg
      .insert('path', ':first-child')
      .attr('class', 'basic label-container')
      .attr('style', nodeStyles)
      .attr('d', path);
  }

  // Translate the path (center the shape)
  bangElem.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, bangElem);
  node.calcIntersect = function (bounds: Bounds, point: Point) {
    return intersect.rect(bounds, point);
  };
  node.intersect = function (point) {
    log.info('Bang intersect', node, point);
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
