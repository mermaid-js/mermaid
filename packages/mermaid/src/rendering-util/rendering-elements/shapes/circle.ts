import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import { userNodeOverrides } from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';

export const circle = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { themeVariables, handdrawnSeed } = getConfig();
  const { nodeBorder, mainBkg } = themeVariables;

  const { shapeSvg, bbox, halfPadding } = await labelHelper(
    parent,
    node,
    'node ' + node.cssClasses,
    true
  );

  const radius = bbox.width / 2 + halfPadding;
  let circleElem;
  const { cssStyles, useRough } = node;

  if (useRough) {
    console.log('Circle: Inside use useRough');
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {
      roughness: 0.9,
      fill: mainBkg,
      fillStyle: 'hachure',
      fillWeight: 1.5,
      stroke: nodeBorder,
      seed: handdrawnSeed,
      strokeWidth: 1,
    });
    const roughNode = rc.circle(0, 0, radius * 2, options);

    circleElem = shapeSvg.insert(() => roughNode, ':first-child');
    circleElem.attr('class', 'basic label-container').attr('style', cssStyles);
  } else {
    circleElem = shapeSvg
      .insert('circle', ':first-child')
      .attr('class', 'basic label-container')
      .attr('style', cssStyles)
      .attr('r', radius)
      .attr('cx', 0)
      .attr('cy', 0);
  }

  updateNodeBounds(node, circleElem);

  node.intersect = function (point) {
    log.info('Circle intersect', node, radius, point);
    return intersect.circle(node, radius, point);
  };

  return shapeSvg;
};
