import type { DrawDefinition, SVG, SVGGroup } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import {
  insertEdgeLabel,
  positionEdgeLabel,
} from '../../rendering-util/rendering-elements/edges.js';
import { db } from './usecaseDb.js';
import { ARROW_TYPE } from './usecaseTypes.js';
import type { Actor, UseCase, SystemBoundary, Relationship } from './usecaseTypes.js';

// Layout constants
const ACTOR_WIDTH = 80;
const ACTOR_HEIGHT = 100;
const USECASE_WIDTH = 120;
const USECASE_HEIGHT = 60;
const SYSTEM_BOUNDARY_PADDING = 30;
const MARGIN = 50;
const SPACING_X = 200;
const SPACING_Y = 150;

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
 * Draw an actor (stick figure) with metadata support
 */
const drawActor = (group: SVGGroup, actor: Actor, x: number, y: number): void => {
  const actorGroup = group.append('g').attr('class', 'actor').attr('id', actor.id);
  const styling = getActorStyling(actor.metadata);

  // Add metadata as data attributes for CSS styling
  if (actor.metadata) {
    Object.entries(actor.metadata).forEach(([key, value]) => {
      actorGroup.attr(`data-${key}`, value);
    });
  }

  // Check if we should render an icon instead of stick figure
  if (actor.metadata?.icon) {
    drawActorWithIcon(actorGroup, actor, x, y, styling);
  } else {
    drawStickFigure(actorGroup, actor, x, y, styling);
  }

  // Actor name (always rendered)
  const displayName = actor.metadata?.name ?? actor.name;
  actorGroup
    .append('text')
    .attr('x', x)
    .attr('y', y + 50)
    .attr('text-anchor', 'middle')
    .attr('class', 'actor-label')
    .text(displayName);
};

/**
 * Draw traditional stick figure
 */
const drawStickFigure = (
  actorGroup: SVGGroup,
  _actor: Actor,
  x: number,
  y: number,
  styling: ReturnType<typeof getActorStyling>
): void => {
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
};

/**
 * Draw actor with icon representation
 */
const drawActorWithIcon = (
  actorGroup: SVGGroup,
  actor: Actor,
  x: number,
  y: number,
  styling: ReturnType<typeof getActorStyling>
): void => {
  const iconName = actor.metadata?.icon ?? 'user';

  // Create a rectangle background for the icon
  actorGroup
    .append('rect')
    .attr('x', x - 20)
    .attr('y', y - 35)
    .attr('width', 40)
    .attr('height', 40)
    .attr('rx', 5)
    .attr('fill', styling.fillColor === 'none' ? 'white' : styling.fillColor)
    .attr('stroke', styling.strokeColor)
    .attr('stroke-width', styling.strokeWidth);

  // Add icon text (could be enhanced to use actual icons/SVG symbols)
  actorGroup
    .append('text')
    .attr('x', x)
    .attr('y', y - 10)
    .attr('text-anchor', 'middle')
    .attr('class', 'actor-icon')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text(getIconSymbol(iconName));
};

/**
 * Get symbol representation for common icons
 */
const getIconSymbol = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    user: '👤',
    admin: '👑',
    system: '⚙️',
    database: '🗄️',
    api: '🔌',
    service: '🔧',
    client: '💻',
    server: '🖥️',
    mobile: '📱',
    web: '🌐',
    default: '👤',
  };

  return iconMap[iconName.toLowerCase()] || iconMap.default;
};

/**
 * Draw a use case (oval)
 */
const drawUseCase = (group: SVGGroup, useCase: UseCase, x: number, y: number): void => {
  const useCaseGroup = group.append('g').attr('class', 'usecase').attr('id', useCase.id);

  // Oval
  useCaseGroup
    .append('ellipse')
    .attr('cx', x)
    .attr('cy', y)
    .attr('rx', USECASE_WIDTH / 2)
    .attr('ry', USECASE_HEIGHT / 2)
    .attr('fill', 'white')
    .attr('stroke', 'black')
    .attr('stroke-width', 2);

  // Use case name
  useCaseGroup
    .append('text')
    .attr('x', x)
    .attr('y', y + 5)
    .attr('text-anchor', 'middle')
    .attr('class', 'usecase-label')
    .text(useCase.name);
};

/**
 * Draw a system boundary (supports both 'rect' and 'package' types)
 */
