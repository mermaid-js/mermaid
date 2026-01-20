import { log } from '../../logger.js';
import type { D3Selection } from '../../types.js';
import type { Node } from '../../rendering-util/types.js';
import { getIconSVG, isIconAvailable } from '../../rendering-util/icons.js';

export interface MindmapIconConfig {
  iconSize: number;
  iconPadding: number;
  shapeType: 'circle' | 'rect' | 'rounded' | 'bang' | 'cloud' | 'hexagon' | 'default';
}

export interface MindmapDimensions {
  width: number;
  height: number;
  labelOffset: { x: number; y: number };
}

/**
 * Get icon configuration for different mindmap shape types
 */
export function getMindmapIconConfig(shapeType: string): MindmapIconConfig {
  const baseConfig = {
    iconSize: 30,
    iconPadding: 15,
    shapeType: shapeType as MindmapIconConfig['shapeType'],
  };

  switch (shapeType) {
    case 'bang':
      return { ...baseConfig, iconPadding: 1 };
    case 'rect':
    case 'default':
      return { ...baseConfig, iconPadding: 10 };
    default:
      return baseConfig;
  }
}

/**
 * Calculate dimensions and label positioning for mindmap nodes with icons
 */
export function calculateMindmapDimensions(
  node: Node,
  bbox: any,
  baseWidth: number,
  baseHeight: number,
  basePadding: number,
  config: MindmapIconConfig
): MindmapDimensions {
  const hasIcon = Boolean(node.icon);

  if (!hasIcon) {
    return {
      width: baseWidth,
      height: baseHeight,
      labelOffset: { x: -bbox.width / 2, y: -bbox.height / 2 },
    };
  }

  const { iconSize, iconPadding, shapeType } = config;
  let width = baseWidth;
  let height = baseHeight;
  let labelXOffset = -bbox.width / 2;
  const labelYOffset = -bbox.height / 2;

  switch (shapeType) {
    case 'circle': {
      const totalWidthNeeded = bbox.width + iconSize + iconPadding * 2;
      const minRadiusWithIcon = totalWidthNeeded / 2 + basePadding;
      const radius = Math.max(baseWidth / 2, minRadiusWithIcon);
      width = radius * 2;
      height = radius * 2;
      labelXOffset = -radius + iconSize + iconPadding;
      break;
    }

    case 'rect':
    case 'rounded':
    case 'default': {
      const minWidthWithIcon = bbox.width + iconSize + iconPadding * 2 + basePadding * 2;
      width = Math.max(baseWidth, minWidthWithIcon);
      height = Math.max(baseHeight, iconSize + basePadding * 2);

      const availableTextSpace = width - iconSize - iconPadding * 2;
      labelXOffset = -width / 2 + iconSize + iconPadding + availableTextSpace / 2 - bbox.width / 2;
      break;
    }

    case 'bang':
    case 'cloud': {
      const minWidthWithIcon = bbox.width + iconSize + iconPadding * 2 + basePadding;
      width = Math.max(baseWidth, minWidthWithIcon);
      height = Math.max(baseHeight, iconSize + basePadding);

      const availableTextSpace = width - iconSize - iconPadding * 2;
      labelXOffset = -width / 2 + iconSize + iconPadding + availableTextSpace / 2 - bbox.width / 2;
      break;
    }

    default: {
      const minWidthWithIcon = bbox.width + iconSize + iconPadding * 2 + basePadding * 2;
      width = Math.max(baseWidth, minWidthWithIcon);
      height = Math.max(baseHeight, iconSize + basePadding * 2);

      const availableTextSpace = width - iconSize - iconPadding * 2;
      labelXOffset = -width / 2 + iconSize + iconPadding + availableTextSpace / 2 - bbox.width / 2;
      break;
    }
  }

  return {
    width,
    height,
    labelOffset: { x: labelXOffset, y: labelYOffset },
  };
}

/**
 * Insert mindmap icon into the shape SVG element
 */
export async function insertMindmapIcon(
  parentElement: D3Selection<SVGGraphicsElement>,
  node: Node,
  config: MindmapIconConfig
): Promise<void> {
  if (!node.icon) {
    return;
  }

  const { iconSize, iconPadding, shapeType } = config;
  const section = node.section === undefined ? -1 : node.section;

  let iconName = node.icon;
  const isCssFormat = iconName.includes(' ');

  if (isCssFormat) {
    iconName = iconName.replace(' ', ':');
  }

  try {
    if (await isIconAvailable(iconName)) {
      const iconSvg = await getIconSVG(
        iconName,
        {
          height: iconSize,
          width: iconSize,
        },
        { class: 'label-icon' }
      );

      const iconElem = parentElement.append('g');
      iconElem.html(`<g>${iconSvg}</g>`);

      let iconX = 0;
      let iconY = 0;

      switch (shapeType) {
        case 'circle': {
          const nodeWidth = node.width || 100;
          const radius = nodeWidth / 2;
          iconX = -radius + iconSize / 2 + iconPadding;
          iconY = 0;
          break;
        }
        default: {
          const nodeWidth = node.width || 100;
          iconX = -nodeWidth / 2 + iconSize / 2 + iconPadding;
          iconY = 0;
          break;
        }
      }

      iconElem.attr('transform', `translate(${iconX}, ${iconY})`);
      // Use currentColor to inherit label color - works for all shapes including bang
      iconElem.attr('style', 'color: currentColor;');
      return;
    }
  } catch (error) {
    log.debug('SVG icon rendering failed, falling back to CSS:', error);
  }

  // Fallback to CSS approach (original mindmap behavior)
  const iconClass = isCssFormat ? node.icon : node.icon.replace(':', ' ');

  let iconX = 0;
  const iconY = -iconSize / 2;

  switch (shapeType) {
    case 'circle': {
      const nodeWidth = node.width || 100;
      const radius = nodeWidth / 2;
      iconX = -radius + iconPadding;
      break;
    }
    default: {
      const nodeWidth = node.width || 100;
      iconX = -nodeWidth / 2;
      break;
    }
  }

  const icon = parentElement
    .append('foreignObject')
    .attr('height', `${iconSize}px`)
    .attr('width', `${iconSize}px`)
    .attr('x', iconX)
    .attr('y', iconY)
    .attr(
      'style',
      'text-align: center; display: flex; align-items: center; justify-content: center;'
    );

  icon
    .append('div')
    .attr('class', 'icon-container')
    .attr(
      'style',
      'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;'
    )
    .append('i')
    .attr('class', `node-icon-${section} ${iconClass}`)
    .attr('style', `font-size: ${iconSize}px;`);
}
