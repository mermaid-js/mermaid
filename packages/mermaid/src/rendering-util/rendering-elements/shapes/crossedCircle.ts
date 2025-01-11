import { log } from '../../../logger.js';
import { getNodeClasses, updateNodeBounds } from './util.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import intersect from '../intersect/index.js';
import type { D3Selection } from '../../../types.js';

function createLine(r: number) {
  const xAxis45 = Math.cos(Math.PI / 4); // cosine of 45 degrees
  const yAxis45 = Math.sin(Math.PI / 4); // sine of 45 degrees
  const lineLength = r * 2;

  const pointQ1 = { x: (lineLength / 2) * xAxis45, y: (lineLength / 2) * yAxis45 }; // Quadrant I
  const pointQ2 = { x: -(lineLength / 2) * xAxis45, y: (lineLength / 2) * yAxis45 }; // Quadrant II
  const pointQ3 = { x: -(lineLength / 2) * xAxis45, y: -(lineLength / 2) * yAxis45 }; // Quadrant III
  const pointQ4 = { x: (lineLength / 2) * xAxis45, y: -(lineLength / 2) * yAxis45 }; // Quadrant IV

  return `M ${pointQ2.x},${pointQ2.y} L ${pointQ4.x},${pointQ4.y}
                   M ${pointQ1.x},${pointQ1.y} L ${pointQ3.x},${pointQ3.y}`;
}

export function crossedCircle<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  node.label = '';
  const shapeSvg = parent
    .insert('g')
    .attr('class', getNodeClasses(node))
    .attr('id', node.domId ?? node.id);
  const radius = Math.max(30, node?.width ?? 0);
  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const circleNode = rc.circle(0, 0, radius * 2, options);
  const linePath = createLine(radius);
  const lineNode = rc.path(linePath, options);

  const crossedCircle = shapeSvg.insert(() => circleNode, ':first-child');
  crossedCircle.insert(() => lineNode);

  if (cssStyles && node.look !== 'handDrawn') {
    crossedCircle.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    crossedCircle.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, crossedCircle);

  node.intersect = function (point) {
    log.info('crossedCircle intersect', node, { radius, point });
    const pos = intersect.circle(node, radius, point);
    return pos;
  };

  return shapeSvg;
}
