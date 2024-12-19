import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';
import type { Node } from '../../types.js';
import { styles2String } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';
import type { Selection } from 'd3-selection';
import intersect from '../../../dagre-wrapper/intersect/index.js';

type SvgElement = Selection<SVGGElement, unknown, Element | null, unknown>;

export async function actor<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<SvgElement> {
  const { labelStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg: labelSvg } = await labelHelper(parent, node, getNodeClasses(node));

  const _ = labelSvg
    .insert('path')
    .attr('transform', 'translate(-30,-70),scale(0.5)')
    .attr(
      'd',
      `M 50,30
        m -20,0
        a 20,20 0 1,0 40,0
        a 20,20 0 1,0 -40,0
        m 20,20
        l 0,50
        l -20,50
        l 20,-50
        l 20,50
        l -20,-50
        l 0,-50
        m 0,10
        l -30,30
        l 30,-30
        l 30,30
        l -30,-30`
    )
    .attr('id', node.domId ?? node.id);

  moveLabelBelowStickman(labelSvg);
  updateNodeBounds(node, labelSvg);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  // debug(labelSvg);

  return labelSvg;
}

/**
 * Move label below the stickman
 */
function moveLabelBelowStickman(labelSvg: SvgElement, padding = 15) {
  const labelTransform = labelSvg.select('[class="label"]');
  const regex = /(-?[\d.]+),\s*(-?[\d.]+)\)/;
  const matches = regex.exec(labelTransform.attr('transform') ?? '(0,0)');
  const x = matches?.[1] ?? '0';
  const y = matches?.[2] ?? '0';
  labelTransform.attr('transform', `translate(${x}, ${parseFloat(y) + padding})`);
}

/** Add a border for debugging
 * @param svg - The SVG element to add the border to
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function debug(svg: SvgElement) {
  const bboxActor = svg.node()!.getBBox();
  svg
    .insert('rect', ':first-child')
    .attr('x', bboxActor.x)
    .attr('y', bboxActor.y)
    .attr('width', bboxActor.width)
    .attr('height', bboxActor.height)
    .attr('stroke', 'red')
    .attr('fill', 'none');
}
