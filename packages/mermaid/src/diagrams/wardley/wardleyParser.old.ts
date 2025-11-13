import type { ParserDefinition } from '../../diagram-api/types.js';
import db from './wardleyDb.js';

interface NodeRef {
  id: string;
  label: string;
  className?: string;
  x?: number;
  y?: number;
  hasCoords: boolean;
  labelOffsetX?: number;
  labelOffsetY?: number;
}

const HEADER_REGEX = /^wardley[\w-]*/i;
const COMMENT_PATTERN = /%%.*$/;
// Matches: A -> B, A --> B, A -.-> B, A +> B, A +< B, A +<> B, A +'label'> B
// Also supports annotations: A -> B; annotation
const ARROW_REGEX = /^(.*?)\s*(\+(?:'[^']*')?(?:<>|<|>)|-{1,2}>|-.->)\s*([^;]+)(?:;\s*(.+))?$/;
const NODE_COORD_REGEX = /^(.*?)\(([^,]+),\s*([^)]+)\)\s*$/;
const COORDINATE_PAIR_REGEX = /^\(([^,]+),\s*([^)]+)\)$/;
const EVOLVE_REGEX = /^evolve\s+(.+?)\s+([\d.]+)(?:\s+label\s+\[.+?])?$/i;
const ANCHOR_REGEX = /^anchor\s+(.+?)\s+\[([^\]]+)](?:\s+label\s+\[([^\]]+)])?$/i;
const COMPONENT_REGEX = /^component\s+(.+?)\s+\[([^\]]+)](?:\s+label\s+\[([^\]]+)])?(?:\s+(.+))?$/i;
const NOTE_REGEX = /^note\s+(.+?)\s+\[([^\]]+)]$/i;
const ACCELERATOR_REGEX = /^accelerator\s+(.+?)\s+\[([^\]]+)]$/i;
const DEACCELERATOR_REGEX = /^deaccelerator\s+(.+?)\s+\[([^\]]+)]$/i;
const AREA_REGEX = /^area\s+(.+?)\s+\[([^\]]+)]$/i;
const SIZE_REGEX = /^size\s+\[([^\]]+)]$/i;
const ANNOTATIONS_BOX_REGEX = /^annotations\s+\[([^\]]+)]$/i;
const ANNOTATION_REGEX = /^annotation\s+(\d+),(\[.+])(?:\s+(.+))?$/i;
const PIPELINE_START_REGEX = /^pipeline\s+(.+?)\s*{?\s*$/i;
const BLOCK_CLOSE_REGEX = /^}\s*$/;
const LABEL_OFFSET_REGEX = /^([^,]+),\s*(.+)$/;

