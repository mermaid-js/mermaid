import type { Wardley } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import type { WardleyDB } from './wardleyTypes.js';

const toPercent = (value: number, context: string): number => {
  // Accept values in 0-1 range (converted to percentage) or 0-100 range (used as-is)
  const normalized = value <= 1 ? value * 100 : value;
  if (normalized < 0 || normalized > 100) {
    throw new Error(
      `${context} must be between 0-1 (decimal) or 0-100 (percentage). Received: ${value}`
    );
  }
  return normalized;
};

const toCoordinates = (
  visibility: number,
  evolution: number,
  context: string
): { x: number; y: number } => {
  return {
    x: toPercent(evolution, `${context} evolution`),
    y: toPercent(visibility, `${context} visibility`),
  };
};

const getFlowFromPort = (port?: string): 'forward' | 'backward' | 'bidirectional' | undefined => {
  if (!port) {
    return undefined;
  }
  if (port === '+<>') {
    return 'bidirectional';
  }
  if (port === '+<') {
    return 'backward';
  }
  if (port === '+>') {
    return 'forward';
  }
  return undefined;
};

const extractFlowFromArrow = (
  arrow?: string
): { flow?: 'forward' | 'backward' | 'bidirectional'; label?: string } => {
  if (!arrow?.startsWith('+')) {
    return {};
  }

  const labelMatch = /^\+'([^']*)'/.exec(arrow);
  const flowLabel = labelMatch?.[1];

  if (arrow.includes('<>')) {
    return { flow: 'bidirectional', label: flowLabel };
  }
  if (arrow.includes('<')) {
    return { flow: 'backward', label: flowLabel };
  }
  if (arrow.includes('>')) {
    return { flow: 'forward', label: flowLabel };
  }
  return { label: flowLabel };
};

