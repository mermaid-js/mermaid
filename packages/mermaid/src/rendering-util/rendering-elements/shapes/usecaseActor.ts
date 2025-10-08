import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getIconSVG } from '../../icons.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

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
 * Draw traditional stick figure
 */
const drawStickFigure = (
  actorGroup: D3Selection<SVGGElement>,
  styling: ReturnType<typeof getActorStyling>,
  node: Node
): void => {
  const x = 0; // Center at origin
  const y = -10; // Adjust vertical position

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(actorGroup);
    const options = userNodeOverrides(node, {
      stroke: styling.strokeColor,
      strokeWidth: styling.strokeWidth,
      fill: styling.fillColor,
    });

    // Head (circle)
    const head = rc.circle(x, y - 30, 16, options);
    actorGroup.insert(() => head, ':first-child');

    // Body (line)
    const body = rc.line(x, y - 22, x, y + 10, options);
    actorGroup.insert(() => body, ':first-child');

    // Arms (line)
    const arms = rc.line(x - 15, y - 10, x + 15, y - 10, options);
    actorGroup.insert(() => arms, ':first-child');

    // Left leg
    const leftLeg = rc.line(x, y + 10, x - 15, y + 30, options);
    actorGroup.insert(() => leftLeg, ':first-child');

    // Right leg
    const rightLeg = rc.line(x, y + 10, x + 15, y + 30, options);
    actorGroup.insert(() => rightLeg, ':first-child');
  } else {
    // Head (circle)
    actorGroup
      .append('circle')
      .attr('cx', x)
      .attr('cy', y - 30)
      .attr('r', 8)
      .attr('fill', styling.fillColor)
      .attr('stroke', styling.strokeColor)
      .attr('stroke-width', styling.strokeWidth);

    // Body (line)
    actorGroup
      .append('line')
      .attr('x1', x)
      .attr('y1', y - 22)
      .attr('x2', x)
      .attr('y2', y + 10)
      .attr('stroke', styling.strokeColor)
      .attr('stroke-width', styling.strokeWidth);

    // Arms (line)
    actorGroup
      .append('line')
      .attr('x1', x - 15)
      .attr('y1', y - 10)
      .attr('x2', x + 15)
      .attr('y2', y - 10)
      .attr('stroke', styling.strokeColor)
      .attr('stroke-width', styling.strokeWidth);

    // Left leg
    actorGroup
      .append('line')
      .attr('x1', x)
      .attr('y1', y + 10)
      .attr('x2', x - 15)
      .attr('y2', y + 30)
      .attr('stroke', styling.strokeColor)
      .attr('stroke-width', styling.strokeWidth);

    // Right leg
    actorGroup
      .append('line')
      .attr('x1', x)
      .attr('y1', y + 10)
      .attr('x2', x + 15)
      .attr('y2', y + 30)
      .attr('stroke', styling.strokeColor)
      .attr('stroke-width', styling.strokeWidth);
  }
};

/**
 * Draw actor with icon representation
 */
const drawActorWithIcon = async (
  actorGroup: D3Selection<SVGGElement>,
  iconName: string,
  styling: ReturnType<typeof getActorStyling>,
  node: Node
): Promise<void> => {
  const x = 0; // Center at origin
  const y = -10; // Adjust vertical position
  const iconSize = 50; // Icon size

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(actorGroup);
    const options = userNodeOverrides(node, {
      stroke: styling.strokeColor,
      strokeWidth: styling.strokeWidth,
      fill: styling.fillColor === 'none' ? 'white' : styling.fillColor,
    });

    // Create a rectangle background for the icon
    const iconBg = rc.rectangle(x - 35, y - 40, 50, 50, options);
    actorGroup.insert(() => iconBg, ':first-child');
  } else {
    // Create a rectangle background for the icon
    actorGroup
      .append('rect')
      .attr('x', x - 27.5)
      .attr('y', y - 42)
      .attr('width', 55)
      .attr('height', 55)
      .attr('rx', 5)
      .attr('fill', styling.fillColor === 'none' ? 'white' : styling.fillColor)
      .attr('stroke', styling.strokeColor)
      .attr('stroke-width', styling.strokeWidth);
  }

  // Add icon using getIconSVG (like iconCircle.ts does)
  const iconElem = actorGroup.append('g').attr('class', 'actor-icon');
  iconElem.html(
    `<g>${await getIconSVG(iconName, {
      height: iconSize,
      width: iconSize,
      fallbackPrefix: 'fa',
    })}</g>`
  );

  // Get icon bounding box for positioning
  const iconBBox = iconElem.node()?.getBBox();
  if (iconBBox) {
    const iconWidth = iconBBox.width;
    const iconHeight = iconBBox.height;
    const iconX = iconBBox.x;
    const iconY = iconBBox.y;

    // Center the icon in the rectangle
    iconElem.attr(
      'transform',
      `translate(${-iconWidth / 2 - iconX}, ${y - 15 - iconHeight / 2 - iconY})`
    );
  }
};

/**
 * Custom shape handler for usecase actors
 */
export async function usecaseActor<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  // Actor dimensions
  const actorWidth = 80;
  const actorHeight = 70; // Height for the stick figure part

  // Get actor metadata from node
  const metadata = (node as Node & { metadata?: Record<string, string> }).metadata;
  const styling = getActorStyling(metadata);

  // Create actor group
  const actorGroup = shapeSvg.append('g').attr('class', 'usecase-actor-shape');

  // Add metadata as data attributes for CSS styling
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      actorGroup.attr(`data-${key}`, value);
    });
  }

  // Check if we should render an icon instead of stick figure
  if (metadata?.icon) {
    await drawActorWithIcon(actorGroup, metadata.icon, styling, node);
  } else {
    drawStickFigure(actorGroup, styling, node);
  }

  // Actor name (always rendered below the figure)
  const labelY = actorHeight / 2 + 15; // Position label below the figure

  // Calculate label height from the actual text element

  const labelBBox = label.node()?.getBBox() ?? { height: 20 };
  const labelHeight = labelBBox.height + 10; // Space for label below
  const totalHeight = actorHeight + labelHeight;
  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))},${labelY / 2})`
  );

  // Update node bounds for layout
  updateNodeBounds(node, actorGroup);

  // Set explicit dimensions for layout algorithm
  node.width = actorWidth;
  node.height = totalHeight;

  return shapeSvg;
}