const parser: ParserDefinition = {
  parse: (text: string): Promise<void> => {
    try {
      const lines = text.split(/\r?\n/);
      let headerSeen = false;
      let pipelineContext: { nodeId: string; y: number } | null = null;

      for (const rawLine of lines) {
        const withoutComments = rawLine.replace(COMMENT_PATTERN, '').trim();
        if (!withoutComments) {
          continue;
        }

        if (!headerSeen) {
          if (HEADER_REGEX.test(withoutComments)) {
            headerSeen = true;
            continue;
          }
          throw new Error('Wardley diagram must start with `wardley`.');
        }

        if (HEADER_REGEX.test(withoutComments)) {
          continue;
        }

        // Handle closing brace to exit pipeline context
        if (pipelineContext && BLOCK_CLOSE_REGEX.test(withoutComments)) {
          pipelineContext = null;
          continue;
        }

        // Handle pipeline start to enter pipeline context
        const pipelineMatch = PIPELINE_START_REGEX.exec(withoutComments);
        if (pipelineMatch) {
          const componentName = pipelineMatch[1].trim();
          const nodeId = slugify(componentName);
          const node = db.getNode(nodeId);

          if (!node) {
            throw new Error(`Pipeline references unknown component: ${componentName}`);
          }

          if (typeof node.y !== 'number') {
            throw new Error(`Pipeline component "${componentName}" must have Y coordinate`);
          }

          pipelineContext = { nodeId, y: node.y };
          db.startPipeline(nodeId);
          continue;
        }

        const handled =
          handleMeta(withoutComments) ||
          handleAxis(withoutComments) ||
          handleAnchor(withoutComments) ||
          handleComponent(withoutComments, pipelineContext) ||
          handleNote(withoutComments) ||
          handleAccelerator(withoutComments) ||
          handleDeaccelerator(withoutComments) ||
          handleArea(withoutComments) ||
          handleSize(withoutComments) ||
          handleAnnotationsBox(withoutComments) ||
          handleAnnotation(withoutComments) ||
          handleEvolve(withoutComments) ||
          handleTrend(withoutComments) ||
          handleLink(withoutComments) ||
          handleNode(withoutComments);

        if (!handled) {
          throw new Error(`Unable to parse line: "${withoutComments}"`);
        }
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },
  parser: {
    yy: db,
  },
};

function handleMeta(line: string): boolean {
  if (/^title\s+/i.test(line)) {
    db.setDiagramTitle(line.replace(/^title\s+/i, '').trim());
    return true;
  }

  if (/^acctitle\s*:/i.test(line)) {
    db.setAccTitle(line.replace(/^acctitle\s*:/i, '').trim());
    return true;
  }

  if (/^accdescr\s*:/i.test(line)) {
    db.setAccDescription(line.replace(/^accdescr\s*:/i, '').trim());
    return true;
  }

  if (/^classdef\s+/i.test(line)) {
    // classDef is not yet supported but ignore to avoid parser failures
    return true;
  }

  return false;
}

function handleAxis(line: string): boolean {
  const lower = line.toLowerCase();
  if (lower.startsWith('x-axis')) {
    const label = line.slice(6).trim();
    if (label) {
      db.updateAxes({ xLabel: label });
    }
    return true;
  }

  if (lower.startsWith('y-axis')) {
    const label = line.slice(6).trim();
    if (label) {
      db.updateAxes({ yLabel: label });
    }
    return true;
  }

  if (lower.startsWith('evolution')) {
    const parsed = parseStages(line.replace(/^evolution/i, '').trim());
    db.updateAxes({
      xLabel: 'Evolution',
      stages: parsed.stages.length ? parsed.stages : undefined,
      stageBoundaries: parsed.boundaries.length ? parsed.boundaries : undefined,
    });
    return true;
  }

  if (lower.startsWith('visibility') || lower.startsWith('value-chain')) {
    db.updateAxes({ yLabel: 'Visibility' });
    return true;
  }

  return false;
}

function handleAnchor(line: string): boolean {
  const match = ANCHOR_REGEX.exec(line);
  if (!match) {
    return false;
  }

  const label = match[1].trim();
  const coords = parseOWMCoordinates(match[2]);
  const labelOffsets = parseLabelOffset(match[3]);
  const id = slugify(label);

  db.addNode(
    id,
    label,
    coords.x,
    coords.y,
    'anchor',
    labelOffsets.offsetX,
    labelOffsets.offsetY,
    false,
    undefined
  );
  return true;
}

function handleComponent(
  line: string,
  pipelineContext: { nodeId: string; y: number } | null
): boolean {
  const match = COMPONENT_REGEX.exec(line);
  if (!match) {
    return false;
  }

  const label = match[1].trim();
  const coordsRaw = match[2].trim();
  const labelOffsets = parseLabelOffset(match[3]);
  const decorators = match[4]?.trim() || '';

  // Parse decorators
  const hasInertia = /\binertia\b/i.test(decorators);
  let sourceStrategy: 'build' | 'buy' | 'outsource' | 'market' | undefined;
  if (/\(build\)/i.test(decorators)) {
    sourceStrategy = 'build';
  } else if (/\(buy\)/i.test(decorators)) {
    sourceStrategy = 'buy';
  } else if (/\(outsource\)/i.test(decorators)) {
    sourceStrategy = 'outsource';
  } else if (/\(market\)/i.test(decorators)) {
    sourceStrategy = 'market';
  }

  const id = slugify(label);

  // Check if this is a single-coordinate format (just x value) - no commas
  const hasSingleCoord = !coordsRaw.includes(',');

  if (hasSingleCoord) {
    // Single coordinate - must be in pipeline context
    if (!pipelineContext) {
      throw new Error(
        `Component "${label}" uses single coordinate but is not inside a pipeline block`
      );
    }

    // Parse the single coordinate and convert from 0-1 scale to 0-100 scale if needed
    const rawValue = Number.parseFloat(coordsRaw);
    if (Number.isNaN(rawValue)) {
      throw new Error(`Invalid coordinate value: ${coordsRaw}`);
    }

    const x = rawValue <= 1.0 ? rawValue * 100 : rawValue;

    if (x < 0 || x > 100) {
      throw new Error(`Coordinate must be between 0 and 1 (or 0 and 100): ${coordsRaw}`);
    }

    db.addNode(
      id,
      label,
      x,
      pipelineContext.y,
      undefined,
      labelOffsets.offsetX,
      labelOffsets.offsetY,
      hasInertia,
      sourceStrategy
    );
    db.addPipelineComponent(pipelineContext.nodeId, id);
  } else {
    // Two coordinates - normal format
    const coords = parseOWMCoordinates(coordsRaw);
    db.addNode(
      id,
      label,
      coords.x,
      coords.y,
      undefined,
      labelOffsets.offsetX,
      labelOffsets.offsetY,
      hasInertia,
      sourceStrategy
    );
  }

  return true;
}

function handleNote(line: string): boolean {
  const match = NOTE_REGEX.exec(line);
  if (!match) {
    return false;
  }

  const text = match[1];
  const coords = parseOWMCoordinates(match[2]);

  db.addNote(text, coords.x, coords.y);
  return true;
}

function handleAccelerator(line: string): boolean {
  const match = ACCELERATOR_REGEX.exec(line);
  if (!match) {
    return false;
  }

  const name = match[1].trim();
  const coords = parseOWMCoordinates(match[2]);

  db.addAccelerator(name, coords.x, coords.y);
  return true;
}

function handleDeaccelerator(line: string): boolean {
  const match = DEACCELERATOR_REGEX.exec(line);
  if (!match) {
    return false;
  }

  const name = match[1].trim();
  const coords = parseOWMCoordinates(match[2]);

  db.addDeaccelerator(name, coords.x, coords.y);
  return true;
}

function handleArea(line: string): boolean {
  const match = AREA_REGEX.exec(line);
  if (!match) {
    return false;
  }

  const name = match[1].trim();
  const coords = parseOWMCoordinates(match[2]);

  db.addArea(name, coords.x, coords.y);
  return true;
}

function handleSize(line: string): boolean {
  const match = SIZE_REGEX.exec(line);
  if (!match) {
    return false;
  }

  const parts = match[1].split(',').map((s) => s.trim());
  if (parts.length !== 2) {
    throw new Error(`Size requires exactly two values: width and height`);
  }

  const width = Number.parseInt(parts[0], 10);
  const height = Number.parseInt(parts[1], 10);

  if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) {
    throw new Error(`Size values must be positive integers: [${parts[0]}, ${parts[1]}]`);
  }

  db.setSize(width, height);
  return true;
}

function handleAnnotationsBox(line: string): boolean {
  const match = ANNOTATIONS_BOX_REGEX.exec(line);
  if (!match) {
    return false;
  }

  const coords = parseOWMCoordinates(match[1]);
  db.setAnnotationsBox(coords.x, coords.y);
  return true;
}

function handleAnnotation(line: string): boolean {
  const match = ANNOTATION_REGEX.exec(line);
  if (!match) {
    return false;
  }

  const number = Number.parseInt(match[1], 10);
  const coordsRaw = match[2].trim();
  const text = match[3]?.trim();

  // Parse coordinates - could be single [x,y] or multiple [[x1,y1],[x2,y2],...]
  const coordinates: { x: number; y: number }[] = [];

  // Check if it's a nested array [[...],[...]]
  if (coordsRaw.startsWith('[[')) {
    // Multiple coordinates
    const innerContent = coordsRaw.slice(1, -1); // Remove outer brackets
    const pairs = innerContent.match(/\[[^\]]+]/g);

    if (pairs) {
      for (const pair of pairs) {
        // Remove the brackets from each pair before parsing
        const withoutBrackets = pair.slice(1, -1);
        const coords = parseOWMCoordinates(withoutBrackets);
        coordinates.push({ x: coords.x, y: coords.y });
      }
    }
  } else {
    // Single coordinate - remove outer brackets
    const withoutBrackets = coordsRaw.slice(1, -1);
    const coords = parseOWMCoordinates(withoutBrackets);
    coordinates.push({ x: coords.x, y: coords.y });
  }

  if (coordinates.length === 0) {
    throw new Error(`Invalid annotation coordinates: ${coordsRaw}`);
  }

  db.addAnnotation(number, coordinates, text);
  return true;
}

