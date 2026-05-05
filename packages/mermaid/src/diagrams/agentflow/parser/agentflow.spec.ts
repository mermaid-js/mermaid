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

  describe('agent grouping', function () {
    it('should parse an agent with a quoted label', function () {
      agentflow.parser.parse(`agentflow LR
        agent code_review["Code Review Agent"]
          A --> B
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('code_review');
      expect(subGraphs[0].title).toBe('Code Review Agent');
      expect(subGraphs[0].type).toBe('agent');
    });

    it('should parse an agent without a label', function () {
      agentflow.parser.parse(`agentflow LR
        agent myAgent
          A
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('myAgent');
      expect(subGraphs[0].title).toBe('');
      expect(subGraphs[0].type).toBe('agent');
    });

    it('should produce agentGroup shape in layout data', function () {
      agentflow.parser.parse(`agentflow LR
        agent a1["My Agent"]
          A --> B
        end
      `);

      const data = agentflow.parser.yy.getData();
      const agentNode = data.nodes.find((n: { id: string }) => n.id === 'a1');
      expect(agentNode).toBeDefined();
      expect(agentNode?.isGroup).toBe(true);
      expect(agentNode?.shape).toBe('agentGroup');
    });

    it('should parse an empty agent', function () {
      agentflow.parser.parse(`agentflow LR
        agent empty_agent["Empty"]
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].nodes).toHaveLength(0);
      expect(subGraphs[0].type).toBe('agent');
    });
  });

  describe('flow grouping', function () {
    it('should parse a flow with a quoted label', function () {
      agentflow.parser.parse(`agentflow LR
        flow review_pipeline["Review Pipeline"]
          A --> B
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('review_pipeline');
      expect(subGraphs[0].title).toBe('Review Pipeline');
      expect(subGraphs[0].type).toBe('flow');
    });

    it('should parse a flow without a label', function () {
      agentflow.parser.parse(`agentflow LR
        flow myFlow
          A
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('myFlow');
      expect(subGraphs[0].title).toBe('');
      expect(subGraphs[0].type).toBe('flow');
    });

    it('should produce flowGroup shape in layout data', function () {
      agentflow.parser.parse(`agentflow LR
        flow f1["My Flow"]
          A --> B
        end
      `);

      const data = agentflow.parser.yy.getData();
      const flowNode = data.nodes.find((n: { id: string }) => n.id === 'f1');
      expect(flowNode).toBeDefined();
      expect(flowNode?.isGroup).toBe(true);
      expect(flowNode?.shape).toBe('flowGroup');
    });
  });

  describe('nested agent > flow > task hierarchy', function () {
    it('should parse nested agent containing flow containing task', function () {
      agentflow.parser.parse(`agentflow LR
        agent my_agent["My Agent"]
          flow pipeline["Pipeline"]
            task step1["Step 1"]
              action1["Do thing"]
            end
            task step2["Step 2"]
              action2["Do other thing"]
            end
          end
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(4);

      const agentSg = subGraphs.find((sg: { id: string }) => sg.id === 'my_agent');
      const flowSg = subGraphs.find((sg: { id: string }) => sg.id === 'pipeline');
      const task1Sg = subGraphs.find((sg: { id: string }) => sg.id === 'step1');
      const task2Sg = subGraphs.find((sg: { id: string }) => sg.id === 'step2');

      expect(agentSg?.type).toBe('agent');
      expect(agentSg?.title).toBe('My Agent');
      expect(flowSg?.type).toBe('flow');
      expect(flowSg?.title).toBe('Pipeline');
      expect(task1Sg?.type).toBe('task');
      expect(task1Sg?.title).toBe('Step 1');
      expect(task2Sg?.type).toBe('task');
      expect(task2Sg?.title).toBe('Step 2');

      const data = agentflow.parser.yy.getData();

      // Agent should produce agentGroup shape
      const agentNode = data.nodes.find((n: { id: string }) => n.id === 'my_agent');
      expect(agentNode?.shape).toBe('agentGroup');

      // Flow should produce flowGroup shape
      const flowNode = data.nodes.find((n: { id: string }) => n.id === 'pipeline');
      expect(flowNode?.shape).toBe('flowGroup');

      // Tasks should produce taskGroup shape
      const taskNode1 = data.nodes.find((n: { id: string }) => n.id === 'step1');
      const taskNode2 = data.nodes.find((n: { id: string }) => n.id === 'step2');
      expect(taskNode1?.shape).toBe('taskGroup');
      expect(taskNode2?.shape).toBe('taskGroup');

      // Nesting: pipeline inside my_agent, steps inside pipeline
      expect(flowNode?.parentId).toBe('my_agent');
      expect(taskNode1?.parentId).toBe('pipeline');
      expect(taskNode2?.parentId).toBe('pipeline');
    });

    it('should parse the complete spec example', function () {
      agentflow.parser.parse(`agentflow LR
        agent code_review["Code Review Agent"]
          flow review_flow["Review Pipeline"]
            task extract["Extract Changes"]
              receive_pr("Receive PR")
              analysis_output["Code Analysis"]
              ExtractPerms["Permissions"]
              llmQuery_1["llmQuery"]
              receive_pr --- analysis_output
              ExtractPerms --> llmQuery_1
            end
            task assess["Assess Risk"]
              evaluate("Evaluate Findings")
              risk_output["Risk Assessment"]
              AssessPerms["Permissions"]
              llmQuery_2["llmQuery"]
              evaluate --- risk_output
              AssessPerms --> llmQuery_2
            end
            extract --> assess
          end
        end
      `);

      const data = agentflow.parser.yy.getData();

      // Should have: agent, flow, 2 tasks, and inner nodes
      const agentNode = data.nodes.find((n: { id: string }) => n.id === 'code_review');
      expect(agentNode?.shape).toBe('agentGroup');
      expect(agentNode?.label).toBe('Code Review Agent');

      const flowNode = data.nodes.find((n: { id: string }) => n.id === 'review_flow');
      expect(flowNode?.shape).toBe('flowGroup');
      expect(flowNode?.label).toBe('Review Pipeline');

      const extractNode = data.nodes.find((n: { id: string }) => n.id === 'extract');
      expect(extractNode?.shape).toBe('taskGroup');

      const assessNode = data.nodes.find((n: { id: string }) => n.id === 'assess');
      expect(assessNode?.shape).toBe('taskGroup');

      // Inner nodes
      const receivePr = data.nodes.find((n: { id: string }) => n.id === 'receive_pr');
      expect(receivePr?.parentId).toBe('extract');

      // Task-to-task edge
      expect(
        data.edges.some(
          (e: { start: string; end: string }) => e.start === 'extract' && e.end === 'assess'
        )
      ).toBe(true);
    });
  });

  describe('node shapes via metadata', function () {
    it('should allow doc shape via @{} metadata', function () {
      agentflow.parser.parse(`agentflow LR
        task t1["Task"]
          output["Result"]
        end
        output@{ shape: doc, schema: "{ findings: Finding[] }" }
      `);

      const data = agentflow.parser.yy.getData();
      const outputNode = data.nodes.find((n: { id: string }) => n.id === 'output');
      expect(outputNode).toBeDefined();
      expect(outputNode?.shape).toBe('doc');
    });

    it('should allow hex shape for permissions', function () {
      agentflow.parser.parse(`agentflow LR
        task t1["Task"]
          perms["Permissions"]
        end
        perms@{ shape: hex }
      `);

      const data = agentflow.parser.yy.getData();
      const permsNode = data.nodes.find((n: { id: string }) => n.id === 'perms');
      expect(permsNode).toBeDefined();
      expect(permsNode?.shape).toBe('hex');
    });

    it('should allow terminal shape for permission items', function () {
      agentflow.parser.parse(`agentflow LR
        task t1["Task"]
          llmQuery["llmQuery"]
        end
        llmQuery@{ shape: terminal }
      `);

      const data = agentflow.parser.yy.getData();
      const llmNode = data.nodes.find((n: { id: string }) => n.id === 'llmQuery');
      expect(llmNode).toBeDefined();
      // terminal maps to stadium in Mermaid shapes
      expect(llmNode?.shape).toBe('terminal');
    });
  });

  describe('edge types', function () {
    it('should parse --> as arrow_point', function () {
      agentflow.parser.parse(`agentflow LR
        A --> B
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.edges).toHaveLength(1);
      expect(data.edges[0].arrowTypeEnd).toBe('arrow_point');
      expect(data.edges[0].arrowTypeStart).toBe('none');
    });

    it('should parse --o as arrow_circle', function () {
      agentflow.parser.parse(`agentflow LR
        A --o B
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.edges).toHaveLength(1);
      expect(data.edges[0].arrowTypeEnd).toBe('arrow_circle');
      expect(data.edges[0].arrowTypeStart).toBe('none');
    });

    it('should parse --- as arrow_open (no arrowheads)', function () {
      agentflow.parser.parse(`agentflow LR
        A --- B
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.edges).toHaveLength(1);
      expect(data.edges[0].arrowTypeEnd).toBe('none');
      expect(data.edges[0].arrowTypeStart).toBe('none');
    });

    it('should parse -->> as arrow_hierarchy', function () {
      agentflow.parser.parse(`agentflow LR
        A -->> B
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.edges).toHaveLength(1);
      expect(data.edges[0].arrowTypeEnd).toBe('arrow_hierarchy');
      expect(data.edges[0].arrowTypeStart).toBe('none');
    });

    it('should parse --x as arrow_cross', function () {
      agentflow.parser.parse(`agentflow LR
        A --x B
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.edges).toHaveLength(1);
      expect(data.edges[0].arrowTypeEnd).toBe('arrow_cross');
      expect(data.edges[0].arrowTypeStart).toBe('none');
    });

    it('should parse o--o as double_arrow_circle', function () {
      agentflow.parser.parse(`agentflow LR
        A o--o B
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.edges).toHaveLength(1);
      expect(data.edges[0].arrowTypeEnd).toBe('arrow_circle');
      expect(data.edges[0].arrowTypeStart).toBe('arrow_circle');
    });

    it('should parse all four edge types in one diagram', function () {
      agentflow.parser.parse(`agentflow TB
        A --> B
        B --o C
        C --- D
        D -->> E
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.edges).toHaveLength(4);

      // --> data flow
      expect(data.edges[0].arrowTypeEnd).toBe('arrow_point');
      // --o uses
      expect(data.edges[1].arrowTypeEnd).toBe('arrow_circle');
      // --- governs
      expect(data.edges[2].arrowTypeEnd).toBe('none');
      // -->> hierarchy
      expect(data.edges[3].arrowTypeEnd).toBe('arrow_hierarchy');
    });
  });

  describe('4-level nesting (agent > flow > agent > task)', function () {
    it('should parse 4-level nesting as in v7 spec', function () {
      agentflow.parser.parse(`agentflow TB
        agent outer_agent["Outer Agent"]
          flow build_site["Build Site"]
            agent inner_agent["Inner Agent"]
              task step1["Step 1"]
                action1["Do thing"]
              end
            end
          end
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(4);

      const outerAgent = subGraphs.find((sg: { id: string }) => sg.id === 'outer_agent');
      const flow = subGraphs.find((sg: { id: string }) => sg.id === 'build_site');
      const innerAgent = subGraphs.find((sg: { id: string }) => sg.id === 'inner_agent');
      const task = subGraphs.find((sg: { id: string }) => sg.id === 'step1');

      expect(outerAgent?.type).toBe('agent');
      expect(flow?.type).toBe('flow');
      expect(innerAgent?.type).toBe('agent');
      expect(task?.type).toBe('task');

      const data = agentflow.parser.yy.getData();
      const outerNode = data.nodes.find((n: { id: string }) => n.id === 'outer_agent');
      const flowNode = data.nodes.find((n: { id: string }) => n.id === 'build_site');
      const innerNode = data.nodes.find((n: { id: string }) => n.id === 'inner_agent');
      const taskNode = data.nodes.find((n: { id: string }) => n.id === 'step1');
      const actionNode = data.nodes.find((n: { id: string }) => n.id === 'action1');

      expect(outerNode?.shape).toBe('agentGroup');
      expect(flowNode?.shape).toBe('flowGroup');
      expect(flowNode?.parentId).toBe('outer_agent');
      expect(innerNode?.shape).toBe('agentGroup');
      expect(innerNode?.parentId).toBe('build_site');
      expect(taskNode?.shape).toBe('taskGroup');
      expect(taskNode?.parentId).toBe('inner_agent');
      expect(actionNode?.parentId).toBe('step1');
    });
  });

  describe('permit-tree diagram', function () {
    it('should parse the permit-tree.mmd with -->> hierarchy edges', function () {
      agentflow.parser.parse(`agentflow TB
        llm["llm"]
        llm_query["llm.query"]
        net["net"]
        net_read["net.read"]
        llm -->> llm_query
        net -->> net_read

        llm@{ shape: hex }
        llm_query@{ shape: terminal }
        net@{ shape: hex }
        net_read@{ shape: terminal }
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.nodes).toHaveLength(4);
      expect(data.edges).toHaveLength(2);

      // Both edges should be hierarchy edges
      expect(data.edges[0].arrowTypeEnd).toBe('arrow_hierarchy');
      expect(data.edges[1].arrowTypeEnd).toBe('arrow_hierarchy');

      // Shapes
      const llm = data.nodes.find((n: { id: string }) => n.id === 'llm');
      const llmQuery = data.nodes.find((n: { id: string }) => n.id === 'llm_query');
      expect(llm?.shape).toBe('hex');
      expect(llmQuery?.shape).toBe('terminal');
    });
  });

  describe('v7 Coffee Website Builder integration', function () {
    it('should parse the full v7 diagram with all features', function () {
      agentflow.parser.parse(`agentflow TB
        type CoffeeCopy = Record {
          hero_tagline: String
          hero_subtitle: String
          about: String
          menu_item: String * 6
        }

        type BilingualPage = Record {
          english: String
          swedish: String
        }

        agent coffee_team["Coffee Team"]
          flow build_site["Build Site"]
            agent researcher["Researcher"]
              task step1["Research Location"]
                city["city"]
                research_loc["research_location"]
                brief["Research Brief"]
                city --> research_loc --> brief
              end
              task step2["Write Copy"]
                write_copy["write_copy"]
                english_copy["English Copy"]
                brief --> write_copy --> english_copy
                write_copy --o coffee_copy_ref
              end
              step1 --> step2
            end

            agent translator["Translator"]
              task step3["Translate to Swedish"]
                translate_sv["translate_to_swedish"]
                bilingual["Bilingual Page"]
                english_copy --> translate_sv --> bilingual
                translate_sv --o bilingual_page_ref
              end
            end

            agent designer["Designer"]
              task step4["Generate Website"]
                gen_html["generate_html"]
                html_out["HTML Website"]
                bilingual --> gen_html --> html_out
              end
              nordic["nordic_design"]
              glass["glassmorphism"]
              scroll["scroll_animations"]
              toggle["bilingual_toggle"]
              gen_html --- nordic
              gen_html --- glass
              gen_html --- scroll
              gen_html --- toggle
            end
          end
        end

        coffee_copy_ref["CoffeeCopy"]
        bilingual_page_ref["BilingualPage"]
        permit_ref["Permission Tree"]

        city@{ shape: lean-right }
        brief@{ shape: doc }
        english_copy@{ shape: doc }
        bilingual@{ shape: doc }
        html_out@{ shape: doc }
        nordic@{ shape: lin-doc }
        glass@{ shape: lin-doc }
        scroll@{ shape: lin-doc }
        toggle@{ shape: lin-doc }
        coffee_copy_ref@{ shape: procs, type: "CoffeeCopy" }
        bilingual_page_ref@{ shape: procs, type: "BilingualPage" }
        permit_ref@{ shape: procs, src: "./permit-tree.mmd" }

        research_loc@{ shape: subroutine, returns: "String", requires: "^net.read", cache: "24h", description: "Research a city's coffee culture" }
        write_copy@{ shape: subroutine, returns: "CoffeeCopy", requires: "^llm.query", retry: 2, description: "Write marketing copy" }
        translate_sv@{ shape: subroutine, returns: "BilingualPage", requires: "^llm.query", description: "Translate copy to Swedish" }
        gen_html@{ shape: subroutine, returns: "String", requires: "^llm.query", description: "Generate HTML website" }

        researcher@{ model: "claude-sonnet-4-20250514", permits: "^net.read, ^llm.query" }
        translator@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }
        designer@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }

        build_site@{ params: "city :: String", returns: "String" }
      `);

      const data = agentflow.parser.yy.getData();

      // Type declarations
      expect(data.types).toHaveLength(2);
      expect(data.types[0].name).toBe('CoffeeCopy');
      expect(data.types[0].kind).toBe('record');
      expect(data.types[0].fields).toHaveLength(4);
      expect(data.types[1].name).toBe('BilingualPage');
      expect(data.types[1].kind).toBe('record');
      expect(data.types[1].fields).toHaveLength(2);

      // 4-level nesting: coffee_team > build_site > researcher/translator/designer > step1..4
      const subGraphs = agentflow.parser.yy.getSubGraphs();
      const containerTypes = subGraphs.map((sg: { id: string; type: string }) => ({
        id: sg.id,
        type: sg.type,
      }));
      expect(containerTypes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'coffee_team', type: 'agent' }),
          expect.objectContaining({ id: 'build_site', type: 'flow' }),
          expect.objectContaining({ id: 'researcher', type: 'agent' }),
          expect.objectContaining({ id: 'translator', type: 'agent' }),
          expect.objectContaining({ id: 'designer', type: 'agent' }),
          expect.objectContaining({ id: 'step1', type: 'task' }),
          expect.objectContaining({ id: 'step2', type: 'task' }),
          expect.objectContaining({ id: 'step3', type: 'task' }),
          expect.objectContaining({ id: 'step4', type: 'task' }),
        ])
      );

      // Nesting hierarchy in layout data
      const buildSiteNode = data.nodes.find((n: { id: string }) => n.id === 'build_site');
      const researcherNode = data.nodes.find((n: { id: string }) => n.id === 'researcher');
      expect(buildSiteNode?.parentId).toBe('coffee_team');
      expect(researcherNode?.parentId).toBe('build_site');

      // Node shapes
      const cityNode = data.nodes.find((n: { id: string }) => n.id === 'city');
      const briefNode = data.nodes.find((n: { id: string }) => n.id === 'brief');
      const nordicNode = data.nodes.find((n: { id: string }) => n.id === 'nordic');
      const coffeeRef = data.nodes.find((n: { id: string }) => n.id === 'coffee_copy_ref');
      const researchLocNode = data.nodes.find((n: { id: string }) => n.id === 'research_loc');
      expect(cityNode?.shape).toBe('lean-right');
      expect(briefNode?.shape).toBe('doc');
      expect(nordicNode?.shape).toBe('lin-doc');
      expect(coffeeRef?.shape).toBe('procs');
      expect(researchLocNode?.shape).toBe('subroutine');

      // Metadata on agents
      expect(researcherNode?.metadata?.model).toBe('claude-sonnet-4-20250514');
      expect(researcherNode?.metadata?.permits).toBe('^net.read, ^llm.query');

      // Metadata on tools
      expect(researchLocNode?.metadata?.returns).toBe('String');
      expect(researchLocNode?.metadata?.requires).toBe('^net.read');

      // Metadata on flow
      expect(buildSiteNode?.metadata?.params).toBe('city :: String');
      expect(buildSiteNode?.metadata?.returns).toBe('String');

      // Edge types: data flow (-->), uses (--o), governs (---)
      const usesEdges = data.edges.filter(
        (e: { arrowTypeEnd: string }) => e.arrowTypeEnd === 'arrow_circle'
      );
      const governsEdges = data.edges.filter(
        (e: { arrowTypeEnd: string }) => e.arrowTypeEnd === 'none'
      );
      expect(usesEdges.length).toBeGreaterThanOrEqual(2); // write_copy --o coffee_copy_ref, translate_sv --o bilingual_page_ref
      expect(governsEdges.length).toBeGreaterThanOrEqual(4); // gen_html --- nordic/glass/scroll/toggle
    });
  });

  describe('reference shape', function () {
    it('should parse a reference node with procs shape and src', function () {
      agentflow.parser.parse(`agentflow LR
        analyze_pr["Analyze PR"]
        analyze_pr@{ shape: procs, src: "./analyze-pr.agentflow" }
      `);

      const data = agentflow.parser.yy.getData();
      const refNode = data.nodes.find((n: { id: string }) => n.id === 'analyze_pr');
      expect(refNode).toBeDefined();
      expect(refNode?.shape).toBe('procs');
      expect(refNode?.metadata?.src).toBe('./analyze-pr.agentflow');
    });

    it('should parse a multi-file topology with references', function () {
      agentflow.parser.parse(`agentflow LR
        analyze_pr["Analyze PR"]
        write_review["Write Review"]
        post_review["Post Review"]
        analyze_pr --> write_review --> post_review
        analyze_pr@{ shape: procs, src: "./analyze-pr.agentflow" }
        write_review@{ shape: procs, src: "./write-review.agentflow" }
        post_review@{ shape: procs, src: "./post-review.agentflow" }
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.nodes).toHaveLength(3);
      expect(data.edges).toHaveLength(2);

      for (const node of data.nodes) {
        expect(node.shape).toBe('procs');
        expect(node.metadata?.src).toBeDefined();
      }
    });
  });

  describe('view hint (collapsed/expanded)', function () {
    it('should apply view metadata to a subgraph via @{} annotation', function () {
      agentflow.parser.parse(`agentflow LR
        agent a1["Agent One"]
          step1["Do thing"]
        end
        a1@{ view: "collapsed" }
      `);

      const data = agentflow.parser.yy.getData();
      const agentNode = data.nodes.find((n: { id: string }) => n.id === 'a1');
      expect(agentNode).toBeDefined();
      expect(agentNode?.metadata?.view).toBe('collapsed');
    });

    it('should render collapsed subgraph as a regular node, not a group', function () {
      agentflow.parser.parse(`agentflow LR
        agent a1["Agent One"]
          step1["Do thing"]
        end
        a1@{ view: "collapsed" }
      `);

      const data = agentflow.parser.yy.getData();
      const agentNode = data.nodes.find((n: { id: string }) => n.id === 'a1');
      expect(agentNode?.isGroup).toBe(false);
      expect(agentNode?.shape).toBe('collapsedGroup');
      expect(agentNode?.label).toBe('Agent One');
      expect(agentNode?.metadata?.containerType).toBe('agent');
    });

    it('should hide children of a collapsed subgraph', function () {
      agentflow.parser.parse(`agentflow LR
        agent a1["Agent One"]
          step1["Step 1"]
          step2["Step 2"]
          step1 --> step2
        end
        a1@{ view: "collapsed" }
      `);

      const data = agentflow.parser.yy.getData();
      // Children should be hidden
      expect(data.nodes.find((n: { id: string }) => n.id === 'step1')).toBeUndefined();
      expect(data.nodes.find((n: { id: string }) => n.id === 'step2')).toBeUndefined();
      // Edges between hidden children should be hidden
      expect(
        data.edges.some(
          (e: { start: string; end: string }) => e.start === 'step1' && e.end === 'step2'
        )
      ).toBe(false);
    });

    it('should hide nested subgraphs inside a collapsed parent', function () {
      agentflow.parser.parse(`agentflow LR
        agent a1["Agent One"]
          flow f1["Flow"]
            task t1["Task"]
              action1["Action"]
            end
          end
        end
        a1@{ view: "collapsed" }
      `);

      const data = agentflow.parser.yy.getData();
      // Only the collapsed agent should remain
      expect(data.nodes.find((n: { id: string }) => n.id === 'a1')).toBeDefined();
      expect(data.nodes.find((n: { id: string }) => n.id === 'f1')).toBeUndefined();
      expect(data.nodes.find((n: { id: string }) => n.id === 't1')).toBeUndefined();
      expect(data.nodes.find((n: { id: string }) => n.id === 'action1')).toBeUndefined();
    });

    it('should default to expanded when no view hint is given', function () {
      agentflow.parser.parse(`agentflow LR
        agent a1["Agent One"]
          step1["Do thing"]
        end
      `);

      const data = agentflow.parser.yy.getData();
      const agentNode = data.nodes.find((n: { id: string }) => n.id === 'a1');
      expect(agentNode?.isGroup).toBe(true);
      expect(agentNode?.shape).toBe('agentGroup');
      // Children visible
      expect(data.nodes.find((n: { id: string }) => n.id === 'step1')).toBeDefined();
    });

    it('should keep sibling subgraphs expanded when one is collapsed', function () {
      agentflow.parser.parse(`agentflow LR
        agent a1["Agent One"]
          s1["Step"]
        end
        agent a2["Agent Two"]
          s2["Step"]
        end
        a1@{ view: "collapsed" }
      `);

      const data = agentflow.parser.yy.getData();
      // a1 is collapsed
      const a1 = data.nodes.find((n: { id: string }) => n.id === 'a1');
      expect(a1?.isGroup).toBe(false);
      expect(data.nodes.find((n: { id: string }) => n.id === 's1')).toBeUndefined();

      // a2 is expanded
      const a2 = data.nodes.find((n: { id: string }) => n.id === 'a2');
      expect(a2?.isGroup).toBe(true);
      expect(a2?.shape).toBe('agentGroup');
      expect(data.nodes.find((n: { id: string }) => n.id === 's2')).toBeDefined();
    });

    it('should work with flow containers', function () {
      agentflow.parser.parse(`agentflow LR
        flow f1["My Flow"]
          step1["Do thing"]
        end
        f1@{ view: "collapsed" }
      `);

      const data = agentflow.parser.yy.getData();
      const flowNode = data.nodes.find((n: { id: string }) => n.id === 'f1');
      expect(flowNode?.isGroup).toBe(false);
      expect(flowNode?.shape).toBe('collapsedGroup');
      expect(flowNode?.metadata?.containerType).toBe('flow');
      expect(data.nodes.find((n: { id: string }) => n.id === 'step1')).toBeUndefined();
    });

    it('should work with task containers', function () {
      agentflow.parser.parse(`agentflow LR
        task t1["My Task"]
          action1["Action"]
        end
        t1@{ view: "collapsed" }
      `);

      const data = agentflow.parser.yy.getData();
      const taskNode = data.nodes.find((n: { id: string }) => n.id === 't1');
      expect(taskNode?.isGroup).toBe(false);
      expect(taskNode?.shape).toBe('collapsedGroup');
      expect(taskNode?.metadata?.containerType).toBe('task');
      expect(data.nodes.find((n: { id: string }) => n.id === 'action1')).toBeUndefined();
    });
  });

  describe('connectors group synthesis', function () {
    // §9: connector-designated nodes carry one or more of
    // protocol/endpoint/transport/command/auth/token_required.
    // The synthesized group node id is `agentflow-connectors-group`,
    // toggled via `connectors@{ view: "collapsed" | "expanded" }`.
    it('should synthesize agentflow-connectors-group as a cluster when expanded', function () {
      agentflow.parser.parse(`agentflow LR
        github_api["GitHub API"]
        github_api@{ protocol: "https", endpoint: "https://api.github.com" }
        slack_api["Slack API"]
        slack_api@{ protocol: "https", endpoint: "https://slack.com/api" }
        connectors@{ view: "expanded" }
      `);

      const data = agentflow.parser.yy.getData();
      const groupNode = data.nodes.find(
        (n: { id: string }) => n.id === 'agentflow-connectors-group'
      );
      expect(groupNode).toBeDefined();
      expect(groupNode?.isGroup).toBe(true);
      expect(groupNode?.shape).toBe('connectorsGroup');
      // connector vertices are re-parented into the synthesized group
      const githubNode = data.nodes.find((n: { id: string }) => n.id === 'github_api');
      const slackNode = data.nodes.find((n: { id: string }) => n.id === 'slack_api');
      expect(githubNode?.parentId).toBe('agentflow-connectors-group');
      expect(slackNode?.parentId).toBe('agentflow-connectors-group');
    });

    it('should synthesize agentflow-connectors-group as collapsed and hide connector vertices', function () {
      agentflow.parser.parse(`agentflow LR
        github_api["GitHub API"]
        github_api@{ protocol: "https", endpoint: "https://api.github.com" }
        slack_api["Slack API"]
        slack_api@{ protocol: "https", endpoint: "https://slack.com/api" }
        connectors@{ view: "collapsed" }
      `);

      const data = agentflow.parser.yy.getData();
      const groupNode = data.nodes.find(
        (n: { id: string }) => n.id === 'agentflow-connectors-group'
      );
      expect(groupNode).toBeDefined();
      expect(groupNode?.isGroup).toBe(false);
      expect(groupNode?.shape).toBe('collapsedGroup');
      expect(groupNode?.metadata?.containerType).toBe('connectors');
      // connector-designated vertices are hidden when the group is collapsed
      expect(data.nodes.find((n: { id: string }) => n.id === 'github_api')).toBeUndefined();
      expect(data.nodes.find((n: { id: string }) => n.id === 'slack_api')).toBeUndefined();
    });

    it('should leave a user-declared `subgraph connectors` untouched (subgraph branch wins)', function () {
      // When the author already wraps connectors in `subgraph connectors[...]`,
      // the existing subgraph view mechanism handles `connectors@{ view }` —
      // no synthesized `agentflow-connectors-group` is emitted.
      agentflow.parser.parse(`agentflow LR
        subgraph connectors["Connectors"]
          github_api["GitHub API"]
          github_api@{ protocol: "https", endpoint: "https://api.github.com" }
        end
        connectors@{ view: "collapsed" }
      `);

      const data = agentflow.parser.yy.getData();
      // No synthesized group node
      expect(
        data.nodes.find((n: { id: string }) => n.id === 'agentflow-connectors-group')
      ).toBeUndefined();
      // Subgraph itself collapses via the existing mechanism
      const subgraphNode = data.nodes.find((n: { id: string }) => n.id === 'connectors');
      expect(subgraphNode).toBeDefined();
      expect(subgraphNode?.shape).toBe('collapsedGroup');
    });

    it('should not synthesize the group when no `connectors@{}` metadata is set', function () {
      // Default behavior is unchanged: connector-designated nodes render
      // in their declared positions; no synthesis happens implicitly.
      agentflow.parser.parse(`agentflow LR
        github_api["GitHub API"]
        github_api@{ protocol: "https", endpoint: "https://api.github.com" }
      `);

      const data = agentflow.parser.yy.getData();
      expect(
        data.nodes.find((n: { id: string }) => n.id === 'agentflow-connectors-group')
      ).toBeUndefined();
      const githubNode = data.nodes.find((n: { id: string }) => n.id === 'github_api');
      expect(githubNode).toBeDefined();
      expect(githubNode?.parentId).toBeUndefined();
    });
  });

  describe('template declarations', function () {
    it('should parse a simple template with fields and descriptions', function () {
      agentflow.parser.parse(`agentflow TB
        template %triage_result {
          INCIDENT_ID: String <<generated incident ID>>
          SEVERITY: String <<P0 through P4 with justification>>
          TITLE: String <<concise incident title>>
        }
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.templates).toHaveLength(1);
      expect(data.templates[0].name).toBe('triage_result');
      expect(data.templates[0].fields).toHaveLength(3);
      expect(data.templates[0].fields[0]).toEqual({
        name: 'INCIDENT_ID',
        type: 'String',
        description: 'generated incident ID',
      });
      expect(data.templates[0].fields[1]).toEqual({
        name: 'SEVERITY',
        type: 'String',
        description: 'P0 through P4 with justification',
      });
    });

    it('should parse template fields with multiplicity', function () {
      agentflow.parser.parse(`agentflow TB
        template %runbook_format {
          OBJECTIVE: String <<what this runbook achieves>>
          STEP: String * 8 <<Step # | Action | Command | Rollback>>
          VERIFICATION: String <<how to confirm mitigation>>
        }
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.templates).toHaveLength(1);
      const tpl = data.templates[0];
      expect(tpl.name).toBe('runbook_format');
      expect(tpl.fields).toHaveLength(3);
      expect(tpl.fields[1]).toEqual({
        name: 'STEP',
        type: 'String',
        multiplicity: 8,
        description: 'Step # | Action | Command | Rollback',
      });
    });

    it('should parse multiple templates', function () {
      agentflow.parser.parse(`agentflow TB
        template %triage_result {
          SEVERITY: String <<P0 through P4>>
          TIMELINE: String * 3 <<Timestamp | Event | Source>>
        }
        template %investigation_report {
          SUMMARY: String <<executive summary>>
          ANOMALY: String * 5 <<Timestamp | Service | Metric | Expected | Actual>>
        }
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.templates).toHaveLength(2);
      expect(data.templatesByName.triage_result).toBeDefined();
      expect(data.templatesByName.investigation_report).toBeDefined();
      expect(data.templatesByName.triage_result.fields).toHaveLength(2);
      expect(data.templatesByName.investigation_report.fields).toHaveLength(2);
    });

    it('should coexist with type declarations', function () {
      agentflow.parser.parse(`agentflow TB
        type Incident = Record {
          id: String
          severity: String
        }
        type Severity = P0 | P1 | P2
        template %triage_result {
          SEVERITY: String <<P0 through P4>>
        }
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.types).toHaveLength(2);
      expect(data.templates).toHaveLength(1);
    });
  });

  describe('skill grouping', function () {
    it('should parse a skill with a quoted label', function () {
      agentflow.parser.parse(`agentflow LR
        skill web_search["Web Search"]
          A --> B
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('web_search');
      expect(subGraphs[0].title).toBe('Web Search');
      expect(subGraphs[0].type).toBe('skill');
    });

    it('should parse a skill without a label and produce empty title', function () {
      agentflow.parser.parse(`agentflow LR
        skill mySkill
          A
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('mySkill');
      expect(subGraphs[0].title).toBe('');
      expect(subGraphs[0].type).toBe('skill');
    });

    it('should parse an empty skill', function () {
      agentflow.parser.parse(`agentflow LR
        skill s1["S"]
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].nodes).toHaveLength(0);
      expect(subGraphs[0].type).toBe('skill');
    });

    it('should produce skillGroup shape in getData()', function () {
      agentflow.parser.parse(`agentflow LR
        skill s1["Search Skill"]
          A --> B
        end
      `);

      const data = agentflow.parser.yy.getData();
      const skillNode = data.nodes.find((n: { id: string }) => n.id === 's1');
      expect(skillNode).toBeDefined();
      expect(skillNode?.isGroup).toBe(true);
      expect(skillNode?.shape).toBe('skillGroup');
    });

    it('should assign correct parentId to child nodes', function () {
      agentflow.parser.parse(`agentflow LR
        skill s1["Search Skill"]
          search_tool["Search"]
          rank_tool["Rank"]
          search_tool --> rank_tool
        end
      `);

      const data = agentflow.parser.yy.getData();
      const searchNode = data.nodes.find((n: { id: string }) => n.id === 'search_tool');
      const rankNode = data.nodes.find((n: { id: string }) => n.id === 'rank_tool');
      expect(searchNode?.parentId).toBe('s1');
      expect(rankNode?.parentId).toBe('s1');
    });

    it('should support metadata (strategy, params, returns) on the container', function () {
      agentflow.parser.parse(`agentflow LR
        skill s1["Search Skill"]
          A
        end
        s1@{ strategy: "parallel", params: "query :: String", returns: "Results" }
      `);

      const data = agentflow.parser.yy.getData();
      const skillNode = data.nodes.find((n: { id: string }) => n.id === 's1');
      expect(skillNode?.metadata?.strategy).toBe('parallel');
      expect(skillNode?.metadata?.params).toBe('query :: String');
      expect(skillNode?.metadata?.returns).toBe('Results');
    });
  });

  describe('testCase grouping', function () {
    it('should parse a testCase with a quoted label', function () {
      agentflow.parser.parse(`agentflow LR
        testCase verify_output["Verify Output"]
          A --> B
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('verify_output');
      expect(subGraphs[0].title).toBe('Verify Output');
      expect(subGraphs[0].type).toBe('test');
    });

    it('should parse a testCase without a label', function () {
      agentflow.parser.parse(`agentflow LR
        testCase myTest
          A
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('myTest');
      expect(subGraphs[0].title).toBe('');
      expect(subGraphs[0].type).toBe('test');
    });

    it('should produce testGroup shape in getData()', function () {
      agentflow.parser.parse(`agentflow LR
        testCase t1["Verify"]
          A --> B
        end
      `);

      const data = agentflow.parser.yy.getData();
      const testNode = data.nodes.find((n: { id: string }) => n.id === 't1');
      expect(testNode).toBeDefined();
      expect(testNode?.isGroup).toBe(true);
      expect(testNode?.shape).toBe('testGroup');
    });

    it('should support assert/expects metadata', function () {
      agentflow.parser.parse(`agentflow LR
        testCase t1["Verify Output"]
          A
        end
        t1@{ assert: "output.length > 0", expects: "non-empty response" }
      `);

      const data = agentflow.parser.yy.getData();
      const testNode = data.nodes.find((n: { id: string }) => n.id === 't1');
      expect(testNode?.metadata?.assert).toBe('output.length > 0');
      expect(testNode?.metadata?.expects).toBe('non-empty response');
    });
  });

  describe('directive grouping', function () {
    it('should parse a directive with a quoted label', function () {
      agentflow.parser.parse(`agentflow LR
        directive safety["Safety Constraint"]
          A
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('safety');
      expect(subGraphs[0].title).toBe('Safety Constraint');
      expect(subGraphs[0].type).toBe('directive');
    });

    it('should parse a directive without a label', function () {
      agentflow.parser.parse(`agentflow LR
        directive myDirective
          A
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('myDirective');
      expect(subGraphs[0].title).toBe('');
      expect(subGraphs[0].type).toBe('directive');
    });

    it('should produce directiveGroup shape in getData()', function () {
      agentflow.parser.parse(`agentflow LR
        directive d1["Safety"]
          rule1["No PII"]
        end
      `);

      const data = agentflow.parser.yy.getData();
      const dirNode = data.nodes.find((n: { id: string }) => n.id === 'd1');
      expect(dirNode).toBeDefined();
      expect(dirNode?.isGroup).toBe(true);
      expect(dirNode?.shape).toBe('directiveGroup');
    });

    it('should support metadata (params) on the container', function () {
      agentflow.parser.parse(`agentflow LR
        directive d1["Rate Limit"]
          A
        end
        d1@{ params: "max_requests :: Int" }
      `);

      const data = agentflow.parser.yy.getData();
      const dirNode = data.nodes.find((n: { id: string }) => n.id === 'd1');
      expect(dirNode?.metadata?.params).toBe('max_requests :: Int');
    });

    it('should support dotted edge from tool to directive', function () {
      agentflow.parser.parse(`agentflow LR
        directive d1["Safety"]
          A
        end
        tool1["Search"]
        tool1 -.-> d1
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.edges.length).toBeGreaterThanOrEqual(1);
      const edge = data.edges.find(
        (e: { start: string; end: string }) => e.start === 'tool1' && e.end === 'd1'
      );
      expect(edge).toBeDefined();
    });
  });

  describe('new shape whitelist entries', function () {
    it('should accept trapezoid shape via @{} metadata', function () {
      agentflow.parser.parse(`agentflow LR
        constraint1["No PII"]
        constraint1@{ shape: trapezoid }
      `);

      const data = agentflow.parser.yy.getData();
      const node = data.nodes.find((n: { id: string }) => n.id === 'constraint1');
      expect(node).toBeDefined();
      expect(node?.shape).toBe('trapezoid');
    });

    it('should accept inv-trapezoid shape via @{} metadata', function () {
      agentflow.parser.parse(`agentflow LR
        node1["Inverted"]
        node1@{ shape: inv-trapezoid }
      `);

      const data = agentflow.parser.yy.getData();
      const node = data.nodes.find((n: { id: string }) => n.id === 'node1');
      expect(node).toBeDefined();
      expect(node?.shape).toBe('inv-trapezoid');
    });

    it('should accept double-circle shape via @{} metadata', function () {
      agentflow.parser.parse(`agentflow LR
        assert1["Check"]
        assert1@{ shape: double-circle }
      `);

      const data = agentflow.parser.yy.getData();
      const node = data.nodes.find((n: { id: string }) => n.id === 'assert1');
      expect(node).toBeDefined();
      expect(node?.shape).toBe('double-circle');
    });
  });

  describe('template sections', function () {
    it('should parse template with section markers', function () {
      agentflow.parser.parse(`agentflow TB
        template %clinical_note {
          section DIAGNOSIS
          PRIMARY_DX: String <<primary diagnosis>>
          SECONDARY_DX: String * 3 <<secondary diagnoses>>
          section MANAGEMENT
          MEDICATION: String * 5 <<medication orders>>
          FOLLOW_UP: String <<follow-up plan>>
        }
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.templates).toHaveLength(1);
      const tpl = data.templates[0];
      expect(tpl.name).toBe('clinical_note');
      expect(tpl.fields).toHaveLength(6);

      // First section marker
      expect(tpl.fields[0].kind).toBe('section');
      expect(tpl.fields[0].name).toBe('DIAGNOSIS');
      expect(tpl.fields[0].type).toBe('section');

      // Fields between sections
      expect(tpl.fields[1].name).toBe('PRIMARY_DX');
      expect(tpl.fields[1].kind).toBeUndefined();

      expect(tpl.fields[2].name).toBe('SECONDARY_DX');
      expect(tpl.fields[2].multiplicity).toBe(3);

      // Second section marker
      expect(tpl.fields[3].kind).toBe('section');
      expect(tpl.fields[3].name).toBe('MANAGEMENT');

      // Fields in second section
      expect(tpl.fields[4].name).toBe('MEDICATION');
      expect(tpl.fields[5].name).toBe('FOLLOW_UP');
    });

    it('should parse template without sections (regression)', function () {
      agentflow.parser.parse(`agentflow TB
        template %simple {
          NAME: String <<name field>>
          VALUE: String <<value field>>
        }
      `);

      const data = agentflow.parser.yy.getData();
      expect(data.templates).toHaveLength(1);
      const tpl = data.templates[0];
      expect(tpl.fields).toHaveLength(2);
      expect(tpl.fields[0].name).toBe('NAME');
      expect(tpl.fields[0].kind).toBeUndefined();
      expect(tpl.fields[1].name).toBe('VALUE');
    });
  });

  describe('metadata merging', function () {
    it('should merge multiple metadata statements on the same vertex', function () {
      agentflow.parser.parse(`agentflow
        A["Node A"]
        A@{ shape: subroutine }
        A@{ params: "x :: Int" }
      `);
      const vert = agentflow.parser.yy.getVertices();
      const a = vert.get('A');
      expect(a.metadata.shape).toBe('subroutine');
      expect(a.metadata.params).toBe('x :: Int');
    });

    it('should let later metadata overwrite conflicting keys', function () {
      agentflow.parser.parse(`agentflow
        B["Node B"]
        B@{ shape: subroutine, params: "old" }
        B@{ params: "new" }
      `);
      const vert = agentflow.parser.yy.getVertices();
      const b = vert.get('B');
      expect(b.metadata.shape).toBe('subroutine');
      expect(b.metadata.params).toBe('new');
    });

    it('should merge multiple metadata statements on the same subgraph', function () {
      agentflow.parser.parse(`agentflow
        directive d1["Directive"]
          X
        end
        d1@{ algorithm: elk.box }
        d1@{ params: "max_requests :: Int" }
      `);
      const data = agentflow.parser.yy.getData();
      delete data.config;
      const d1Node = data.nodes.find((n: any) => n.id === 'd1');
      expect(d1Node.metadata.algorithm).toBe('elk.box');
      expect(d1Node.metadata.params).toBe('max_requests :: Int');
    });

    it('should let later subgraph metadata overwrite conflicting keys', function () {
      agentflow.parser.parse(`agentflow
        skill s1["Skill"]
          Y
        end
        s1@{ algorithm: elk.box, strategy: "parallel" }
        s1@{ strategy: "sequential" }
      `);
      const data = agentflow.parser.yy.getData();
      delete data.config;
      const s1Node = data.nodes.find((n: any) => n.id === 's1');
      expect(s1Node.metadata.algorithm).toBe('elk.box');
      expect(s1Node.metadata.strategy).toBe('sequential');
    });
  });

  describe('extended metadata fields', function () {
    it('should store strategy on skill containers', function () {
      agentflow.parser.parse(`agentflow LR
        skill s1["Search"]
          A
        end
        s1@{ strategy: "round-robin" }
      `);

      const data = agentflow.parser.yy.getData();
      const node = data.nodes.find((n: { id: string }) => n.id === 's1');
      expect(node?.metadata?.strategy).toBe('round-robin');
    });

    it('should store severity/context/rule on lesson nodes', function () {
      agentflow.parser.parse(`agentflow LR
        lesson1["Lesson Learned"]
        lesson1@{ shape: lin-doc, severity: "high", context: "production outage", rule: "always verify backups" }
      `);

      const data = agentflow.parser.yy.getData();
      const node = data.nodes.find((n: { id: string }) => n.id === 'lesson1');
      expect(node?.shape).toBe('lin-doc');
      expect(node?.metadata?.severity).toBe('high');
      expect(node?.metadata?.context).toBe('production outage');
      expect(node?.metadata?.rule).toBe('always verify backups');
    });

    it('should store transport/command on MCP tool nodes', function () {
      agentflow.parser.parse(`agentflow LR
        mcp_tool["MCP Tool"]
        mcp_tool@{ shape: subroutine, transport: "stdio", command: "npx -y @modelcontextprotocol/server-github" }
      `);

      const data = agentflow.parser.yy.getData();
      const node = data.nodes.find((n: { id: string }) => n.id === 'mcp_tool');
      expect(node?.shape).toBe('subroutine');
      expect(node?.metadata?.transport).toBe('stdio');
      expect(node?.metadata?.command).toBe('npx -y @modelcontextprotocol/server-github');
    });

    it('should store validate on tool nodes', function () {
      agentflow.parser.parse(`agentflow LR
        search["Search"]
        search@{ shape: subroutine, validate: "json-schema" }
      `);

      const data = agentflow.parser.yy.getData();
      const node = data.nodes.find((n: { id: string }) => n.id === 'search');
      expect(node?.metadata?.validate).toBe('json-schema');
    });

    it('should store memory on agent containers', function () {
      agentflow.parser.parse(`agentflow LR
        agent a1["My Agent"]
          A
        end
        a1@{ memory: "episodic" }
      `);

      const data = agentflow.parser.yy.getData();
      const node = data.nodes.find((n: { id: string }) => n.id === 'a1');
      expect(node?.metadata?.memory).toBe('episodic');
    });

    it('should store execution on task containers', function () {
      agentflow.parser.parse(`agentflow LR
        task t1["Process"]
          A
        end
        t1@{ execution: "sequential" }
      `);

      const data = agentflow.parser.yy.getData();
      const node = data.nodes.find((n: { id: string }) => n.id === 't1');
      expect(node?.metadata?.execution).toBe('sequential');
    });

    it('should store fallbacks on agent bundle containers', function () {
      agentflow.parser.parse(`agentflow LR
        agent bundle["Agent Bundle"]
          A
        end
        bundle@{ fallbacks: "retry-3, escalate" }
      `);

      const data = agentflow.parser.yy.getData();
      const node = data.nodes.find((n: { id: string }) => n.id === 'bundle');
      expect(node?.metadata?.fallbacks).toBe('retry-3, escalate');
    });
  });

  describe('group container', function () {
    it('should parse a group with a quoted label', function () {
      agentflow.parser.parse(`agentflow LR
        group layout_group["My Group"]
          A --> B
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('layout_group');
      expect(subGraphs[0].title).toBe('My Group');
      expect(subGraphs[0].type).toBe('group');
    });

    it('should parse a group without a label', function () {
      agentflow.parser.parse(`agentflow LR
        group myGroup
          A
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].id).toBe('myGroup');
      expect(subGraphs[0].title).toBe('');
      expect(subGraphs[0].type).toBe('group');
    });

    it('should parse an anonymous group', function () {
      agentflow.parser.parse(`agentflow LR
        group
          A
        end
      `);

      const subGraphs = agentflow.parser.yy.getSubGraphs();
      expect(subGraphs).toHaveLength(1);
      expect(subGraphs[0].type).toBe('group');
    });

    it('should produce groupGroup shape in getData()', function () {
      agentflow.parser.parse(`agentflow LR
        group g1["Layout Group"]
          A --> B
        end
      `);

      const data = agentflow.parser.yy.getData();
      const groupNode = data.nodes.find((n: { id: string }) => n.id === 'g1');
      expect(groupNode).toBeDefined();
      expect(groupNode?.isGroup).toBe(true);
      expect(groupNode?.shape).toBe('groupGroup');
    });

    it('should support algorithm metadata on the container', function () {
      agentflow.parser.parse(`agentflow LR
        group g1["Stress Layout"]
          A --> B
        end
        g1@{ algorithm: "elk.stress" }
      `);

      const data = agentflow.parser.yy.getData();
      const groupNode = data.nodes.find((n: { id: string }) => n.id === 'g1');
      expect(groupNode?.metadata?.algorithm).toBe('elk.stress');
    });
  });
});
