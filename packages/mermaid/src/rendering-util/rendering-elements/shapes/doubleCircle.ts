import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import { userNodeOverrides } from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';
//import d3 from 'd3';

export const doublecircle = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { themeVariables, handdrawnSeed } = getConfig();
  const { nodeBorder, mainBkg } = themeVariables;

  const { shapeSvg, bbox, halfPadding } = await labelHelper(
    parent,
    node,
    'node ' + node.cssClasses,
    true
  );
  const gap = 5;
  const outerRadius = bbox.width / 2 + halfPadding + gap;
  const innerRadius = bbox.width / 2 + halfPadding;

  let circleGroup;
  const { cssStyles, useRough } = node;

  if (useRough) {
    console.log('DoubleCircle: Inside use useRough');
    const rc = rough.svg(shapeSvg);
    const outerOptions = userNodeOverrides(node, {
      roughness: 0.9,
      fill: mainBkg,
      fillStyle: 'hachure',
      fillWeight: 1.5,
      stroke: nodeBorder,
      seed: handdrawnSeed,
      strokeWidth: 1,
    });

    const innerOptions = { ...outerOptions, fill: mainBkg };
    const outerRoughNode = rc.circle(0, 0, outerRadius * 2, outerOptions);
    const innerRoughNode = rc.circle(0, 0, innerRadius * 2, innerOptions);

    circleGroup = shapeSvg.insert('g', ':first-child');
    circleGroup.attr('class', node.cssClasses).attr('style', cssStyles);
    // d3.select(outerRoughNode).attr('class', 'outer-circle').attr('style', cssStyles);
    // d3.select(innerRoughNode).attr('class', 'inner-circle').attr('style', cssStyles);

    circleGroup.node()?.appendChild(outerRoughNode);
    circleGroup.node()?.appendChild(innerRoughNode);
  } else {
    circleGroup = shapeSvg.insert('g', ':first-child');
    const outerCircle = circleGroup.insert('circle', ':first-child');
    const innerCircle = circleGroup.insert('circle', ':first-child');

    circleGroup.attr('class', 'basic label-container').attr('style', cssStyles);

    outerCircle
      .attr('class', 'outer-circle')
      .attr('style', cssStyles)
      .attr('r', outerRadius)
      .attr('cx', 0)
      .attr('cy', 0);

    innerCircle
      .attr('class', 'inner-circle')
      .attr('style', cssStyles)
      .attr('r', innerRadius)
      .attr('cx', 0)
      .attr('cy', 0);
  }

  updateNodeBounds(node, circleGroup);

  node.intersect = function (point) {
    log.info('DoubleCircle intersect', node, outerRadius, point);
    return intersect.circle(node, outerRadius, point);
  };

  return shapeSvg;
};