function handleEvolve(line: string): boolean {
  const match = EVOLVE_REGEX.exec(line);
  if (!match) {
    return false;
  }

  const componentName = match[1].trim();
  const evolutionValue = Number.parseFloat(match[2]);

  if (Number.isNaN(evolutionValue)) {
    throw new Error(`Invalid evolution value: ${match[2]}`);
  }

  // Convert 0-1 scale to 0-100 scale if needed
  const targetX = evolutionValue <= 1.0 ? evolutionValue * 100 : evolutionValue;

  if (targetX < 0 || targetX > 100) {
    throw new Error(`Evolution value must be between 0 and 1 (or 0 and 100): ${match[2]}`);
  }

  const nodeId = slugify(componentName);
  const node = db.getNode(nodeId);

  if (!node) {
    throw new Error(`Cannot evolve unknown component: ${componentName}`);
  }

  if (typeof node.y !== 'number') {
    throw new Error(`Component "${componentName}" must have Y coordinate before evolve statement`);
  }

  // Add evolution arrow
  db.addTrend(nodeId, targetX, node.y);

  // Add evolved component at target position with 'evolved' className
  const evolvedNodeId = `${nodeId}_evolved`;
  db.addNode(
    evolvedNodeId,
    node.label,
    targetX,
    node.y,
    'evolved',
    undefined,
    undefined,
    false,
    undefined
  );

  return true;
}