const populateDb = (ast: Wardley, db: WardleyDB) => {
  populateCommonDb(ast, db);

  // Set size if provided
  if (ast.size) {
    db.setSize(ast.size.width, ast.size.height);
  }

  // Process evolution stages
  if (ast.evolution) {
    const stages = ast.evolution.stages.map((stage) => {
      // Handle dual-label stages like "Genesis / Concept"
      if (stage.secondName) {
        return `${stage.name.trim()} / ${stage.secondName.trim()}`;
      }
      return stage.name.trim();
    });
    const stageBoundaries = ast.evolution.stages
      .filter((stage) => stage.boundary !== undefined)
      .map((stage) => stage.boundary!);

    db.updateAxes({ stages, stageBoundaries });
  }

  // Add anchors as nodes with className 'anchor'
  ast.anchors.forEach((anchor) => {
    const coords = toCoordinates(anchor.visibility, anchor.evolution, `Anchor "${anchor.name}"`);
    db.addNode(anchor.name, anchor.name, coords.x, coords.y, 'anchor');
  });

  // Add components
  ast.components.forEach((component) => {
    const coords = toCoordinates(
      component.visibility,
      component.evolution,
      `Component "${component.name}"`
    );
    const labelOffsetX = component.label
      ? (component.label.negX ? -1 : 1) * component.label.offsetX
      : undefined;
    const labelOffsetY = component.label
      ? (component.label.negY ? -1 : 1) * component.label.offsetY
      : undefined;
    const sourceStrategy = component.decorator?.strategy as
      | 'build'
      | 'buy'
      | 'outsource'
      | 'market'
      | undefined;

    db.addNode(
      component.name,
      component.name,
      coords.x,
      coords.y,
      'component',
      labelOffsetX,
      labelOffsetY,
      component.inertia,
      sourceStrategy
    );
  });

  // Add areas
  ast.areas.forEach((area) => {
    const coords = toCoordinates(area.visibility, area.evolution, `Area "${area.name}"`);
    db.addArea(area.name, coords.x, coords.y);
  });

  // Add notes
  ast.notes.forEach((note) => {
    const coords = toCoordinates(note.visibility, note.evolution, `Note "${note.text}"`);
    db.addNote(note.text, coords.x, coords.y);
  });

  // Process pipelines
  ast.pipelines.forEach((pipeline) => {
    const parentNode = db.getNode(pipeline.parent);
    if (!parentNode || typeof parentNode.y !== 'number') {
      throw new Error(
        `Pipeline "${pipeline.parent}" must reference an existing component with coordinates.`
      );
    }
    const parentY = parentNode.y; // Extract to ensure type narrowing

    db.startPipeline(pipeline.parent);
    pipeline.components.forEach((component) => {
      // Create a synthetic ID for pipeline components
      const componentId = `${pipeline.parent}_${component.name}`;
      const labelOffsetX = component.label
        ? (component.label.negX ? -1 : 1) * component.label.offsetX
        : undefined;
      const labelOffsetY = component.label
        ? (component.label.negY ? -1 : 1) * component.label.offsetY
        : undefined;
      const x = toPercent(component.evolution, `Pipeline component "${component.name}" evolution`);

      // Add pipeline component node (it will be associated with the parent)
      db.addNode(
        componentId,
        component.name,
        x,
        parentY,
        'pipeline-component',
        labelOffsetX,
        labelOffsetY
      );
      db.addPipelineComponent(pipeline.parent, componentId);
    });
  });

  // Add links
  ast.links.forEach((link) => {
    const isDashed = !!link.arrow && (link.arrow.includes('-.->') || link.arrow.includes('.-.'));

    let flow = getFlowFromPort(link.fromPort) ?? getFlowFromPort(link.toPort);
    const { flow: arrowFlow, label: flowLabel } = extractFlowFromArrow(link.arrow);
    if (!flow && arrowFlow) {
      flow = arrowFlow;
    }

    const annotation = link.linkLabel;
    const label = flowLabel ?? annotation;

    db.addLink(link.from, link.to, isDashed, label, flow);
  });

  // Add evolves (trends)
  ast.evolves.forEach((evolve) => {
    // Get the component to find its current position
    const node = db.getNode(evolve.component);
    if (node?.y !== undefined) {
      const target = toPercent(evolve.target, `Evolve target for "${evolve.component}"`);
      db.addTrend(evolve.component, target, node.y);
    }
  });

  // Set annotations box
  if (ast.annotations.length > 0) {
    const annotationsBox = ast.annotations[0];
    const coords = toCoordinates(annotationsBox.x, annotationsBox.y, 'Annotations box');
    db.setAnnotationsBox(coords.x, coords.y);
  }

  // Add individual annotations
  ast.annotation.forEach((annotation) => {
    const coords = toCoordinates(annotation.x, annotation.y, `Annotation ${annotation.number}`);
    db.addAnnotation(annotation.number, [{ x: coords.x, y: coords.y }], annotation.text);
  });

  // Add accelerators
  ast.accelerators.forEach((accelerator) => {
    const coords = toCoordinates(accelerator.x, accelerator.y, `Accelerator "${accelerator.name}"`);
    db.addAccelerator(accelerator.name, coords.x, coords.y);
  });

  // Add deaccelerators
  ast.deaccelerators.forEach((deaccelerator) => {
    const coords = toCoordinates(
      deaccelerator.x,
      deaccelerator.y,
      `Deaccelerator "${deaccelerator.name}"`
    );
    db.addDeaccelerator(deaccelerator.name, coords.x, coords.y);
  });
};

export const parser: ParserDefinition = {
  parser: {
    // @ts-expect-error - WardleyDB is not assignable to DiagramDB
    yy: undefined,
  },
  parse: async (input: string): Promise<void> => {
    const ast: Wardley = await parse('wardley', input);
    log.debug(ast);
    const db = parser.parser?.yy as WardleyDB;
    if (!db || typeof db.addNode !== 'function') {
      throw new Error(
        'parser.parser?.yy was not a WardleyDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
      );
    }
    populateDb(ast, db);
  },
};
