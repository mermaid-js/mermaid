import type { Wardley } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import type { WardleyDB } from './wardleyTypes.js';

const populateDb = (ast: Wardley, db: WardleyDB) => {
  populateCommonDb(ast, db);

  // Set size if provided
  if (ast.size) {
    db.setSize(ast.size.width, ast.size.height);
  }

  // Process evolution stages
  if (ast.evolution) {
    const stages = ast.evolution.stages.map((stage) => stage.name);
    const stageBoundaries = ast.evolution.stages
      .filter((stage) => stage.boundary !== undefined)
      .map((stage) => stage.boundary!);

    db.updateAxes({ stages, stageBoundaries });
  }

  // Add anchors as nodes with className 'anchor'
  ast.anchors.forEach((anchor) => {
    db.addNode(anchor.name, anchor.name, anchor.evolution, anchor.visibility, 'anchor');
  });

  // Add components
  ast.components.forEach((component) => {
    const labelOffsetX = component.label?.offsetX;
    const labelOffsetY = component.label?.offsetY;
    const sourceStrategy = component.decorator?.strategy as
      | 'build'
      | 'buy'
      | 'outsource'
      | 'market'
      | undefined;

    db.addNode(
      component.name,
      component.name,
      component.evolution,
      component.visibility,
      'component',
      labelOffsetX,
      labelOffsetY,
      component.inertia,
      sourceStrategy
    );
  });

  // Add areas
  ast.areas.forEach((area) => {
    db.addArea(area.name, area.evolution, area.visibility);
  });

  // Add notes
  ast.notes.forEach((note) => {
    db.addNote(note.text, note.evolution, note.visibility);
  });

  // Process pipelines
  ast.pipelines.forEach((pipeline) => {
    db.startPipeline(pipeline.parent);
    pipeline.components.forEach((component) => {
      // Create a synthetic ID for pipeline components
      const componentId = `${pipeline.parent}_${component.name}`;
      const labelOffsetX = component.label?.offsetX;
      const labelOffsetY = component.label?.offsetY;

      // Add pipeline component node (it will be associated with the parent)
      db.addNode(
        componentId,
        component.name,
        component.evolution,
        0, // Pipeline components don't have visibility, they use parent's
        'pipeline-component',
        labelOffsetX,
        labelOffsetY
      );
      db.addPipelineComponent(pipeline.parent, componentId);
    });
  });

  // Add links
  ast.links.forEach((link) => {
    // Determine dashed style and flow from arrow type
    const isDashed = link.arrow.includes('-.->') || link.arrow.includes('.-.');
    let flow: 'forward' | 'backward' | 'bidirectional' | undefined;

    if (link.fromPort === '+<>' || link.toPort === '+<>') {
      flow = 'bidirectional';
    } else if (link.fromPort === '+<' || link.toPort === '+<') {
      flow = 'backward';
    } else if (link.fromPort === '+>' || link.toPort === '+>') {
      flow = 'forward';
    }

    db.addLink(link.from, link.to, isDashed, link.linkLabel, flow);
  });

  // Add evolves (trends)
  ast.evolves.forEach((evolve) => {
    // Get the component to find its current position
    const node = db.getNode(evolve.component);
    if (node?.y !== undefined) {
      db.addTrend(evolve.component, evolve.target, node.y);
    }
  });

  // Set annotations box
  if (ast.annotations.length > 0) {
    const annotationsBox = ast.annotations[0];
    db.setAnnotationsBox(annotationsBox.x, annotationsBox.y);
  }

  // Add individual annotations
  ast.annotation.forEach((annotation) => {
    db.addAnnotation(annotation.number, [{ x: annotation.x, y: annotation.y }], annotation.text);
  });

  // Add accelerators
  ast.accelerators.forEach((accelerator) => {
    db.addAccelerator(accelerator.name, accelerator.x, accelerator.y);
  });

  // Add deaccelerators
  ast.deaccelerators.forEach((deaccelerator) => {
    db.addDeaccelerator(deaccelerator.name, deaccelerator.x, deaccelerator.y);
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
