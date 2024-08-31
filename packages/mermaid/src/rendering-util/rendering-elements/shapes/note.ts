import { log } from 'mermaid/dist/logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import { getConfig } from 'mermaid/dist/diagram-api/diagramAPI.js';
import type { Node } from 'mermaid/dist/rendering-util/types.d.ts';
import rough from 'roughjs';

export const note = async (parent: SVGAElement, node: Node) => {
  const { themeVariables, handDrawnSeed } = getConfig();
  const { noteBorderColor, noteBkgColor } = themeVariables;

  const useHtmlLabels = node.useHtmlLabels;
  if (!useHtmlLabels) {
    node.centerLabel = true;
  }
  const { shapeSvg, bbox } = await labelHelper(parent, node, 'node ' + node.cssClasses);

  log.info('Classes = ', node.cssClasses);
  const { cssStyles } = node;
  let rect;
  const totalWidth = bbox.width + node.padding;
  const totalHeight = bbox.height + node.padding;
  const x = -totalWidth / 2;
  const y = -totalHeight / 2;

  if (node.look === 'handDrawn') {
    // add the rect
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const roughNode = rc.rectangle(x, y, totalWidth, totalHeight, {
      roughness: 0.7,
      fill: noteBkgColor,
      fillWeight: 3,
      seed: handDrawnSeed,
      // fillStyle: 'solid', // solid fill'
      stroke: noteBorderColor,
    });

    rect = shapeSvg.insert(() => roughNode, ':first-child');
    rect.attr('class', 'basic label-container').attr('style', cssStyles);
  } else {
    rect = shapeSvg.insert('rect', ':first-child');
    rect
      .attr('rx', node.rx)
      .attr('ry', node.ry)
      .attr('x', x)
      .attr('y', y)
      .attr('width', totalWidth)
      .attr('height', totalHeight);
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};
