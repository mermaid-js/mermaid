import { setConfig } from '../../../config.js';
import { FlowchartParserFactory } from './parserFactory.js';
import { cleanupComments } from '../../../diagram-api/comments.js';

setConfig({
  securityLevel: 'strict',
});

console.log('🚀 Starting comprehensive main flow parsing test comparison across all parsers');

const parserFactory = FlowchartParserFactory.getInstance();

describe('Combined Flow Main Test - All Three Parsers', () => {
  console.log('📊 Testing main flow parsing functionality with 3 parsers');

  // Test data for main flow parsing functionality
  const testCases = [
    {
      name: 'trailing whitespaces after statements',
      diagram: 'graph TD;\n\n\n %% Comment\n A-->B; \n B-->C;',
      expectedVertices: ['A', 'B', 'C'],
      expectedEdges: 2,
      expectedFirstEdge: { start: 'A', end: 'B', type: 'arrow_point', text: '' }
    },
    {
      name: 'node names with "end" substring',
      diagram: 'graph TD\nendpoint --> sender',
      expectedVertices: ['endpoint', 'sender'],
      expectedEdges: 1,
      expectedFirstEdge: { start: 'endpoint', end: 'sender' }
    },
    {
      name: 'node names ending with keywords',
      diagram: 'graph TD\nblend --> monograph',
      expectedVertices: ['blend', 'monograph'],
      expectedEdges: 1,
      expectedFirstEdge: { start: 'blend', end: 'monograph' }
    },
    {
      name: 'default in node name/id',
      diagram: 'graph TD\ndefault --> monograph',
      expectedVertices: ['default', 'monograph'],
      expectedEdges: 1,
      expectedFirstEdge: { start: 'default', end: 'monograph' }
    },
    {
      name: 'direction in node ids',
      diagram: 'graph TD;\n  node1TB\n',
      expectedVertices: ['node1TB'],
      expectedEdges: 0
    },
    {
      name: 'text including URL space',
      diagram: 'graph TD;A--x|text including URL space|B;',
      expectedVertices: ['A', 'B'],
      expectedEdges: 1
    },
    {
      name: 'numbers as labels',
      diagram: 'graph TB;subgraph "number as labels";1;end;',
      expectedVertices: ['1'],
      expectedEdges: 0
    },
    {
      name: 'accTitle and accDescr',
      diagram: `graph LR
        accTitle: Big decisions
        accDescr: Flow chart of the decision making process
        A[Hard] -->|Text| B(Round)
        B --> C{Decision}
        C -->|One| D[Result 1]
        C -->|Two| E[Result 2]`,
      expectedVertices: ['A', 'B', 'C', 'D', 'E'],
      expectedEdges: 4,
      expectedAccTitle: 'Big decisions',
      expectedAccDescr: 'Flow chart of the decision making process'
    }
  ];

  // Special character test cases
  const specialCharTests = [
    { char: '.', expected: '.' },
    { char: 'Start 103a.a1', expected: 'Start 103a.a1' },
    { char: ':', expected: ':' },
    { char: ',', expected: ',' },
    { char: 'a-b', expected: 'a-b' },
    { char: '+', expected: '+' },
    { char: '*', expected: '*' },
    { char: '<', expected: '&lt;' },
    { char: '&', expected: '&' }
  ];

  // Unsafe property test cases
  const unsafeProps = ['__proto__', 'constructor'];

  // Test each parser with main flow functionality
  ['jison', 'antlr', 'lark'].forEach(parserType => {
    describe(`${parserType.toUpperCase()} Parser Main Tests`, () => {
      testCases.forEach(testCase => {
        it(`should handle ${testCase.name} (${parserType})`, async () => {
          const parser = await parserFactory.getParser(parserType);
          parser.yy.clear();

          const diagram = testCase.diagram.includes('%%') ? 
            cleanupComments(testCase.diagram) : testCase.diagram;
          
          expect(() => parser.parse(diagram)).not.toThrow();

          const vertices = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          // Check vertices
          expect(vertices.size).toBe(testCase.expectedVertices.length);
          testCase.expectedVertices.forEach(vertexId => {
            expect(vertices.get(vertexId)).toBeDefined();
            expect(vertices.get(vertexId).id).toBe(vertexId);
          });

          // Check edges
          expect(edges.length).toBe(testCase.expectedEdges);
          
          if (testCase.expectedFirstEdge && edges.length > 0) {
            expect(edges[0].start).toBe(testCase.expectedFirstEdge.start);
            expect(edges[0].end).toBe(testCase.expectedFirstEdge.end);
            if (testCase.expectedFirstEdge.type) {
              expect(edges[0].type).toBe(testCase.expectedFirstEdge.type);
            }
            if (testCase.expectedFirstEdge.text !== undefined) {
              expect(edges[0].text).toBe(testCase.expectedFirstEdge.text);
            }
          }

          // Check accessibility properties if expected
          if (testCase.expectedAccTitle) {
            expect(parser.yy.getAccTitle()).toBe(testCase.expectedAccTitle);
          }
          if (testCase.expectedAccDescr) {
            expect(parser.yy.getAccDescription()).toBe(testCase.expectedAccDescr);
          }
        });
      });

      // Special character tests
      specialCharTests.forEach(charTest => {
        it(`should handle special character '${charTest.char}' (${parserType})`, async () => {
          const parser = await parserFactory.getParser(parserType);
          parser.yy.clear();

          const diagram = `graph TD;A(${charTest.char})-->B;`;
          
          expect(() => parser.parse(diagram)).not.toThrow();

          const vertices = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          expect(vertices.get('A').id).toBe('A');
          expect(vertices.get('B').id).toBe('B');
          expect(vertices.get('A').text).toBe(charTest.expected);
        });
      });

      // Unsafe property tests
      unsafeProps.forEach(unsafeProp => {
        it(`should work with node id ${unsafeProp} (${parserType})`, async () => {
          const parser = await parserFactory.getParser(parserType);
          parser.yy.clear();

          const diagram = `graph LR\n${unsafeProp} --> A;`;
          
          expect(() => parser.parse(diagram)).not.toThrow();
        });

        it(`should work with tooltip id ${unsafeProp} (${parserType})`, async () => {
          const parser = await parserFactory.getParser(parserType);
          parser.yy.clear();

          const diagram = `graph LR\nclick ${unsafeProp} callback "${unsafeProp}";`;
          
          expect(() => parser.parse(diagram)).not.toThrow();
        });

        it(`should work with class id ${unsafeProp} (${parserType})`, async () => {
          const parser = await parserFactory.getParser(parserType);
          parser.yy.clear();

          const diagram = `graph LR
            ${unsafeProp} --> A;
            classDef ${unsafeProp} color:#ffffff,fill:#000000;
            class ${unsafeProp} ${unsafeProp};`;
          
          expect(() => parser.parse(diagram)).not.toThrow();
        });

        it(`should work with subgraph id ${unsafeProp} (${parserType})`, async () => {
          const parser = await parserFactory.getParser(parserType);
          parser.yy.clear();

          const diagram = `graph LR
            ${unsafeProp} --> A;
            subgraph ${unsafeProp}
              C --> D;
            end;`;
          
          expect(() => parser.parse(diagram)).not.toThrow();
        });
      });
    });
  });

  // Summary test to compare all parsers
  describe('Parser Main Functionality Comparison Summary', () => {
    it('should provide comprehensive main functionality comparison results', async () => {
      const results = {
        jison: { passed: 0, failed: 0 },
        antlr: { passed: 0, failed: 0 },
        lark: { passed: 0, failed: 0 }
      };

      // Test core functionality across all parsers
      for (const parserType of ['jison', 'antlr', 'lark']) {
        const parser = await parserFactory.getParser(parserType);
        
        for (const testCase of testCases) {
          try {
            parser.yy.clear();
            const diagram = testCase.diagram.includes('%%') ? 
              cleanupComments(testCase.diagram) : testCase.diagram;
            parser.parse(diagram);
            
            const vertices = parser.yy.getVertices();
            const edges = parser.yy.getEdges();
            
            // Basic validation
            if (vertices.size === testCase.expectedVertices.length && 
                edges.length === testCase.expectedEdges) {
              results[parserType].passed++;
            } else {
              results[parserType].failed++;
            }
          } catch (error) {
            results[parserType].failed++;
          }
        }
      }

      // Display results
      console.log('\n📊 COMPREHENSIVE MAIN FLOW PARSING COMPARISON RESULTS:');
      console.log('================================================================================');
      
      Object.entries(results).forEach(([parser, result]) => {
        const total = result.passed + result.failed;
        const successRate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0.0';
        console.log(`\n🔧 ${parser.toUpperCase()} Parser:`);
        console.log(`   ✅ Passed: ${result.passed}`);
        console.log(`   ❌ Failed: ${result.failed}`);
        console.log(`   📈 Success Rate: ${successRate}%`);
      });
      
      console.log('\n================================================================================');

      // Verify all parsers achieve high success rates
      Object.entries(results).forEach(([parser, result]) => {
        const total = result.passed + result.failed;
        const successRate = total > 0 ? (result.passed / total) * 100 : 0;
        expect(successRate).toBeGreaterThanOrEqual(90); // Expect at least 90% success rate
      });
    });
  });
});