function handleTrend(line: string): boolean {
  if (!line.includes('-.-')) {
    return false;
  }

  const parts = line.split('-.-');
  if (parts.length !== 2) {
    throw new Error(`Trend statement must use "-.-": ${line}`);
  }

  const node = parseNodeRef(parts[0].trim());
  const coords = parseCoordinates(parts[1].trim());
  db.addTrend(node.id, coords.x, coords.y);
  return true;
}

function handleLink(line: string): boolean {
  const arrowMatch = ARROW_REGEX.exec(line);
  if (!arrowMatch) {
    return false;
  }

  const source = parseNodeRef(arrowMatch[1].trim());
  const target = parseNodeRef(arrowMatch[3].trim());
  const token = arrowMatch[2];
  const annotation = arrowMatch[4]?.trim();

  // Determine if dashed
  const dashed = token.includes('.');

  // Parse flow type and label from token
  let flow: 'forward' | 'backward' | 'bidirectional' | undefined;
  let flowLabel: string | undefined;

  if (token.startsWith('+')) {
    // Extract label if present: +'label'
    const labelMatch = /^\+'([^']*)'/.exec(token);
    if (labelMatch) {
      flowLabel = labelMatch[1];
    }

    // Determine flow direction
    if (token.includes('<>')) {
      flow = 'bidirectional';
    } else if (token.includes('<')) {
      flow = 'backward';
    } else if (token.includes('>')) {
      flow = 'forward';
    }
  }

  // Use annotation as label if no flow label
  const label = flowLabel || annotation;

  addNodeIfCoords(source);
  addNodeIfCoords(target);
  db.addLink(source.id, target.id, dashed, label, flow);
  return true;
}

function handleNode(line: string): boolean {
  if (!line.includes('(') || !line.includes(')')) {
    return false;
  }

  const node = parseNodeRef(line);
  if (!node.hasCoords) {
    throw new Error(`Node definitions must include coordinates: ${line}`);
  }
  addNodeIfCoords(node, true);
  return true;
}

function addNodeIfCoords(node: NodeRef, required = false) {
  if (typeof node.x === 'number' && typeof node.y === 'number') {
    db.addNode(
      node.id,
      node.label,
      node.x,
      node.y,
      node.className,
      node.labelOffsetX,
      node.labelOffsetY,
      false,
      undefined
    );
  } else if (required) {
    throw new Error(`Node "${node.label}" is missing coordinates.`);
  }
}

function parseNodeRef(raw: string): NodeRef {
  const [namePart, className] = raw.split(':::');
  const trimmed = namePart.trim();
  if (!trimmed) {
    throw new Error('Node reference is empty.');
  }

  const coordMatch = NODE_COORD_REGEX.exec(trimmed);
  let label = trimmed;
  let x: number | undefined;
  let y: number | undefined;
  let hasCoords = false;

  if (coordMatch) {
    label = coordMatch[1].trim();
    x = parseCoordinateValue(coordMatch[2], 'x');
    y = parseCoordinateValue(coordMatch[3], 'y');
    hasCoords = true;
  }

  const id = slugify(label);
  return {
    id,
    label,
    className: className?.trim() || undefined,
    x,
    y,
    hasCoords,
  };
}

