import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.ts';
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

  it('should parse a node with shape data containing description, requires, source, params, and returns', function () {
    const res = agentflow.parser.parse(`agentflow
    research_location["Research"]@{
      description: "Research a city or location to gather useful local context for a business: culture, demographics, popular neighborhoods, local competitors, weather, and tips. Return a concise research brief."
      requires: ^net.read
      source: ^search.duckduckgo(query)
      params:
        query: String
      deny: ^llm.query
      returns: Report
    }`);

    const vert = agentflow.parser.yy.getVertices();
    const data = agentflow.parser.yy.getData();
    delete data.config;
    // console.log('JSON:', JSON.stringify(data, null, 2));

    expect(vert.get('research_location')).toBeDefined();
    expect(vert.get('research_location')?.text).toBe('Research');
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0].id).toBe('research_location');
    expect(data.nodes[0].label).toBe('Research');

    const metadata = data.nodes[0].metadata;
    expect(metadata).toBeDefined();
    expect(metadata?.description).toBe(
      'Research a city or location to gather useful local context for a business: culture, demographics, popular neighborhoods, local competitors, weather, and tips. Return a concise research brief.'
    );
    expect(metadata?.requires).toBe('^net.read');
    expect(metadata?.source).toBe('^search.duckduckgo(query)');
    expect(metadata?.params).toEqual({ query: 'String' });
    expect(metadata?.deny).toEqual('^llm.query');
    expect(metadata?.returns).toBe('Report');
  });

  it('should parse a node with shape data containing a subgraph', function () {
    const res = agentflow.parser.parse(`agentflow
    research_location["Research"]@{
      description: "Research a city or location to gather useful local context for a business: culture, demographics, popular neighborhoods, local competitors, weather, and tips. Return a concise research brief."
      requires: ^net.read
      source: ^search.duckduckgo(query)
      params:
        query: String
      deny: ^llm.query
      returns: Report
    }

    subgraph researcher
    	research_location --> write_copy
    end

    `);

    const data = agentflow.parser.yy.getData();

    expect(data.nodes.length).toBe(3);

    // Subgraph node comes first
    expect(data.nodes[0].id).toBe('researcher');
    expect(data.nodes[0].isGroup).toBe(true);

    // research_location is inside the subgraph
    const researchNode = data.nodes[1];
    expect(researchNode.id).toBe('research_location');
    expect(researchNode.label).toBe('Research');
    expect(researchNode.parentId).toBe('researcher');
    expect(researchNode.metadata?.description).toBe(
      'Research a city or location to gather useful local context for a business: culture, demographics, popular neighborhoods, local competitors, weather, and tips. Return a concise research brief.'
    );
    expect(researchNode.metadata?.requires).toBe('^net.read');
    expect(researchNode.metadata?.source).toBe('^search.duckduckgo(query)');
    expect(researchNode.metadata?.params).toEqual({ query: 'String' });
    expect(researchNode.metadata?.deny).toEqual('^llm.query');
    expect(researchNode.metadata?.returns).toBe('Report');

    // write_copy is also inside the subgraph
    expect(data.nodes[2].id).toBe('write_copy');
    expect(data.nodes[2].parentId).toBe('researcher');

    // Edge connects research_location to write_copy
    expect(data.edges.length).toBe(1);
    expect(data.edges[0].start).toBe('research_location');
    expect(data.edges[0].end).toBe('write_copy');
  });

  it('should parse a full bilingual website builder flow with tools and agents', function () {
    agentflow.parser.parse(`agentflow
    research_location["Research"]@{
      description: "Research a city or location to gather useful local context for a business."
      requires: ^net.read
      source: ^search.duckduckgo(query)
      params:
        query: String
      returns: String
    }

    write_copy["Write Copy"]@{
      description: "Write the actual marketing copy for a coffee shop website."
      requires: ^llm.query
      params:
        brief: String
      returns: String
    }

    translate_to_swedish["Translate to Swedish"]@{
      description: "Translate English marketing copy to Swedish. Output both versions."
      requires: ^llm.query
      params:
        english_copy: String
      returns: String
    }

    generate_html["Generate HTML"]@{
      description: "Generate a complete one-page bilingual HTML website with inline CSS and JS."
      requires: ^llm.query
      params:
        content: String
      returns: String
    }

    subgraph researcher
      research_location --> write_copy
    end

    subgraph translator
      translate_to_swedish
    end

    subgraph designer
      generate_html
    end

    write_copy --> translate_to_swedish
    translate_to_swedish --> generate_html
    `);

    const data = agentflow.parser.yy.getData();
    // delete data.config;
    // console.log('JSON:', JSON.stringify(data, null, 2));
    // 3 agent subgraphs + 4 tool nodes = 7 nodes
    expect(data.nodes.length).toBe(7);

    // Agent subgraphs
    const researcher = data.nodes.find((n: { id: string }) => n.id === 'researcher');
    const translator = data.nodes.find((n: { id: string }) => n.id === 'translator');
    const designerNode = data.nodes.find((n: { id: string }) => n.id === 'designer');
    expect(researcher?.isGroup).toBe(true);
    expect(translator?.isGroup).toBe(true);
    expect(designerNode?.isGroup).toBe(true);

    // Tool nodes with metadata
    const research = data.nodes.find((n: { id: string }) => n.id === 'research_location');
    expect(research?.label).toBe('Research');
    expect(research?.parentId).toBe('researcher');
    expect(research?.metadata?.requires).toBe('^net.read');
    expect(research?.metadata?.source).toBe('^search.duckduckgo(query)');
    expect(research?.metadata?.params).toEqual({ query: 'String' });
    expect(research?.metadata?.returns).toBe('String');

    const write = data.nodes.find((n: { id: string }) => n.id === 'write_copy');
    expect(write?.label).toBe('Write Copy');
    expect(write?.parentId).toBe('researcher');
    expect(write?.metadata?.requires).toBe('^llm.query');

    const translate = data.nodes.find((n: { id: string }) => n.id === 'translate_to_swedish');
    expect(translate?.label).toBe('Translate to Swedish');
    expect(translate?.parentId).toBe('translator');
    expect(translate?.metadata?.requires).toBe('^llm.query');

    const generate = data.nodes.find((n: { id: string }) => n.id === 'generate_html');
    expect(generate?.label).toBe('Generate HTML');
    expect(generate?.parentId).toBe('designer');
    expect(generate?.metadata?.requires).toBe('^llm.query');

    // Flow edges: research -> write -> translate -> generate
    expect(data.edges.length).toBe(3);
    expect(data.edges[0].start).toBe('research_location');
    expect(data.edges[0].end).toBe('write_copy');
    expect(data.edges[1].start).toBe('write_copy');
    expect(data.edges[1].end).toBe('translate_to_swedish');
    expect(data.edges[2].start).toBe('translate_to_swedish');
    expect(data.edges[2].end).toBe('generate_html');
  });

  it('should parse top-level type declarations and preserve them in layout data', function () {
    agentflow.parser.parse(`agentflow
    type Report
    type UserId = String
    type Author = Record {
      id: UserId
      tags: List<String>
      summary: String?
      metadata: Map<String, String>
    }

    write_copy["Write Copy"]@{
      type: Author
      inferred: List<Author>
    }
    `);

    const data = agentflow.parser.yy.getData();
    const writeCopy = data.nodes.find((n: { id: string }) => n.id === 'write_copy');

    expect(data.types).toEqual([
      {
        name: 'Report',
        kind: 'opaque',
      },
      {
        name: 'UserId',
        kind: 'alias',
        expression: 'String',
      },
      {
        name: 'Author',
        kind: 'record',
        fields: [
          { name: 'id', type: 'UserId' },
          { name: 'tags', type: 'List<String>' },
          { name: 'summary', type: 'String?' },
          { name: 'metadata', type: 'Map<String, String>' },
        ],
      },
    ]);
    expect(writeCopy?.metadata?.type).toBe('Author');
    expect(writeCopy?.metadata?.inferred).toBe('List<Author>');
  });

  it('should expose type declarations by name so node return types can be resolved from getData', function () {
    agentflow.parser.parse(`agentflow
    type Report = Record {
      title: String
      description: String
      approved: Bool
    }

    research_location["Research"]@{
      returns: Report
    }
    `);

    const data = agentflow.parser.yy.getData();
    const research = data.nodes.find((n: { id: string }) => n.id === 'research_location');
    const returnTypeName = research?.metadata?.returns as string;

    expect(returnTypeName).toBe('Report');
    expect(data.typesByName).toEqual({
      Report: {
        name: 'Report',
        kind: 'record',
        fields: [
          { name: 'title', type: 'String' },
          { name: 'description', type: 'String' },
          { name: 'approved', type: 'Bool' },
        ],
      },
    });
    expect(data.typesByName[returnTypeName]).toEqual({
      name: 'Report',
      kind: 'record',
      fields: [
        { name: 'title', type: 'String' },
        { name: 'description', type: 'String' },
        { name: 'approved', type: 'Bool' },
      ],
    });
  });

  it('should parse aliases records collections maps and optional type declarations together', function () {
    agentflow.parser.parse(`agentflow
    type UserId = String

    type Author = Record {
      id: UserId
      name: String
    }

    type Report = Record {
      title: String
      author: Author
      tags: List<String>
      summary: String?
      metadata: Map<String, String>
    }

    type Reports = List<Report>
    type ReportById = Map<String, Report>
    type OptionalReport = Report?

    research_location["Research"]@{
      returns: Report
      inferred: Reports
      type: OptionalReport
    }
    `);

    const data = agentflow.parser.yy.getData();
    const research = data.nodes.find((n: { id: string }) => n.id === 'research_location');

    expect(data.types).toEqual([
      {
        name: 'UserId',
        kind: 'alias',
        expression: 'String',
      },
      {
        name: 'Author',
        kind: 'record',
        fields: [
          { name: 'id', type: 'UserId' },
          { name: 'name', type: 'String' },
        ],
      },
      {
        name: 'Report',
        kind: 'record',
        fields: [
          { name: 'title', type: 'String' },
          { name: 'author', type: 'Author' },
          { name: 'tags', type: 'List<String>' },
          { name: 'summary', type: 'String?' },
          { name: 'metadata', type: 'Map<String, String>' },
        ],
      },
      {
        name: 'Reports',
        kind: 'alias',
        expression: 'List<Report>',
      },
      {
        name: 'ReportById',
        kind: 'alias',
        expression: 'Map<String, Report>',
      },
      {
        name: 'OptionalReport',
        kind: 'alias',
        expression: 'Report?',
      },
    ]);

    expect(data.typesByName.Report).toEqual({
      name: 'Report',
      kind: 'record',
      fields: [
        { name: 'title', type: 'String' },
        { name: 'author', type: 'Author' },
        { name: 'tags', type: 'List<String>' },
        { name: 'summary', type: 'String?' },
        { name: 'metadata', type: 'Map<String, String>' },
      ],
    });
    expect(data.typesByName.Reports).toEqual({
      name: 'Reports',
      kind: 'alias',
      expression: 'List<Report>',
    });
    expect(data.typesByName.ReportById).toEqual({
      name: 'ReportById',
      kind: 'alias',
      expression: 'Map<String, Report>',
    });
    expect(data.typesByName.OptionalReport).toEqual({
      name: 'OptionalReport',
      kind: 'alias',
      expression: 'Report?',
    });

    expect(research?.metadata?.returns).toBe('Report');
    expect(research?.metadata?.inferred).toBe('Reports');
    expect(research?.metadata?.type).toBe('OptionalReport');
  });

  describe('task grouping', function () {
    it('should parse a task with a quoted label', function () {
      agentflow.parser.parse(`agentflow LR
        task write_copy_task["Write Copy"]
          A --> B
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('write_copy_task');
      expect(subGraphs[0].title).toBe('Write Copy');
      expect(subGraphs[0].type).toBe('task');
    });

    it('should parse a task without a label and produce empty title', function () {
      agentflow.parser.parse(`agentflow LR
        task myTask
          A
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('myTask');
      expect(subGraphs[0].title).toBe('');
      expect(subGraphs[0].type).toBe('task');

      // Layout data should have empty label
      const data = agentflow.parser.yy.getData();
      const taskNode = data.nodes.find((n: { id: string }) => n.id === 'myTask');
      expect(taskNode?.label).toBe('');
    });

    it('should parse an empty task', function () {
      agentflow.parser.parse(`agentflow LR
        task empty_task["Empty"]
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].nodes).toHaveLength(0);
      expect(subGraphs[0].type).toBe('task');
    });

    it('should produce taskGroup shape in layout data', function () {
      agentflow.parser.parse(`agentflow LR
        task t1["Task One"]
          A --> B
        end
      `);

      const data = agentflow.parser.yy.getData();
      const taskNode = data.nodes.find((n: { id: string }) => n.id === 't1');
      expect(taskNode).toBeDefined();
      expect(taskNode?.isGroup).toBe(true);
      expect(taskNode?.shape).toBe('taskGroup');
    });

    it('should produce rect shape for subgraph in layout data', function () {
      agentflow.parser.parse(`agentflow LR
        subgraph sg1["Sub One"]
          A --> B
        end
      `);

      const data = agentflow.parser.yy.getData();
      const sgNode = data.nodes.find((n: { id: string }) => n.id === 'sg1');
      expect(sgNode).toBeDefined();
      expect(sgNode?.isGroup).toBe(true);
      expect(sgNode?.shape).toBe('rect');
    });

    it('should support task-to-task edges', function () {
      agentflow.parser.parse(`agentflow LR
        task t1["Task 1"]
          A
        end
        task t2["Task 2"]
          B
        end
        t1 --> t2
      `);

      const data = agentflow.parser.yy.getData();
      const edges = data.edges;
      expect(
        edges.some((e: { start: string; end: string }) => e.start === 't1' && e.end === 't2')
      ).toBe(true);
    });

    it('should support cross-task inner-node edges (global IDs)', function () {
      agentflow.parser.parse(`agentflow LR
        task t1["T1"]
          A
        end
        task t2["T2"]
          B
        end
        A --> B
      `);

      const data = agentflow.parser.yy.getData();
      expect(
        data.edges.some((e: { start: string; end: string }) => e.start === 'A' && e.end === 'B')
      ).toBe(true);
    });

    it('should support nested tasks', function () {
      agentflow.parser.parse(`agentflow TB
        task outer["Outer"]
          task inner["Inner"]
            X
          end
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(2);
      expect(subGraphs.every((sg: { type?: string }) => sg.type === 'task')).toBe(true);

      const data = agentflow.parser.yy.getData();
      const innerNode = data.nodes.find((n: { id: string }) => n.id === 'inner');
      expect(innerNode?.parentId).toBe('outer');
    });

    it('should allow mixing task and subgraph', function () {
      agentflow.parser.parse(`agentflow LR
        subgraph agent["Agent"]
          task t1["Step 1"]
            A
          end
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(2);

      const taskSg = subGraphs.find((sg: { id: string }) => sg.id === 't1');
      const subSg = subGraphs.find((sg: { id: string }) => sg.id === 'agent');
      expect(taskSg?.type).toBe('task');
      expect(subSg?.type).toBe('subgraph');
    });

    it('should parse a complex diagram with tasks, shapes, and edges', function () {
      agentflow.parser.parse(`agentflow LR
        task t1["Step 1"]
            n3("write_copy")
            n7["website_copy"]
            A["Template Website copy"]
        end
        task t2
            E("generate_html")
            n9["scandinavian_design"]
            n19["Permissions"]
            n10["website_html"]
            n21["llmQuery"]
            n22["netRead"]
            n23["netWrite"]
        end
        n3 --- n7
        E o--o n9 & n19
        E --- n10
        n3 o--o A
        n19 --> n21 & n22
        n19 --x n23
        t1 --> t2
      `);

      const data = agentflow.parser.yy.getData();
      const subGraphs = agentflow.parser.yy.getSubGraphs();

      // Two tasks
      expect(subGraphs).toHaveLength(2);
      expect(subGraphs[0].type).toBe('task');
      expect(subGraphs[1].type).toBe('task');

      // Task t1 has label, t2 uses id as title
      const t1 = data.nodes.find((n: { id: string }) => n.id === 't1');
      const t2 = data.nodes.find((n: { id: string }) => n.id === 't2');
      expect(t1?.isGroup).toBe(true);
      expect(t1?.shape).toBe('taskGroup');
      expect(t1?.label).toBe('Step 1');
      expect(t2?.isGroup).toBe(true);
      expect(t2?.shape).toBe('taskGroup');
      expect(t2?.label).toBe('');

      // Inner nodes have correct parent
      const n3 = data.nodes.find((n: { id: string }) => n.id === 'n3');
      const e = data.nodes.find((n: { id: string }) => n.id === 'E');
      expect(n3?.parentId).toBe('t1');
      expect(e?.parentId).toBe('t2');

      // Task-to-task edge exists
      expect(
        data.edges.some(
          (edge: { start: string; end: string }) => edge.start === 't1' && edge.end === 't2'
        )
      ).toBe(true);
    });

    it('should parse a task with no id (auto-generated)', function () {
      agentflow.parser.parse(`agentflow LR
        task
          A
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toMatch(/^subGraph/);
      expect(subGraphs[0].type).toBe('task');
    });
  });
});
