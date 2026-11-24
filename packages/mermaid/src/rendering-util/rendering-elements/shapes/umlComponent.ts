import { getConfig } from '../../../diagram-api/diagramAPI.js';
import type { D3Selection } from '../../../types.js';
import type { Node, RectOptions } from '../../types.js';
import { drawRect } from './drawRect.js';

/**
 * UML component box: a rectangle with the small two-tab "component" icon in its
 * top-right corner, per the UML2 component notation.
 */
export async function umlComponent<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const nodePadding = node.padding ?? 10;
  const options = {
    rx: 0,
    ry: 0,
    classes: '',
    labelPaddingX: nodePadding * 2,
    labelPaddingY: nodePadding,
  } as RectOptions;
  const shapeSvg = await drawRect(parent, node, options);

  // The icon is drawn with plain SVG in every look, handDrawn included: roughjs
  // sketch lines at this size read as noise rather than as the UML glyph.
  const { themeVariables } = getConfig();
  const iconWidth = 14;
  const iconHeight = 10;
  const x = node.width ? node.width / 2 - iconWidth - 4 : 0;
  const y = node.height ? -node.height / 2 + 6 : 0;
  const icon = shapeSvg.insert('g').attr('class', 'component-icon');
  icon
    .append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', iconWidth)
    .attr('height', iconHeight)
    .attr('fill', themeVariables.mainBkg)
    .attr('stroke', themeVariables.nodeBorder ?? themeVariables.primaryColor);
  for (const offset of [2, 6]) {
    icon
      .append('rect')
      .attr('x', x - 3)
      .attr('y', y + offset)
      .attr('width', 6)
      .attr('height', 3)
      .attr('fill', themeVariables.mainBkg)
      .attr('stroke', themeVariables.nodeBorder ?? themeVariables.primaryColor);
  }

  return shapeSvg;
}
