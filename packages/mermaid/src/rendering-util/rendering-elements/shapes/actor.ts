import { getNodeClasses, labelHelper } from './util.js';
import type { Node } from '../../types.js';
import { styles2String } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';
import type { Selection } from 'd3-selection';

export async function actor<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<Selection<SVGGElement, unknown, Element | null, unknown>> {
  const { labelStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg: labelSvg } = await labelHelper(parent, node, getNodeClasses(node));
  const classes = getNodeClasses(node);
  let cssClasses = classes;
  if (!classes) {
    cssClasses = 'actor';
  }
  const _ = labelSvg
    .insert('path')
    .attr('class', cssClasses)
    .attr('transform', 'scale(0.5),translate(-50,-220)')
    .attr(
      'd',
      ` M 50,30
        m -20,0
        a 20,20 0 1,0 40,0
        a 20,20 0 1,0 -40,0
        M 50,50
        L 50,120
        M 50,70
        L 20,100
        M 50,70
        L 80,100
        M 50,120
        L 30,170
        M 50,120
        L 70,170`
    )
    .attr('id', node.domId ?? node.id);

  return labelSvg;
}
