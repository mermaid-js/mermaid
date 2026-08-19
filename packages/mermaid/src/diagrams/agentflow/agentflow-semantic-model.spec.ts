/**
 * getSemanticModel() tests (v0.8.1).
 *
 * Verifies the presentation-only contract from AGENTFLOW-SYNTAX.md §10:
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
      const db = parse(`agentflow-beta TB
  a --> b`);
      expect(typeof db.getSemanticModel).toBe('function');
    });

    it('returns a model with vertices, edges, subGraphs, connectors, diagnostics', () => {
      const db = parse(`agentflow-beta TB
  a --> b`);
      const model = db.getSemanticModel();
      expect(Array.isArray(model.vertices)).toBe(true);
      expect(Array.isArray(model.edges)).toBe(true);
      expect(Array.isArray(model.subGraphs)).toBe(true);
      expect(Array.isArray(model.connectors)).toBe(true);
      expect(Array.isArray(model.diagnostics)).toBe(true);
    });
  });

  describe('styled-vs-unstyled equivalence', () => {
    it('produces identical models for styled and unstyled variants of the same diagram', () => {
      const unstyled = parse(`agentflow-beta TB
  a --> b`);
      const styled = parse(`agentflow-beta TB
  classDef highlight fill:#f9f,stroke:#333,stroke-width:2px
  a:::highlight --> b
  style a fill:#0f0
  linkStyle 0 stroke:red,stroke-width:3px`);
      expect(styled.getSemanticModel()).toEqual(unstyled.getSemanticModel());
    });
  });

  describe('collapsed-vs-expanded equivalence', () => {
    it('view: collapsed does not leak into the vertex/edge/subgraph semantics', () => {
      const expanded = parse(`agentflow-beta TB
  flow pipeline["Pipeline"]
    a --> b
  end`);
      const collapsed = parse(`agentflow-beta TB
  flow pipeline["Pipeline"]
    a --> b
  end
  pipeline@{ view: "collapsed" }`);
      const e = expanded.getSemanticModel();
      const c = collapsed.getSemanticModel();
      // Strip diagnostics (which carry source positions that differ across
      // the two inputs) and compare the semantic surface.
      const stripDiag = (m: ReturnType<typeof expanded.getSemanticModel>) => ({
        vertices: m.vertices,
        edges: m.edges,
        subGraphs: m.subGraphs,
        connectors: m.connectors,
        direction: m.direction,
      });
      expect(stripDiag(c)).toEqual(stripDiag(e));
    });
  });

  describe('presentation fields stripped', () => {
    it('never includes styles, classes, icon, img, w, h, view on vertices', () => {
      const db = parse(`agentflow-beta TB
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
      expect(seen.has('class')).toBe(false);
      expect(seen.has('style')).toBe(false);
    });

    it('does not expose element mappings, classes, or link styles on the root model', () => {
      const db = parse(`agentflow-beta TB
  a --> b`);
      const model = db.getSemanticModel() as unknown as Record<string, unknown>;
      expect('elementMappings' in model).toBe(false);
      expect('classes' in model).toBe(false);
      expect('linkStyles' in model).toBe(false);
      expect('tooltips' in model).toBe(false);
    });
  });

  describe('semantic fields preserved', () => {
    it('keeps domain metadata on flow containers (model, memory)', () => {
      const db = parse(`agentflow-beta TB
  flow researcher["Researcher"]
    a --> b
  end
  researcher@{ model: "claude-opus-4-6", memory: "shared" }`);
      const model = db.getSemanticModel();
      const researcher = model.subGraphs.find((sg) => sg.id === 'researcher');
      expect(researcher).toBeDefined();
      expect(researcher?.metadata?.model).toBe('claude-opus-4-6');
      expect(researcher?.metadata?.memory).toBe('shared');
      expect(researcher?.type).toBe('flow');
    });

    it('surfaces declared connectors in the connectors projection', () => {
      const db = parse(`agentflow-beta TB
  connector github["GitHub"]
  github@{ protocol: "mcp", transport: "stdio" }
  connector slack["Slack"]
  slack@{ protocol: "http" }`);
      const model = db.getSemanticModel();
      const ids = model.connectors.map((c) => c.id).sort();
      expect(ids).toEqual(['github', 'slack']);
      const gh = model.connectors.find((c) => c.id === 'github');
      expect(gh?.metadata?.protocol).toBe('mcp');
      expect(gh?.metadata?.transport).toBe('stdio');
    });

    it('keeps `value` on input vertices', () => {
      const db = parse(`agentflow-beta TB
  file_path["file_path"]
  file_path@{ shape: input, value: "src/HelloWorld.java" }`);
      const model = db.getSemanticModel();
      const filePath = model.vertices.find((v) => v.id === 'file_path');
      expect(filePath?.metadata?.value).toBe('src/HelloWorld.java');
      expect(filePath?.vertexKind).toBe('input');
    });

    it('keeps edge type / stroke / label', () => {
      const db = parse(`agentflow-beta TB
  a -- yes --> b
  a --x c
  refdoc1["RefDoc"]
  refdoc1@{ shape: refdoc }
  a -.- refdoc1`);
      const model = db.getSemanticModel();
      const labelled = model.edges.find((e) => e.start === 'a' && e.end === 'b');
      expect(labelled?.label).toBe('yes');
      expect(model.edges.find((e) => e.end === 'c')?.edgeSemantic).toBe('failure');
      expect(model.edges.find((e) => e.end === 'refdoc1')?.stroke).toBe('dotted');
    });
  });

  describe('diagnostics flow through', () => {
    it('includes diagnostics emitted during the render pipeline', () => {
      const db = parse(`agentflow-beta TB
  a --> b`);
      db.emitWarning('SHAPE_UNSUPPORTED', 'shape "made-up" is not supported', {
        nodeId: 'a',
      });
      const model = db.getSemanticModel();
      expect(model.diagnostics.length).toBeGreaterThanOrEqual(1);
      const shapeDiag = model.diagnostics.find((d) => d.id === 'SHAPE_UNSUPPORTED');
      expect(shapeDiag).toBeDefined();
      expect(shapeDiag?.nodeId).toBe('a');
      expect(shapeDiag?.position?.startLine).toBe(2);
    });
  });
});