const drawSystemBoundary = (
  group: SVGGroup,
  boundary: SystemBoundary,
  useCasePositions: Map<string, { x: number; y: number }>
): void => {
  // Calculate boundary dimensions based on contained use cases
  const containedUseCases = boundary.useCases
    .map((ucId) => useCasePositions.get(ucId))
    .filter((pos) => pos !== undefined) as { x: number; y: number }[];

  if (containedUseCases.length === 0) {
    return; // No use cases to bound
  }

  // Find min/max coordinates of contained use cases
  const minX =
    Math.min(...containedUseCases.map((pos) => pos.x)) -
    USECASE_WIDTH / 2 -
    SYSTEM_BOUNDARY_PADDING;
  const maxX =
    Math.max(...containedUseCases.map((pos) => pos.x)) +
    USECASE_WIDTH / 2 +
    SYSTEM_BOUNDARY_PADDING;
  const minY =
    Math.min(...containedUseCases.map((pos) => pos.y)) -
    USECASE_HEIGHT / 2 -
    SYSTEM_BOUNDARY_PADDING;
  const maxY =
    Math.max(...containedUseCases.map((pos) => pos.y)) +
    USECASE_HEIGHT / 2 +
    SYSTEM_BOUNDARY_PADDING;

  const boundaryType = boundary.type || 'rect'; // default to 'rect'
  const boundaryGroup = group.append('g').attr('class', 'system-boundary').attr('id', boundary.id);

  if (boundaryType === 'package') {
    drawPackageBoundary(boundaryGroup, boundary, minX, minY, maxX, maxY);
  } else {
    drawRectBoundary(boundaryGroup, boundary, minX, minY, maxX, maxY);
  }
};

/**
 * Draw rect-type system boundary (simple dashed rectangle)
 */
const drawRectBoundary = (
  boundaryGroup: SVGGroup,
  boundary: SystemBoundary,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): void => {
  // Draw dashed rectangle
  boundaryGroup
    .append('rect')
    .attr('x', minX)
    .attr('y', minY)
    .attr('width', maxX - minX)
    .attr('height', maxY - minY)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,5');
  // .attr('rx', 10)
  // .attr('ry', 10);

  // Draw boundary label at top-left
  boundaryGroup
    .append('text')
    .attr('x', minX + 10)
    .attr('y', minY + 20)
    .attr('class', 'system-boundary-label')
    .attr('font-weight', 'bold')
    .attr('font-size', '14px')
    .text(boundary.name);
};

/**
 * Draw package-type system boundary (rectangle with separate name box)
 */
const drawPackageBoundary = (
  boundaryGroup: SVGGroup,
  boundary: SystemBoundary,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): void => {
  // Calculate name box dimensions
  const nameBoxWidth = Math.max(80, boundary.name.length * 8 + 20);
  const nameBoxHeight = 25;

  // Draw main boundary rectangle
  boundaryGroup
    .append('rect')
    .attr('x', minX)
    .attr('y', minY)
    .attr('width', maxX - minX)
    .attr('height', maxY - minY)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 2);

  // Draw name box (package tab)
  boundaryGroup
    .append('rect')
    .attr('x', minX)
    .attr('y', minY - nameBoxHeight)
    .attr('width', nameBoxWidth)
    .attr('height', nameBoxHeight)
    .attr('fill', 'white')
    .attr('stroke', 'black')
    .attr('stroke-width', 2);
  // .attr('rx', 5)
  // .attr('ry', 5);

  // Draw boundary label in the name box
  boundaryGroup
    .append('text')
    .attr('x', minX + nameBoxWidth / 2)
    .attr('y', minY - nameBoxHeight / 2 + 5)
    .attr('text-anchor', 'middle')
    .attr('class', 'system-boundary-label')
    .attr('font-weight', 'bold')
    .attr('font-size', '14px')
    .text(boundary.name);
};

/**
 * Draw a relationship (line with arrow)
 */
