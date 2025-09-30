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

  let w = bbox.width + 10 * halfPadding;
  let h = bbox.height + 8 * halfPadding;

  const ICON_SIZE = 30;
  const ICON_PADDING = 1;

  if (node.icon) {
    const minWidthWithIcon = bbox.width + ICON_SIZE + ICON_PADDING * 2 + 10 * halfPadding;
    w = Math.max(w, minWidthWithIcon);
    h = Math.max(h, ICON_SIZE + 8 * halfPadding);
  }

  node.width = w;
  node.height = h;

  const minWidth = bbox.width + 20;
  const minHeight = bbox.height + 20;
  const effectiveWidth = Math.max(w, minWidth);
  const effectiveHeight = Math.max(h, minHeight);

  let labelXOffset = -bbox.width / 2;
  if (node.icon) {
    const iconSpace = ICON_SIZE + ICON_PADDING;
    const remainingWidth = effectiveWidth - iconSpace;
    labelXOffset = -effectiveWidth / 2 + iconSpace + (remainingWidth - bbox.width) / 2;
  }

  label.attr('transform', `translate(${labelXOffset}, ${-bbox.height / 2})`);

  const r = 0.15 * effectiveWidth;
  let bangElem;
  const path = `M0 0
	    a${r},${r} 1 0,0 ${effectiveWidth * 0.25},${-1 * effectiveHeight * 0.1}
	    a${r},${r} 1 0,0 ${effectiveWidth * 0.25},${0}
	    a${r},${r} 1 0,0 ${effectiveWidth * 0.25},${0}
	    a${r},${r} 1 0,0 ${effectiveWidth * 0.25},${effectiveHeight * 0.1}

    a${r},${r} 1 0,0 ${effectiveWidth * 0.15},${effectiveHeight * 0.33}
    a${r * 0.8},${r * 0.8} 1 0,0 0,${effectiveHeight * 0.34}
    a${r},${r} 1 0,0 ${-1 * effectiveWidth * 0.15},${effectiveHeight * 0.33}

    a${r},${r} 1 0,0 ${-1 * effectiveWidth * 0.25},${effectiveHeight * 0.15}
    a${r},${r} 1 0,0 ${-1 * effectiveWidth * 0.25},0
    a${r},${r} 1 0,0 ${-1 * effectiveWidth * 0.25},0
    a${r},${r} 1 0,0 ${-1 * effectiveWidth * 0.25},${-1 * effectiveHeight * 0.15}

    a${r},${r} 1 0,0 ${-1 * effectiveWidth * 0.1},${-1 * effectiveHeight * 0.33}
    a${r * 0.8},${r * 0.8} 1 0,0 0,${-1 * effectiveHeight * 0.34}
    a${r},${r} 1 0,0 ${effectiveWidth * 0.1},${-1 * effectiveHeight * 0.33}
  H0 V0 Z`;

  if (node.look === 'handDrawn') {
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
  bangElem.attr('transform', `translate(${-effectiveWidth / 2}, ${-effectiveHeight / 2})`);

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
