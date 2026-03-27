import type { Wardley } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import type { WardleyDB, ComponentType, AcceleratorType, AreaType } from './types.js';
import { db } from './wardleyDb.js';

const populateDb = (ast: Wardley, db: WardleyDB) => {
  populateCommonDb(ast, db);

  // Standard components
  for (const c of ast.components ?? []) {
    if (!c?.id || !c?.label || !c?.coords) {
      continue;
    }
    db.addComponent(c.id, c.label, c.coords.x, c.coords.y, {
      type: (c.componentType as ComponentType) ?? 'standard',
      inertia: c.inertia ?? false,
      sourcing: c.sourcing,
      labelOffset: c.labelOffset ? { dx: c.labelOffset.dx, dy: c.labelOffset.dy } : undefined,
    });
  }

  // Anchor components
  for (const a of ast.anchors ?? []) {
    if (!a?.id || !a?.label || !a?.coords) {
      continue;
    }
    db.addComponent(a.id, a.label, a.coords.x, a.coords.y, { type: 'anchor' });
  }

  // Dependency edges
  for (const e of ast.edges ?? []) {
    if (!e?.source || !e?.target) {
      continue;
    }
    db.addEdge(e.source, e.target, 'dependency', e.annotation);
  }

  // Flow edges
  for (const e of ast.flowEdges ?? []) {
    if (!e?.source || !e?.target) {
      continue;
    }
    db.addEdge(e.source, e.target, 'flow', e.annotation);
  }

  // Constraint edges
  for (const e of ast.constraintEdges ?? []) {
    if (!e?.source || !e?.target) {
      continue;
    }
    db.addEdge(e.source, e.target, 'constraint');
  }

  // Evolutions
  for (const ev of ast.evolves ?? []) {
    if (!ev?.id || typeof ev.value !== 'number') {
      continue;
    }
    db.addEvolution(ev.id, ev.value, ev.targetLabel);
  }

  // Pipelines
  for (const p of ast.pipelines ?? []) {
    if (!p?.id || !p?.label || !p?.pipelineCoords) {
      continue;
    }
    const coords = p.pipelineCoords;
    const children = (p.children ?? [])
      .filter((ch) => ch?.id && ch?.label && typeof ch?.x === 'number')
      .map((ch) => ({
        id: ch.id,
        label: ch.label,
        x: ch.x,
      }));
    db.addPipeline(
      p.id,
      p.label,
      (coords.startX + coords.endX) / 2,
      coords.y,
      coords.startX,
      coords.endX,
      children
    );
  }

  // Notes
  for (const n of ast.notes ?? []) {
    if (!n?.text || !n?.coords) {
      continue;
    }
    db.addNote(n.text, n.coords.x, n.coords.y);
  }

  // Annotations
  for (const a of ast.annotations ?? []) {
    if (!a?.text || !a?.target) {
      continue;
    }
    db.addAnnotation(a.number, a.text, a.target);
  }

  // Areas
  for (const a of ast.areas ?? []) {
    if (!a?.areaType) {
      continue;
    }
    db.addArea(a.label ?? '', a.areaType as AreaType, a.x1, a.y1, a.x2, a.y2);
  }

  // Submaps
  for (const s of ast.submaps ?? []) {
    if (!s?.id || !s?.label || !s?.coords) {
      continue;
    }
    db.addSubmap(s.id, s.label, s.coords.x, s.coords.y, s.ref);
  }

  // Accelerators
  for (const a of ast.accelerators ?? []) {
    if (!a?.target || !a?.accelType) {
      continue;
    }
    db.addAccelerator(a.target, a.accelType as AcceleratorType);
  }

  // Custom axis labels
  if (ast.xAxis?.labels?.length) {
    db.setXAxisLabels(ast.xAxis.labels);
  }
  if (ast.yAxis?.labels?.length) {
    db.setYAxisLabels(ast.yAxis.labels);
  }
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: Wardley map definition must be a non-empty string');
    }

    const ast: Wardley = await parse('wardley', input);
    log.debug('Wardley AST:', ast);
    populateDb(ast, db);
  },
};
