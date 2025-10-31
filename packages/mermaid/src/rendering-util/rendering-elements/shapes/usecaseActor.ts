import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import intersect from '../intersect/index.js';

/**
 * Get actor styling based on metadata
 */
const getActorStyling = (metadata?: Record<string, string>) => {
  const defaults = {
    fillColor: 'none',
    strokeColor: 'black',
    strokeWidth: 2,
    type: 'solid',
  };

  if (!metadata) {
    return defaults;
  }

  return {
    fillColor: metadata.type === 'hollow' ? 'none' : metadata.fillColor || defaults.fillColor,
    strokeColor: metadata.strokeColor || defaults.strokeColor,
    strokeWidth: parseInt(metadata.strokeWidth || '2', 10),
    type: metadata.type || defaults.type,
  };
};

/**
 * Create stick figure path data
 * This generates the SVG path for a stick figure centered at (x, y)
 */
const createStickFigurePathD = (x: number, y: number, scale = 1.5): string => {
  // Base path template (centered at origin):
  // M 0 -4 C 4.4183 -4 8 -7.5817 8 -12 C 8 -16.4183 4.4183 -20 0 -20 C -4.4183 -20 -8 -16.4183 -8 -12 C -8 -7.5817 -4.4183 -4 0 -4 Z M 0 -4 V 5 M -10 14.5 L 0 5 M 10 14.5 L 0 5 M -11 0 H 11

  // Scale all coordinates
  const s = (val: number) => val * scale;

  // Translate the path to the desired position
  return [
    // Head (circle using cubic bezier curves)
    `M ${x + s(0)} ${y + s(-4)}`,
    `C ${x + s(4.4183)} ${y + s(-4)} ${x + s(8)} ${y + s(-7.5817)} ${x + s(8)} ${y + s(-12)}`,
    `C ${x + s(8)} ${y + s(-16.4183)} ${x + s(4.4183)} ${y + s(-20)} ${x + s(0)} ${y + s(-20)}`,
    `C ${x + s(-4.4183)} ${y + s(-20)} ${x + s(-8)} ${y + s(-16.4183)} ${x + s(-8)} ${y + s(-12)}`,
    `C ${x + s(-8)} ${y + s(-7.5817)} ${x + s(-4.4183)} ${y + s(-4)} ${x + s(0)} ${y + s(-4)}`,
    'Z',
    // Body (vertical line from head to torso)
    `M ${x + s(0)} ${y + s(-4)}`,
    `V ${y + s(5)}`,
    // Left leg
    `M ${x + s(-10)} ${y + s(14.5)}`,
    `L ${x + s(0)} ${y + s(5)}`,
    // Right leg
    `M ${x + s(10)} ${y + s(14.5)}`,
    `L ${x + s(0)} ${y + s(5)}`,
    // Arms (horizontal line)
    `M ${x + s(-11)} ${y + s(0)}`,
    `H ${x + s(11)}`,
  ].join(' ');
};

/**
 * Draw traditional stick figure
 */
const drawStickFigure = (
  actorGroup: D3Selection<SVGGElement>,
  styling: ReturnType<typeof getActorStyling>,
  node: Node
): void => {
  const x = 0; // Center at origin
  const y = -10; // Adjust vertical position
  actorGroup.attr('class', 'usecase-actor-shape');

  const pathData = createStickFigurePathD(x, y);

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(actorGroup);
    const options = userNodeOverrides(node, {
      stroke: styling.strokeColor,
      strokeWidth: styling.strokeWidth,
      fill: styling.fillColor,
    });

    // Draw the stick figure using the path
    const stickFigure = rc.path(pathData, options);
    actorGroup.insert(() => stickFigure, ':first-child');
  } else {
    // Draw the stick figure using standard SVG path
    actorGroup
      .append('path')
      .attr('d', pathData)
      .attr('fill', styling.fillColor)
      .attr('stroke', styling.strokeColor)
      .attr('stroke-width', styling.strokeWidth);
  }
};

/**
 * Custom shape handler for usecase actors (stick figure)
 */
export async function usecaseActor<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);

  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  // Get actor metadata from node
  const metadata = (node as Node & { metadata?: Record<string, string> }).metadata;
  const styling = getActorStyling(metadata);

  // Create actor group
  const actorGroup = shapeSvg.append('g');

  // Add metadata as data attributes for CSS styling
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      actorGroup.attr(`data-${key}`, value);
    });
  }

  // Draw stick figure
  drawStickFigure(actorGroup, styling, node);

  // Get the actual bounding box of the rendered actor
  const actorBBox = actorGroup.node()?.getBBox();
  const actorHeight = actorBBox?.height ?? 70;

  // Actor name (always rendered below the figure)
  const labelY = actorHeight / 2 + 15; // Position label below the figure

  // Calculate label height from the actual text element
  const labelBBox = label.node()?.getBBox() ?? { height: 20 };
  const labelHeight = labelBBox.height + 10; // Space for label below
  const totalHeight = actorHeight + labelHeight;

  actorGroup.attr('transform', `translate(${0}, ${-totalHeight / 2 + 35})`);
  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))},${labelY / 2 - 15} )`
  );

  if (nodeStyles && node.look !== 'handDrawn') {
    actorGroup.selectChildren('path').attr('style', nodeStyles);
  }

  // Update node bounds for layout - this will set node.width and node.height from the bounding box
  updateNodeBounds(node, actorGroup);

  // Override height to include label space
  // Width is kept from updateNodeBounds as it correctly reflects the actor's visual width
  node.height = totalHeight;

  // Add intersect function for edge connection points
  // Use rectangular intersection since the actor has a rectangular bounding box
  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