const drawRelationship = async (
  group: SVGGroup,
  relationship: Relationship,
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number }
): Promise<void> => {
  const relationshipGroup = group
    .append('g')
    .attr('class', 'relationship')
    .attr('id', relationship.id);

  // Calculate arrow direction
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / length;
  const unitY = dy / length;

  // Adjust start and end points to avoid overlapping with shapes
  const startX = fromPos.x + unitX * 40;
  const startY = fromPos.y + unitY * 40;
  const endX = toPos.x - unitX * 60;
  const endY = toPos.y - unitY * 30;

  // Main line
  relationshipGroup
    .append('line')
    .attr('x1', startX)
    .attr('y1', startY)
    .attr('x2', endX)
    .attr('y2', endY)
    .attr('stroke', 'black')
    .attr('stroke-width', 2);

  // Draw arrow based on arrow type
  const arrowSize = 10;

  if (relationship.arrowType === ARROW_TYPE.SOLID_ARROW) {
    // Forward arrow (-->)
    const arrowX1 = endX - arrowSize * unitX - arrowSize * unitY * 0.5;
    const arrowY1 = endY - arrowSize * unitY + arrowSize * unitX * 0.5;
    const arrowX2 = endX - arrowSize * unitX + arrowSize * unitY * 0.5;
    const arrowY2 = endY - arrowSize * unitY - arrowSize * unitX * 0.5;

    relationshipGroup
      .append('polygon')
      .attr('points', `${endX},${endY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`)
      .attr('fill', 'black');
  } else if (relationship.arrowType === ARROW_TYPE.BACK_ARROW) {
    // Backward arrow (<--)
    const arrowX1 = startX + arrowSize * unitX - arrowSize * unitY * 0.5;
    const arrowY1 = startY + arrowSize * unitY + arrowSize * unitX * 0.5;
    const arrowX2 = startX + arrowSize * unitX + arrowSize * unitY * 0.5;
    const arrowY2 = startY + arrowSize * unitY - arrowSize * unitX * 0.5;

    relationshipGroup
      .append('polygon')
      .attr('points', `${startX},${startY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`)
      .attr('fill', 'black');
  }
  // For LINE_SOLID (--), no arrow head is drawn

  // Enhanced edge label rendering (if present)
  if (relationship.label) {
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Create edge data structure compatible with the edge label system
    const edgeData = {
      id: relationship.id,
      label: relationship.label,
      labelStyle: 'stroke: #333; stroke-width: 1.5px; fill: none;',
      x: midX,
      y: midY,
      width: 0,
      height: 0,
    };

    try {
      // Use the proper edge label rendering system
      await insertEdgeLabel(relationshipGroup, edgeData);

      // Position the edge label at the midpoint
      const points = [
        { x: startX, y: startY },
        { x: midX, y: midY },
        { x: endX, y: endY },
      ];

      positionEdgeLabel(edgeData, {
        originalPath: points,
      });
    } catch (error) {
      // Fallback to simple text if edge label system fails
      log.warn(
        'Failed to render edge label with advanced system, falling back to simple text:',
        error
      );
      relationshipGroup
        .append('text')
        .attr('x', midX)
        .attr('y', midY - 5)
        .attr('text-anchor', 'middle')
        .attr('class', 'relationship-label')
        .text(relationship.label);
    }
  }
};

/**
 * Main draw function
 */
const draw: DrawDefinition = async (text, id, _version) => {
  log.debug('Rendering usecase diagram\n' + text);

  const svg: SVG = selectSvgElement(id);
  const group: SVGGroup = svg.append('g');

  // Get data from database
  const actors = [...db.getActors().values()];
  const useCases = [...db.getUseCases().values()];
  const systemBoundaries = [...db.getSystemBoundaries().values()];
  const relationships = db.getRelationships();

  log.debug('Rendering data:', {
    actors: actors.length,
    useCases: useCases.length,
    systemBoundaries: systemBoundaries.length,
    relationships: relationships.length,
  });

  // Calculate layout
  const actorPositions = new Map<string, { x: number; y: number }>();
  const useCasePositions = new Map<string, { x: number; y: number }>();

  // Position actors on the left
  actors.forEach((actor, index) => {
    const x = MARGIN + ACTOR_WIDTH / 2;
    const y = MARGIN + ACTOR_HEIGHT / 2 + index * SPACING_Y;
    actorPositions.set(actor.id, { x, y });
  });

  // Position use cases on the right
  useCases.forEach((useCase, index) => {
    const x = MARGIN + SPACING_X + USECASE_WIDTH / 2;
    const y = MARGIN + USECASE_HEIGHT / 2 + index * SPACING_Y;
    useCasePositions.set(useCase.id, { x, y });
  });

  // Draw actors
  actors.forEach((actor) => {
    const pos = actorPositions.get(actor.id)!;
    drawActor(group, actor, pos.x, pos.y);
  });

  // Draw use cases
  useCases.forEach((useCase) => {
    const pos = useCasePositions.get(useCase.id)!;
    drawUseCase(group, useCase, pos.x, pos.y);
  });

  // Draw system boundaries (after use cases, before relationships)
  systemBoundaries.forEach((boundary) => {
    drawSystemBoundary(group, boundary, useCasePositions);
  });

  // Draw relationships (async to handle edge labels)
  const relationshipPromises = relationships.map(async (relationship) => {
    const fromPos =
      actorPositions.get(relationship.from) ?? useCasePositions.get(relationship.from);
    const toPos = actorPositions.get(relationship.to) ?? useCasePositions.get(relationship.to);

    if (fromPos && toPos) {
      await drawRelationship(group, relationship, fromPos, toPos);
    }
  });

  // Wait for all relationships to be drawn
  await Promise.all(relationshipPromises);

  // Setup viewBox and SVG dimensions properly
  const { usecase: conf } = getConfig();
  const padding = 8; // Standard padding used by other diagrams
  setupViewPortForSVG(svg, padding, 'usecaseDiagram', conf?.useMaxWidth ?? true);
};

export const renderer = { draw };
