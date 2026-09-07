import { labelHelper, updateNodeBounds, getNodeClasses, generateCirclePoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { createRoundedRectPathD } from './roundedRectPath.js';
import type { D3Selection } from '../../../types.js';

/**
 * Person shape: a circular head above a rounded-rectangle body, as used for
 * people/actors in C4 model notation.
 */
export async function person<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const padding = node.padding ?? 20;
  const w = Math.max(bbox.width + padding * 2, node.width ?? 0, 100);
  // Proportions taken from the c4model.com person: head radius 0.23x the body
  // width, overlapping the body by 0.27x the head radius, body corners 0.177x
  // the width. The head is clamped so a body widened by a long unwrapped
  // label keeps a person-sized head.
  const headRadius = Math.min(Math.max(w * 0.23, 16), 56);
  const overlap = headRadius * 0.27;
  const bodyHeight = Math.max(
    bbox.height + padding * 2,
    node.height ? node.height - (2 * headRadius - overlap) : 0
  );
  const bodyRadius = Math.min(w * 0.177, bodyHeight * 0.45);
  const totalHeight = bodyHeight + 2 * headRadius - overlap;
  const top = -totalHeight / 2;
  const bodyTop = top + 2 * headRadius - overlap;

  const group = shapeSvg.insert('g', ':first-child').attr('class', 'basic label-container');
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const body = rc.path(
      createRoundedRectPathD(-w / 2, bodyTop, w, bodyHeight, bodyRadius),
      options
    );
    const head = rc.circle(0, top + headRadius, headRadius * 2, options);

    // Body first, then the head drawn on top so the full circle stays visible.
    group.insert(() => head, ':first-child');
    group.insert(() => body, ':first-child');
    if (cssStyles) {
      group.attr('style', cssStyles);
    }
  } else {
    // Body first, then the head drawn on top so the full circle stays visible.
    group
      .append('rect')
      .attr('x', -w / 2)
      .attr('y', bodyTop)
      .attr('width', w)
      .attr('height', bodyHeight)
      .attr('rx', bodyRadius)
      .attr('ry', bodyRadius)
      .attr('style', nodeStyles);

    group
      .append('circle')
      .attr('cx', 0)
      .attr('cy', top + headRadius)
      .attr('r', headRadius)
      .attr('style', nodeStyles);
  }

  updateNodeBounds(node, group);

  const bodyCenterY = bodyTop + bodyHeight / 2;
  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${bodyCenterY - bbox.height / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  // Edge intersection outline: the head's exposed arc joined to the body's
  // rounded-rectangle outline, so arrows meet the person silhouette rather than
  // its bounding box.
  const headCenterY = top + headRadius;
  const phiRightDeg =
    (Math.asin(Math.min(1, (bodyTop - headCenterY) / headRadius)) * 180) / Math.PI;
  const HEAD_SEGMENTS = 24;
  const headArc = generateCirclePoints(
    0,
    -headCenterY,
    headRadius,
    HEAD_SEGMENTS,
    180 + phiRightDeg,
    -phiRightDeg
  );
  const outline = [
    ...headArc,
    ...generateCirclePoints(-(-w / 2 + bodyRadius), -(bodyTop + bodyRadius), bodyRadius, 12, 90, 0),
    ...generateCirclePoints(
      -(-w / 2 + bodyRadius),
      -(totalHeight / 2 - bodyRadius),
      bodyRadius,
      12,
      360,
      270
    ),
    ...generateCirclePoints(
      -(w / 2 - bodyRadius),
      -(totalHeight / 2 - bodyRadius),
      bodyRadius,
      12,
      270,
      180
    ),
    ...generateCirclePoints(
      -(w / 2 - bodyRadius),
      -(bodyTop + bodyRadius),
      bodyRadius,
      12,
      180,
      90
    ),
  ];

  node.intersect = function (point) {
    return intersect.polygon(node, outline, point);
  };

  return shapeSvg;
}
