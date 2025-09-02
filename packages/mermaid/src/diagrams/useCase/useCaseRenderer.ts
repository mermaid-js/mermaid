import { select } from 'd3';
import type { Diagram } from '../../Diagram.js';
import type { UseCaseDB } from './useCaseDb.js';
import { log } from '../../logger.js';

// Position interfaces
interface NodePosition {
  name: string;  // node ID (for relationship matching)
  label: string; // node label (for display)
  x: number;
  y: number;
  width: number;
  height: number;
}

// Constants for actor rendering
const ACTOR_TYPE_WIDTH = 36; // 18 * 2 from sequence diagram
const ACTOR_MAN_FIGURE_CLASS = 'usecase-actor-man';
const ACTOR_SPACING = 120; // Horizontal spacing between actors
const ACTOR_HEIGHT = 80; // Height of actor figure
const MARGIN = 50; // Margin around the diagram

// Simple actor interface for positioning
interface ActorPosition {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  metadata?: Record<string, string>;
}

// System boundary interface for positioning
interface SystemBoundaryPosition {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  useCases: UseCasePosition[];
  metadata?: Record<string, string>;
}

// Use case interface for positioning
interface UseCasePosition {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Draws a stick figure actor similar to sequence diagrams but optimized for useCase
 */
const drawActorTypeActor = (elem: any, actor: ActorPosition, conf: any): number => {
  const center = actor.x + actor.width / 2;
  const actorY = actor.y;

  // Create actor group
  const actElem = elem.append('g');
  actElem.attr('class', ACTOR_MAN_FIGURE_CLASS);
  actElem.attr('name', actor.name);

  // Draw stick figure
  // Head (circle)
  actElem
    .append('circle')
    .attr('cx', center)
    .attr('cy', actorY + 15)
    .attr('r', 10);

  // Body (torso line)
  actElem
    .append('line')
    .attr('x1', center)
    .attr('y1', actorY + 25)
    .attr('x2', center)
    .attr('y2', actorY + 50)
    .style('stroke', 'black');

  // Arms (horizontal line)
  actElem
    .append('line')
    .attr('x1', center - ACTOR_TYPE_WIDTH / 2)
    .attr('y1', actorY + 35)
    .attr('x2', center + ACTOR_TYPE_WIDTH / 2)
    .style('stroke', 'black')
    .attr('y2', actorY + 35);

  // Left leg
  actElem
    .append('line')
    .attr('x1', center)
    .attr('y1', actorY + 50)
    .attr('x2', center - ACTOR_TYPE_WIDTH / 2)
    .style('stroke', 'black')
    .attr('y2', actorY + 70);

  // Right leg
  actElem
    .append('line')
    .attr('x1', center)
    .attr('y1', actorY + 50)
    .attr('x2', center + ACTOR_TYPE_WIDTH / 2)
    .attr('y2', actorY + 70)
    .style('stroke', 'black');

  // Actor name text
  const textY = actorY + ACTOR_HEIGHT + 15;
  drawActorText(actor.name, actElem, actor.x, textY, actor.width, 20);

  return ACTOR_HEIGHT; // Total height including text and metadata
};

/**
 * Draws text for actor name - simplified version of sequence diagram text drawing
 */
const drawActorText = (content: string, g: any, x: number, y: number, width: number, height: number): void => {
  g.append('text')
    .attr('x', x + width / 2)
    .attr('y', y + height / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .text(content);
};

/**
 * Draws a system boundary box with use cases inside
 */
const drawSystemBoundary = (g: any, boundary: SystemBoundaryPosition, conf: any): void => {
  // Determine boundary type from metadata (default to 'rect')
  const boundaryType = boundary.metadata?.type || 'rect';

  if (boundaryType === 'package') {
    // Draw package-style boundary with title box
    const titleHeight = 25;
    const titleWidth = Math.max(100, boundary.name.length * 8 + 20);

    // Draw main boundary rectangle
    g.append('rect')
      .attr('x', boundary.x)
      .attr('y', boundary.y + titleHeight)
      .attr('width', boundary.width)
      .attr('height', boundary.height - titleHeight)
      .attr('class', 'usecase-system-boundary')
      .attr('fill', 'none')
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    // Draw title box
    g.append('rect')
      .attr('x', boundary.x)
      .attr('y', boundary.y)
      .attr('width', titleWidth)
      .attr('height', titleHeight)
      .attr('class', 'usecase-system-boundary')
      .attr('fill', 'none')
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    // Draw title text
    g.append('text')
      .attr('x', boundary.x + titleWidth / 2)
      .attr('y', boundary.y + titleHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('font-family', 'Arial, sans-serif')
      .style('fill', '#333')
      .text(boundary.name);
  } else {
    // Draw rect-style boundary (default)
    g.append('rect')
      .attr('x', boundary.x)
      .attr('y', boundary.y)
      .attr('width', boundary.width)
      .attr('height', boundary.height)
      .attr('fill', 'none')
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Draw boundary title
    g.append('text')
      .attr('x', boundary.x + 10)
      .attr('y', boundary.y + 20)
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('font-family', 'Arial, sans-serif')
      .style('fill', '#333')
      .text(boundary.name);
  }

  // Draw use cases inside the boundary
  boundary.useCases.forEach((useCase) => {
    // Draw use case oval
    g.append('ellipse')
      .attr('cx', useCase.x + useCase.width / 2)
      .attr('cy', useCase.y + useCase.height / 2)
      .attr('rx', useCase.width / 2)
      .attr('ry', useCase.height / 2)
      .attr('class', 'usecase-usecase')
      .attr('fill', 'none')
      .attr('stroke', '#333');

    // Draw use case text
    g.append('text')
      .attr('x', useCase.x + useCase.width / 2)
      .attr('y', useCase.y + useCase.height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .text(useCase.name);
  });
};

/**
 * Draws a standalone node as an oval
 */
const drawNode = (g: any, nodePos: NodePosition): void => {
  const nodeGroup = g.append('g').attr('class', `node-${nodePos.name}`);

  // Draw oval background
  nodeGroup.append('ellipse')
    .attr('cx', nodePos.x + nodePos.width / 2)
    .attr('cy', nodePos.y + nodePos.height / 2)
    .attr('rx', nodePos.width / 2)
    .attr('ry', nodePos.height / 2)
    .attr('fill', 'none')
    .attr('stroke', '#333')
    .attr('class', 'usecase-node');

  // Add node label
  nodeGroup.append('text')
    .attr('x', nodePos.x + nodePos.width / 2)
    .attr('y', nodePos.y + nodePos.height / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .text(nodePos.label);
};

/**
 * Draws an arrow relationship between entities (actor-to-usecase or actor-to-actor)
 */
const drawRelationship = (g: any, relationship: any, actorPositions: ActorPosition[], boundaryPositions: SystemBoundaryPosition[], conf: any): void => {
  // Find the source entity (always an actor)
  const fromEntity = actorPositions.find(a => a.name === relationship.from);
  if (!fromEntity) {
    return;
  }

  // Find the target entity (could be a use case or another actor)
  let toEntity: UseCasePosition | ActorPosition | undefined;
  let isTargetUseCase = false;

  // First check if target is a use case in system boundaries
  for (const boundary of boundaryPositions) {
    toEntity = boundary.useCases.find(uc => uc.name === relationship.to);
    if (toEntity) {
      isTargetUseCase = true;
      break;
    }
  }

  // If not found in boundaries, check if target is another actor
  toEntity ??= actorPositions.find(a => a.name === relationship.to);

  if (!toEntity) {
    return;
  }

  // Calculate connection points
  const fromCenterX = fromEntity.x + fromEntity.width / 2;
  const fromCenterY = fromEntity.y + fromEntity.height / 2;

  // For use cases, connect to the edge (left side), for actors connect to center
  const toCenterX = isTargetUseCase ? toEntity.x : toEntity.x + toEntity.width / 2;
  const toCenterY = isTargetUseCase ? toEntity.y + toEntity.height / 2 : toEntity.y + toEntity.height / 2;

  // Draw arrow line
  g.append('line')
    .attr('x1', fromCenterX)
    .attr('y1', fromCenterY)
    .attr('x2', toCenterX)
    .attr('y2', toCenterY)
    .attr('class', 'usecase-arrow')
    .attr('stroke', '#333')
    .attr('marker-end', 'url(#arrowhead)');

  // Add edge label if present
  if (relationship.label) {
    const midX = (fromCenterX + toCenterX) / 2;
    const midY = (fromCenterY + toCenterY) / 2;

    g.append('text')
      .attr('x', midX)
      .attr('y', midY - 5)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('class', 'usecase-arrow-label')
      .attr('stroke', '#333')
      .attr('font-weight', 200)
      .text(relationship.label);
  }

  // Add arrowhead marker definition if not already added
  const defs = g.select('defs').empty() ? g.append('defs') : g.select('defs');

  if (defs.select('#arrowhead').empty()) {
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 3)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L0,6 L9,3 z')
      .attr('fill', '#333');
  }
};

/**
 * Draws an arrow relationship between an actor and a standalone node
 */
const drawNodeRelationship = (g: any, relationship: any, actorPositions: ActorPosition[], nodePositions: NodePosition[], conf: any): void => {
  // Find the actor position
  const actor = actorPositions.find(a => a.name === relationship.from);
  if (!actor) {return};

  // Find the node position
  const node = nodePositions.find(n => n.name === relationship.to);
  if (!node) {return};

  // Calculate connection points
  const actorCenterX = actor.x + actor.width / 2;
  const actorCenterY = actor.y + actor.height / 2;

  // For nodes (which are like use cases), connect to the edge (left side)
  const nodeCenterX = node.x;
  const nodeCenterY = node.y + node.height / 2;

  // Draw arrow line
  g.append('line')
    .attr('x1', actorCenterX)
    .attr('y1', actorCenterY)
    .attr('x2', nodeCenterX)
    .attr('y2', nodeCenterY)
    .attr('stroke', '#333')
    .attr('stroke-width', 2)
    .attr('marker-end', 'url(#arrowhead)');

  // Add edge label if present
  if (relationship.label) {
    const midX = (actorCenterX + nodeCenterX) / 2;
    const midY = (actorCenterY + nodeCenterY) / 2;

    g.append('text')
      .attr('x', midX)
      .attr('y', midY - 5)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('fill', '#333')
      .text(relationship.label);
  }

  // Add arrowhead marker definition if not already added
  const defs = g.select('defs').empty() ? g.append('defs') : g.select('defs');

  if (defs.select('#arrowhead').empty()) {
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 3)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L0,6 L9,3 z')
      .attr('fill', '#333');
  }
};

/**
 * Draws an arrow relationship from an inline actor-node definition
 */
const drawInlineRelationship = (g: any, relationship: any, actorPositions: ActorPosition[], nodePositions: NodePosition[], conf: any): void => {
  // Find the actor position
  const actor = actorPositions.find(a => a.name === relationship.actor);
  if (!actor) {return};

  // Find the node position by node ID
  const node = nodePositions.find(n => n.name === relationship.node.id);
  if (!node) {return};

  // Calculate connection points
  const actorCenterX = actor.x + actor.width / 2;
  const actorCenterY = actor.y + actor.height / 2;

  // For nodes (which are like use cases), connect to the edge (left side)
  const nodeCenterX = node.x;
  const nodeCenterY = node.y + node.height / 2;

  // Draw arrow line
  g.append('line')
    .attr('x1', actorCenterX)
    .attr('y1', actorCenterY)
    .attr('x2', nodeCenterX)
    .attr('y2', nodeCenterY)
    .attr('stroke', '#333')
    .attr('stroke-width', 1)
    .attr('marker-end', 'url(#arrowhead)');

  // Add edge label if present
  if (relationship.label) {
    const midX = (actorCenterX + nodeCenterX) / 2;
    const midY = (actorCenterY + nodeCenterY) / 2;

    g.append('text')
      .attr('x', midX)
      .attr('y', midY - 5)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('fill', '#333')
      .text(relationship.label);
  }

  // Add arrowhead marker definition if not already added
  const defs = g.select('defs').empty() ? g.append('defs') : g.select('defs');

  if (defs.select('#arrowhead').empty()) {
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 3)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L0,6 L9,3 z')
      .attr('fill', '#333');
  }
};

/**
 * Main draw function for useCase diagrams
 */
const draw = (text: string, id: string, version: string, diagram: Diagram): void => {
  const db = diagram.db as UseCaseDB;

  log.debug('Drawing useCase diagram', id);

  const actors = db.getActors();
  const systemBoundaries = db.getSystemBoundaries();
  const useCases = db.getUseCases();
  const relationships = db.getRelationships();
  const nodes = db.getNodes();
  const nodeRelationships = db.getNodeRelationships();
  const inlineRelationships = db.getInlineRelationships();

  // Create SVG container - use the same approach as other diagrams
  const svg = select(`[id="${id}"]`);
  svg.selectAll('*').remove();

  if (actors.length === 0 && systemBoundaries.length === 0 && useCases.length === 0 && relationships.length === 0 && nodes.length === 0 && nodeRelationships.length === 0 && inlineRelationships.length === 0) {
    // Empty diagram
    svg.attr('width', 200);
    svg.attr('height', 100);
    return;
  }

  // Calculate layout
  let currentX = MARGIN;
  let currentY = MARGIN;
  let maxHeight = 0;

  // Position actors
  const actorPositions: ActorPosition[] = actors.map((actor, index) => ({
    name: actor.name,
    x: currentX + index * ACTOR_SPACING,
    y: currentY,
    width: ACTOR_TYPE_WIDTH + 20, // Extra width for text
    height: ACTOR_HEIGHT,
    metadata: actor.metadata
  }));

  if (actors.length > 0) {
    currentX += actors.length * ACTOR_SPACING;
    maxHeight = Math.max(maxHeight, ACTOR_HEIGHT + 50);
  }

  // Position system boundaries
  const boundaryPositions: SystemBoundaryPosition[] = systemBoundaries.map((boundary, index) => {
    const boundaryWidth = Math.max(200, boundary.useCases.length * 120);
    const boundaryHeight = 150;

    const position: SystemBoundaryPosition = {
      name: boundary.name,
      x: currentX + index * (boundaryWidth + 50),
      y: currentY,
      width: boundaryWidth,
      height: boundaryHeight,
      metadata: boundary.metadata,
      useCases: boundary.useCases.map((useCase, ucIndex) => ({
        name: useCase.name,
        x: currentX + index * (boundaryWidth + 50) + 20 + ucIndex * 100,
        y: currentY + 40,
        width: 80,
        height: 40
      }))
    };

    return position;
  });

  if (systemBoundaries.length > 0) {
    const totalBoundaryWidth = systemBoundaries.reduce((sum, boundary, index) => {
      const boundaryWidth = Math.max(200, boundary.useCases.length * 120);
      return sum + boundaryWidth + (index > 0 ? 50 : 0);
    }, 0);
    currentX += totalBoundaryWidth;
    maxHeight = Math.max(maxHeight, 150);
  }

  // Position standalone nodes

  const nodePositions: NodePosition[] = [];
  if (nodes.length > 0) {
    currentX += 50; // Add some spacing
    nodes.forEach((node, index) => {
      const nodeWidth = Math.max(100, node.label.length * 8);
      const nodeHeight = 40;

      nodePositions.push({
        name: node.id,
        label: node.label,
        x: currentX,
        y: MARGIN + 50,
        width: nodeWidth,
        height: nodeHeight
      });

      currentX += nodeWidth + 50;
    });
    maxHeight = Math.max(maxHeight, 90);
  }

  // Create main group
  const g = svg.append('g').attr('class', 'usecase-diagram');

  // Default configuration
  const conf = {
    actorFontSize: '14px',
    actorFontFamily: 'Arial, sans-serif',
    actorFontWeight: 'normal'
  };

  // Draw all actors
  actorPositions.forEach((actorPos) => {
    const height = drawActorTypeActor(g, actorPos, conf);
    maxHeight = Math.max(maxHeight, height);
  });

  // Draw system boundaries
  boundaryPositions.forEach((boundaryPos) => {
    drawSystemBoundary(g, boundaryPos, conf);
  });

  // Draw standalone nodes
  nodePositions.forEach((nodePos) => {
    drawNode(g, nodePos);
  });

  // Draw relationships (arrows)
  relationships.forEach((relationship) => {
    drawRelationship(g, relationship, actorPositions, boundaryPositions, conf);
  });

  // Draw node relationships (arrows to standalone nodes)
  nodeRelationships.forEach((relationship) => {
    drawNodeRelationship(g, relationship, actorPositions, nodePositions, conf);
  });

  // Draw inline relationships (from inline actor-node definitions)
  inlineRelationships.forEach((relationship) => {
    drawInlineRelationship(g, relationship, actorPositions, nodePositions, conf);
  });

  // Calculate total dimensions
  let totalWidth = MARGIN;
  if (actors.length > 0) {
    totalWidth = Math.max(totalWidth, actorPositions[actorPositions.length - 1].x + actorPositions[actorPositions.length - 1].width + MARGIN);
  }
  if (systemBoundaries.length > 0) {
    totalWidth = Math.max(totalWidth, boundaryPositions[boundaryPositions.length - 1].x + boundaryPositions[boundaryPositions.length - 1].width + MARGIN);
  }
  if (nodePositions.length > 0) {
    totalWidth = Math.max(totalWidth, nodePositions[nodePositions.length - 1].x + nodePositions[nodePositions.length - 1].width + MARGIN);
  }

  const totalHeight = MARGIN + maxHeight + MARGIN;

  // Set SVG dimensions
  svg.attr('width', totalWidth);
  svg.attr('height', totalHeight);
  svg.attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
};

export default {
  draw,
};