function parseCoordinates(raw: string) {
  const match = COORDINATE_PAIR_REGEX.exec(raw);
  if (!match) {
    throw new Error(`Invalid coordinate pair: ${raw}`);
  }

  return {
    x: parseCoordinateValue(match[1], 'x'),
    y: parseCoordinateValue(match[2], 'y'),
  };
}

function parseOWMCoordinates(raw: string) {
  // OWM format uses [visibility, evolution] which maps to (y, x) in our system
  const parts = raw.split(',').map((s) => s.trim());
  if (parts.length !== 2) {
    throw new Error(`Invalid OWM coordinate pair: ${raw}`);
  }

  const visibility = Number.parseFloat(parts[0]);
  const evolution = Number.parseFloat(parts[1]);

  if (Number.isNaN(visibility) || Number.isNaN(evolution)) {
    throw new Error(`Invalid OWM coordinates: ${raw}`);
  }

  // Convert from 0-1 scale to 0-100 scale
  const visibilityPercent = visibility <= 1.0 ? visibility * 100 : visibility;
  const evolutionPercent = evolution <= 1.0 ? evolution * 100 : evolution;

  if (
    visibilityPercent < 0 ||
    visibilityPercent > 100 ||
    evolutionPercent < 0 ||
    evolutionPercent > 100
  ) {
    throw new Error(`OWM coordinates must be between 0 and 1: ${raw}`);
  }

  // Return as (x, y) where x=evolution, y=visibility
  return { x: evolutionPercent, y: visibilityPercent };
}

function parseCoordinateValue(value: string, axis: 'x' | 'y') {
  const num = Number.parseFloat(value);
  if (Number.isNaN(num)) {
    throw new Error(`Invalid ${axis}-axis coordinate: ${value}`);
  }
  if (num < 0 || num > 100) {
    throw new Error(`${axis.toUpperCase()} coordinate must be between 0 and 100.`);
  }
  return num;
}

function parseStages(value: string): { stages: string[]; boundaries: number[] } {
  const parts = value
    .split(/->/)
    .map((stage) => stage.trim())
    .filter(Boolean);

  const stages: string[] = [];
  const boundaries: number[] = [];

  parts.forEach((part) => {
    // Check for @boundary notation (e.g., "Genesis@0.3")
    const match = /^(.+?)@([\d.]+)$/.exec(part);
    if (match) {
      const stageName = match[1].trim();
      const boundary = Number.parseFloat(match[2]);

      if (Number.isNaN(boundary) || boundary < 0 || boundary > 1) {
        throw new Error(`Stage boundary must be between 0 and 1: ${part}`);
      }

      stages.push(stageName);
      boundaries.push(boundary);
    } else {
      // No boundary specified, just stage name
      stages.push(part);
    }
  });

  // Validate boundaries if any were specified
  if (boundaries.length > 0) {
    if (boundaries.length !== stages.length) {
      throw new Error(
        'Either all stages must have boundaries or none. Mixed format not supported.'
      );
    }

    // Ensure boundaries are in ascending order
    for (let i = 1; i < boundaries.length; i++) {
      if (boundaries[i] <= boundaries[i - 1]) {
        throw new Error('Stage boundaries must be in ascending order');
      }
    }

    // Last boundary should be 1.0
    if (boundaries[boundaries.length - 1] !== 1.0) {
      throw new Error('Last stage boundary must be 1.0');
    }
  }

  return { stages, boundaries };
}

function parseLabelOffset(raw: string | undefined): { offsetX?: number; offsetY?: number } {
  if (!raw) {
    return {};
  }

  const match = LABEL_OFFSET_REGEX.exec(raw.trim());
  if (!match) {
    return {};
  }

  const offsetX = Number.parseFloat(match[1]);
  const offsetY = Number.parseFloat(match[2]);

  if (Number.isNaN(offsetX) || Number.isNaN(offsetY)) {
    return {};
  }

  return { offsetX, offsetY };
}

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^\da-z]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_');
}

export default parser;
