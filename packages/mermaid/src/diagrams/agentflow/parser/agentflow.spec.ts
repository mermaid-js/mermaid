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
});
