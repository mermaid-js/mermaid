/**
 * Agentflow parser smoke + integration tests (v0.8.1).
 *
 * The v0.8.0/v0.8.1 round removed most of the v0.7.0 surface area
 * (agent/task/skill/testCase/directive/group containers; type/template
 * declarations; instance shapes; capability metadata; the `==>`, `-.->`,
 * `--o`, `-->>`, `o--o`, `~~`, `---` edge operators). This file keeps the
 * parser-level coverage for the surface that survived:
 *
 *   - `flow` containers (only one container kind in v0.8.1).
 *   - The three edge operators: `-->`, `-.-`, `--x`.
 *   - Flat `@{ … }` metadata.
 *   - The `connector` keyword.
 *   - Shape aliases (task / tool / input / decision / refdoc / action).
 *   - Diamond inline `id{Label}` decisions.
 *   - The `&` fan-out operator.
 *   - View hint (`view: collapsed`) on flow containers.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('parsing an agentflow diagram', function () {
  beforeEach(function () {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  describe('smoke', function () {
    it('parses an empty diagram with just the keyword + newline', function () {
      agentflow.parser.parse(`agentflow TB
`);
      const data = agentflow.parser.yy.getData();
      expect(data.nodes).toHaveLength(0);
      expect(data.edges).toHaveLength(0);
    });

    it('parses two nodes and an edge', function () {
      agentflow.parser.parse(`agentflow TB
  a["Alpha"]
  b["Beta"]
  a --> b`);
      const data = agentflow.parser.yy.getData();
      expect(data.nodes).toHaveLength(2);
      expect(data.edges).toHaveLength(1);
      expect(data.edges[0].start).toBe('a');
      expect(data.edges[0].end).toBe('b');
    });

    it('captures node labels', function () {
      agentflow.parser.parse(`agentflow TB
  research["Research"]
  research --> write`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const v = db.getVertices().get('research');
      expect(v).toBeDefined();
      expect(v?.text).toBe('Research');
    });

    it('parses LR direction', function () {
      agentflow.parser.parse(`agentflow LR
  a --> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      expect(db.getDirection()).toBe('LR');
    });
  });

  describe('flow containers', function () {
    it('parses a flow with a quoted label', function () {
      agentflow.parser.parse(`agentflow TB
  flow pipeline["Pipeline"]
    a --> b
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const subs = db.getSubGraphs();
      expect(subs).toHaveLength(1);
      expect(subs[0].id).toBe('pipeline');
      expect(subs[0].title).toBe('Pipeline');
      expect(subs[0].type).toBe('flow');
    });

    it('parses a flow without a label', function () {
      agentflow.parser.parse(`agentflow TB
  flow pipeline
    a --> b
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const subs = db.getSubGraphs();
      expect(subs).toHaveLength(1);
      expect(subs[0].id).toBe('pipeline');
    });

    it('parses nested flows', function () {
      agentflow.parser.parse(`agentflow TB
  flow outer["Outer"]
    flow inner["Inner"]
      a --> b
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const subs = db.getSubGraphs();
      expect(subs.length).toBeGreaterThanOrEqual(2);
      const inner = subs.find((s) => s.id === 'inner');
      const outer = subs.find((s) => s.id === 'outer');
      expect(inner).toBeDefined();
      expect(outer).toBeDefined();
    });

    it('exposes flow as the container type in layout data', function () {
      agentflow.parser.parse(`agentflow TB
  flow pipeline["Pipeline"]
    a --> b
  end`);
      const data = agentflow.parser.yy.getData();
      const pipelineNode = data.nodes.find((n: { id: string }) => n.id === 'pipeline');
      expect(pipelineNode).toBeDefined();
      expect(pipelineNode?.isGroup).toBe(true);
    });
  });

  describe('edge types (v0.8.1)', function () {
    it('parses `-->` as arrow_point + sequence', function () {
      agentflow.parser.parse(`agentflow TB
  a --> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const edges = db.getEdges();
      expect(edges).toHaveLength(1);
      expect(edges[0].type).toBe('arrow_point');
      expect(edges[0].stroke).toBe('normal');
      expect(edges[0].edgeSemantic).toBe('sequence');
    });

    it('parses `--x` as arrow_cross + failure', function () {
      agentflow.parser.parse(`agentflow TB
  a --x b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const edges = db.getEdges();
      expect(edges).toHaveLength(1);
      expect(edges[0].type).toBe('arrow_cross');
      expect(edges[0].edgeSemantic).toBe('failure');
    });

    it('parses `-.-` as a dotted reference edge', function () {
      agentflow.parser.parse(`agentflow TB
  a -.- b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const edges = db.getEdges();
      expect(edges).toHaveLength(1);
      expect(edges[0].stroke).toBe('dotted');
      expect(edges[0].edgeSemantic).toBe('reference');
    });

    it('accepts labels on `-->`', function () {
      agentflow.parser.parse(`agentflow TB
  a -- yes --> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const edges = db.getEdges();
      expect(edges).toHaveLength(1);
      expect(edges[0].text).toBe('yes');
    });
  });

  describe('shape aliases (v0.8.1)', function () {
    it('accepts `shape: tool`', function () {
      agentflow.parser.parse(`agentflow TB
  s["Search"]
  s@{ shape: tool, returns: "Result" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const v = db.getVertices().get('s');
      expect(v).toBeDefined();
      expect(db.isToolDefinition(v!)).toBe(true);
    });

    it('accepts `shape: action`', function () {
      agentflow.parser.parse(`agentflow TB
  a["Action"]
  a@{ shape: action }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const model = db.getSemanticModel();
      const v = model.vertices.find((x) => x.id === 'a');
      expect(v?.vertexKind).toBe('action');
    });

    it('accepts `shape: input`', function () {
      agentflow.parser.parse(`agentflow TB
  i["x"]
  i@{ shape: input, value: "literal" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const model = db.getSemanticModel();
      const v = model.vertices.find((x) => x.id === 'i');
      expect(v?.vertexKind).toBe('input');
    });

    it('accepts `shape: refdoc`', function () {
      agentflow.parser.parse(`agentflow TB
  r["Guide"]
  r@{ shape: refdoc }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const model = db.getSemanticModel();
      const v = model.vertices.find((x) => x.id === 'r');
      expect(v?.vertexKind).toBe('refdoc');
    });

    it('accepts `shape: decision` and inline `id{…}` diamond syntax', function () {
      agentflow.parser.parse(`agentflow TB
  d{"is_valid?"}`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const model = db.getSemanticModel();
      const v = model.vertices.find((x) => x.id === 'd');
      expect(v?.vertexKind).toBe('decision');
    });
  });

  describe('connector keyword (v0.8.1)', function () {
    it('parses a connector declaration', function () {
      agentflow.parser.parse(`agentflow TB
  connector github["GitHub"]
  github@{ protocol: "mcp", transport: "stdio" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const connectors = db.getConnectors();
      expect(connectors).toHaveLength(1);
      expect(connectors[0].id).toBe('github');
      expect(connectors[0].metadata?.protocol).toBe('mcp');
    });

    it('multiple connectors are tracked separately', function () {
      agentflow.parser.parse(`agentflow TB
  connector github["GitHub"]
  connector slack["Slack"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const ids = db.getConnectors().map((c) => c.id).sort();
      expect(ids).toEqual(['github', 'slack']);
    });
  });

  describe('parallel fan-out (`&`)', function () {
    it('expands `a --> b & c` into two edges', function () {
      agentflow.parser.parse(`agentflow TB
  a --> b & c`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const edges = db.getEdges();
      expect(edges).toHaveLength(2);
      expect(edges.map((e) => e.end).sort()).toEqual(['b', 'c']);
    });
  });

  describe('metadata @{ … }', function () {
    it('parses flat metadata on a vertex', function () {
      agentflow.parser.parse(`agentflow TB
  a["Alpha"]
  a@{ description: "alpha node", instruction: "be careful" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const v = db.getVertices().get('a');
      expect(v?.metadata?.description).toBe('alpha node');
      expect(v?.metadata?.instruction).toBe('be careful');
    });

    it('merges multiple metadata statements on the same vertex', function () {
      agentflow.parser.parse(`agentflow TB
  a["A"]
  a@{ description: "first" }
  a@{ instruction: "second" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const v = db.getVertices().get('a');
      expect(v?.metadata?.description).toBe('first');
      expect(v?.metadata?.instruction).toBe('second');
    });

    it('parses metadata on a flow container', function () {
      agentflow.parser.parse(`agentflow TB
  flow pipeline["P"]
    a --> b
  end
  pipeline@{ model: "claude-opus-4-6", memory: "shared" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const sg = db.getSubGraphs().find((s) => s.id === 'pipeline');
      expect(sg?.metadata?.model).toBe('claude-opus-4-6');
      expect(sg?.metadata?.memory).toBe('shared');
    });
  });

  describe('view hint (collapsed / expanded)', function () {
    it('marks a subgraph as collapsed via @{ view: "collapsed" }', function () {
      agentflow.parser.parse(`agentflow TB
  flow pipeline["P"]
    a --> b
  end
  pipeline@{ view: "collapsed" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const sg = db.getSubGraphs().find((s) => s.id === 'pipeline');
      expect(sg?.metadata?.view).toBe('collapsed');
    });
  });
});
