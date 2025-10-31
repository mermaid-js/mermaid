import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getIconSVG } from '../../icons.js';
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
    actorGroup.attr('class', 'usecase-icon');
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
 * Custom shape handler for usecase actors with icons
 */
export async function usecaseActorIcon<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles } = styles2String(node);
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

  // Get icon name from metadata
  const iconName = metadata?.icon ?? 'user';
  await drawActorWithIcon(actorGroup, iconName, styling, node);

  // Get the actual bounding box of the rendered actor icon
  const actorBBox = actorGroup.node()?.getBBox();
  const actorHeight = actorBBox?.height ?? 70;

  // Actor name (always rendered below the figure)
  const labelY = actorHeight / 2 + 15; // Position label below the figure

  // Calculate label height from the actual text element
  const labelBBox = label.node()?.getBBox() ?? { height: 20 };
  const labelHeight = labelBBox.height + 10; // Space for label below
  const totalHeight = actorHeight + labelHeight;
  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))},${labelY / 2 - 15})`
  );

  // Update node bounds for layout - this will set node.width and node.height from the bounding box
  updateNodeBounds(node, actorGroup);

  // Override height to include label space
  // Width is kept from updateNodeBounds as it correctly reflects the actor's visual width
  node.height = totalHeight;

  // Add intersect function for edge connection points
  // Use rectangular intersection for icon actors
  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
