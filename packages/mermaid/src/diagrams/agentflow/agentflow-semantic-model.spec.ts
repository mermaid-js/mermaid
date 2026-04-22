/**
 * getSemanticModel() tests — closes #12.
 *
 * Verifies the presentation-only contract from AGENTFLOW-SYNTAX.md §13:
 * styling, class membership, view/collapsed state, icons, images and
 * element-mapping positions MUST NOT influence the semantic export. The
 * semantic model is what downstream tooling consumes when it needs to
 * understand what the diagram *means* without being influenced by
 * rendering choices.
 */

import { AgentFlowDB } from './agentflowDb.js';
import { setConfig } from '../../config.js';
import agentflow from './parser/agentflowParser.js';

setConfig({
  securityLevel: 'strict',
});

const parse = (src: string) => {
  const db = new AgentFlowDB();
  agentflow.parser.yy = db;
  db.clear();
  db.setGen('gen-2');
  agentflow.parser.parse(src);
  return db;
};

describe('agentflow getSemanticModel()', () => {
  describe('DB surface', () => {
    it('exposes getSemanticModel()', () => {
      const db = parse(`agentflow TB
  a --> b`);
      expect(typeof db.getSemanticModel).toBe('function');
    });

    it('returns a model with vertices, edges, subGraphs, typeDeclarations, templateDeclarations, diagnostics', () => {
      const db = parse(`agentflow TB
  a --> b`);
      const model = db.getSemanticModel();
      expect(Array.isArray(model.vertices)).toBe(true);
      expect(Array.isArray(model.edges)).toBe(true);
      expect(Array.isArray(model.subGraphs)).toBe(true);
      expect(Array.isArray(model.typeDeclarations)).toBe(true);
      expect(Array.isArray(model.templateDeclarations)).toBe(true);
      expect(Array.isArray(model.diagnostics)).toBe(true);
    });
  });

  describe('styled-vs-unstyled equivalence', () => {
    it('produces identical models for styled and unstyled variants of the same diagram', () => {
      const unstyled = parse(`agentflow TB
  a --> b`);
      const styled = parse(`agentflow TB
  classDef highlight fill:#f9f,stroke:#333,stroke-width:2px
  a:::highlight --> b
  style a fill:#0f0
  linkStyle 0 stroke:red,stroke-width:3px`);
      expect(styled.getSemanticModel()).toEqual(unstyled.getSemanticModel());
    });
  });

  describe('collapsed-vs-expanded equivalence', () => {
    it('collapsed and expanded flow containers produce identical semantic models', () => {
      const expanded = parse(`agentflow TB
  flow pipeline["Pipeline"]
    a --> b
  end`);
      const collapsed = parse(`agentflow TB
  flow pipeline["Pipeline"]
    a --> b
  end
  pipeline@{ view: "collapsed" }`);
      expect(collapsed.getSemanticModel()).toEqual(expanded.getSemanticModel());
    });
  });

  describe('presentation fields stripped', () => {
    it('never includes styles, classes, icon, img, w, h, view on vertices', () => {
      const db = parse(`agentflow TB
  a["Alpha"]
  a@{ icon: "star", img: "http://example/a.png", w: 100, h: 50, view: "collapsed" }
  a:::highlight
  a --> b`);
      const model = db.getSemanticModel();
      const a = model.vertices.find((v) => v.id === 'a');
      expect(a).toBeDefined();
      const seen = new Set(Object.keys(a?.metadata ?? {}));
      expect(seen.has('icon')).toBe(false);
      expect(seen.has('img')).toBe(false);
      expect(seen.has('w')).toBe(false);
      expect(seen.has('h')).toBe(false);
      expect(seen.has('view')).toBe(false);
      // No classes / styles leak either.
      expect(seen.has('class')).toBe(false);
      expect(seen.has('style')).toBe(false);
    });

    it('does not expose element mappings, classes, or link styles on the root model', () => {
      const db = parse(`agentflow TB
  a --> b`);
      const model = db.getSemanticModel() as unknown as Record<string, unknown>;
      expect('elementMappings' in model).toBe(false);
      expect('classes' in model).toBe(false);
      expect('linkStyles' in model).toBe(false);
      expect('tooltips' in model).toBe(false);
    });
  });

  describe('semantic fields preserved', () => {
    it('keeps domain metadata on vertices (model, permits, requires, etc.)', () => {
      const db = parse(`agentflow TB
  agent researcher["Researcher"]
    a --> b
  end
  researcher@{ model: "claude-opus-4-6", permits: ["net.read", "llm.query"] }`);
      const model = db.getSemanticModel();
      const researcher = model.subGraphs.find((sg) => sg.id === 'researcher');
      expect(researcher).toBeDefined();
      expect(researcher?.metadata?.model).toBe('claude-opus-4-6');
      expect(researcher?.metadata?.permits).toEqual(['net.read', 'llm.query']);
      expect(researcher?.type).toBe('agent');
    });

    it('keeps type and template declarations verbatim', () => {
      const db = parse(`agentflow TB
  type Report = String
  template %triage { TITLE: String <<t>> }
  a --> b`);
      const model = db.getSemanticModel();
      const reportType = model.typeDeclarations.find((t) => t.name === 'Report');
      expect(reportType).toBeDefined();
      expect(reportType?.kind).toBe('alias');
      const triage = model.templateDeclarations.find((t) => t.name === 'triage');
      expect(triage).toBeDefined();
      expect(triage?.fields).toEqual([{ name: 'TITLE', type: 'String', description: 't' }]);
    });

    it('keeps edge type / stroke / label', () => {
      const db = parse(`agentflow TB
  a -- yes --> b
  a ==> c
  a -.-> d`);
      const model = db.getSemanticModel();
      const labelled = model.edges.find((e) => e.start === 'a' && e.end === 'b');
      expect(labelled?.label).toBe('yes');
      expect(model.edges.find((e) => e.end === 'c')?.stroke).toBe('thick');
      expect(model.edges.find((e) => e.end === 'd')?.stroke).toBe('dotted');
    });
  });

  describe('diagnostics flow through', () => {
    it('includes diagnostics emitted during the render pipeline', () => {
      // Exercise the SHAPE_UNSUPPORTED path from PR 2b via the existing
      // transformData migration. A structured diagnostic on the DB should
      // show up on the semantic export.
      const db = parse(`agentflow TB
  a --> b`);
      // Directly emit a SHAPE_UNSUPPORTED diagnostic as if transformData had
      // encountered an unknown shape. This is the simplest way to assert
      // the projection includes diagnostics without relying on post-parse
      // validators that land in later wave-1 PRs.
      db.emitWarning('SHAPE_UNSUPPORTED', 'shape "made-up" is not supported', {
        nodeId: 'a',
      });
      const model = db.getSemanticModel();
      expect(model.diagnostics).toHaveLength(1);
      expect(model.diagnostics[0].id).toBe('SHAPE_UNSUPPORTED');
      expect(model.diagnostics[0].nodeId).toBe('a');
      expect(model.diagnostics[0].position?.startLine).toBe(2);
    });
  });
});
