import { setConfig } from '../../../config.js';
import { FlowchartParserFactory } from './parserFactory.js';

setConfig({
  securityLevel: 'strict',
});

console.log('🚀 Starting comprehensive subgraph test comparison across all parsers');

const parserFactory = FlowchartParserFactory.getInstance();

describe('Combined Flow Subgraph Test - All Three Parsers', () => {
  console.log('📊 Testing subgraph parsing functionality with 3 parsers');

  // Test data for subgraph functionality
  const testCases = [
    {
      name: 'subgraph with tab indentation',
      diagram: 'graph TB\nsubgraph One\n\ta1-->a2\nend',
      expectedSubgraphs: 1,
      expectedSubgraph: {
        title: 'One',
        id: 'One',
        nodeCount: 2,
        nodes: ['a2', 'a1']
      }
    },
    {
      name: 'subgraph with chaining nodes',
      diagram: 'graph TB\nsubgraph One\n\ta1-->a2-->a3\nend',
      expectedSubgraphs: 1,
      expectedSubgraph: {
        title: 'One',
        id: 'One',
        nodeCount: 3,
        nodes: ['a3', 'a2', 'a1']
      }
    },
    {
      name: 'subgraph with multiple words in title',
      diagram: 'graph TB\nsubgraph "Some Title"\n\ta1-->a2\nend',
      expectedSubgraphs: 1,
      expectedSubgraph: {
        title: 'Some Title',
        id: 'subGraph0',
        nodeCount: 2,
        nodes: ['a2', 'a1']
      }
    },
    {
      name: 'subgraph with id and title notation',
      diagram: 'graph TB\nsubgraph some-id[Some Title]\n\ta1-->a2\nend',
      expectedSubgraphs: 1,
      expectedSubgraph: {
        title: 'Some Title',
        id: 'some-id',
        nodeCount: 2,
        nodes: ['a2', 'a1']
      }
    },
    {
      name: 'subgraph id starting with a number',
      diagram: `graph TD
        A[Christmas] -->|Get money| B(Go shopping)
        subgraph 1test
        A
        end`,
      expectedSubgraphs: 1,
      expectedSubgraph: {
        id: '1test',
        nodeCount: 1,
        nodes: ['A']
      }
    },
    {
      name: 'basic subgraph with arrow',
      diagram: 'graph TD;A-->B;subgraph myTitle;c-->d;end;',
      expectedSubgraphs: 1,
      expectedEdgeType: 'arrow_point'
    },
    {
      name: 'subgraph with title in quotes',
      diagram: 'graph TD;A-->B;subgraph "title in quotes";c-->d;end;',
      expectedSubgraphs: 1,
      expectedSubgraph: {
        title: 'title in quotes'
      },
      expectedEdgeType: 'arrow_point'
    },
    {
      name: 'subgraph with dashes in title',
      diagram: 'graph TD;A-->B;subgraph a-b-c;c-->d;end;',
      expectedSubgraphs: 1,
      expectedSubgraph: {
        title: 'a-b-c'
      },
      expectedEdgeType: 'arrow_point'
    },
    {
      name: 'subgraph with id and title in brackets',
      diagram: 'graph TD;A-->B;subgraph uid1[text of doom];c-->d;end;',
      expectedSubgraphs: 1,
      expectedSubgraph: {
        title: 'text of doom',
        id: 'uid1'
      },
      expectedEdgeType: 'arrow_point'
    },
    {
      name: 'subgraph with id and title in brackets and quotes',
      diagram: 'graph TD;A-->B;subgraph uid2["text of doom"];c-->d;end;',
      expectedSubgraphs: 1,
      expectedSubgraph: {
        title: 'text of doom',
        id: 'uid2'
      },
      expectedEdgeType: 'arrow_point'
    }
  ];

  // Complex subgraph test cases
  const complexTestCases = [
    {
      name: 'subgraph with multi node statements',
      diagram: 'graph TD\nA-->B\nsubgraph myTitle\na & b --> c & e\n end;',
      expectedEdgeType: 'arrow_point'
    },
    {
      name: 'nested subgraphs case 1',
      diagram: `flowchart TB
        subgraph A
        b-->B
        a
        end
        a-->c
        subgraph B
          c
        end`,
      expectedSubgraphs: 2,
      expectedSubgraphA: {
        id: 'A',
        shouldContain: ['B', 'b', 'a'],
        shouldNotContain: ['c']
      },
      expectedSubgraphB: {
        id: 'B',
        nodes: ['c']
      }
    },
    {
      name: 'nested subgraphs case 2',
      diagram: `flowchart TB
        b-->B
        a-->c
        subgraph B
          c
        end
        subgraph A
            a
            b
            B
        end`,
      expectedSubgraphs: 2,
      expectedSubgraphA: {
        id: 'A',
        shouldContain: ['B', 'b', 'a'],
        shouldNotContain: ['c']
      },
      expectedSubgraphB: {
        id: 'B',
        nodes: ['c']
      }
    }
  ];

  // Test each parser with subgraph functionality
  ['jison', 'antlr', 'lark'].forEach(parserType => {
    describe(`${parserType.toUpperCase()} Parser Subgraph Tests`, () => {
      testCases.forEach(testCase => {
        it(`should handle ${testCase.name} (${parserType})`, async () => {
          const parser = await parserFactory.getParser(parserType);
          parser.yy.clear();
          parser.yy.setGen('gen-2');

          expect(() => parser.parse(testCase.diagram)).not.toThrow();

          const subgraphs = parser.yy.getSubGraphs();
          expect(subgraphs.length).toBe(testCase.expectedSubgraphs);

          if (testCase.expectedSubgraph) {
            const subgraph = subgraphs[0];
            
            if (testCase.expectedSubgraph.title) {
              expect(subgraph.title).toBe(testCase.expectedSubgraph.title);
            }
            if (testCase.expectedSubgraph.id) {
              expect(subgraph.id).toBe(testCase.expectedSubgraph.id);
            }
            if (testCase.expectedSubgraph.nodeCount) {
              expect(subgraph.nodes.length).toBe(testCase.expectedSubgraph.nodeCount);
            }
            if (testCase.expectedSubgraph.nodes) {
              testCase.expectedSubgraph.nodes.forEach((node, index) => {
                expect(subgraph.nodes[index]).toBe(node);
              });
            }
          }

          if (testCase.expectedEdgeType) {
            const edges = parser.yy.getEdges();
            expect(edges[0].type).toBe(testCase.expectedEdgeType);
          }
        });
      });

      // Complex subgraph tests
      complexTestCases.forEach(testCase => {
        it(`should handle ${testCase.name} (${parserType})`, async () => {
          const parser = await parserFactory.getParser(parserType);
          parser.yy.clear();
          parser.yy.setGen('gen-2');

          expect(() => parser.parse(testCase.diagram)).not.toThrow();

          if (testCase.expectedEdgeType) {
            const edges = parser.yy.getEdges();
            expect(edges[0].type).toBe(testCase.expectedEdgeType);
          }

          if (testCase.expectedSubgraphs) {
            const subgraphs = parser.yy.getSubGraphs();
            expect(subgraphs.length).toBe(testCase.expectedSubgraphs);

            if (testCase.expectedSubgraphA) {
              const subgraphA = subgraphs.find((o) => o.id === testCase.expectedSubgraphA.id);
              expect(subgraphA).toBeDefined();
              
              if (testCase.expectedSubgraphA.shouldContain) {
                testCase.expectedSubgraphA.shouldContain.forEach(node => {
                  expect(subgraphA.nodes).toContain(node);
                });
              }
              if (testCase.expectedSubgraphA.shouldNotContain) {
                testCase.expectedSubgraphA.shouldNotContain.forEach(node => {
                  expect(subgraphA.nodes).not.toContain(node);
                });
              }
            }

            if (testCase.expectedSubgraphB) {
              const subgraphB = subgraphs.find((o) => o.id === testCase.expectedSubgraphB.id);
              expect(subgraphB).toBeDefined();
              
              if (testCase.expectedSubgraphB.nodes) {
                testCase.expectedSubgraphB.nodes.forEach((node, index) => {
                  expect(subgraphB.nodes[index]).toBe(node);
                });
              }
            }
          }
        });
      });
    });
  });

  // Summary test to compare all parsers
  describe('Parser Subgraph Comparison Summary', () => {
    it('should provide comprehensive subgraph comparison results', async () => {
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
            parser.yy.setGen('gen-2');
            parser.parse(testCase.diagram);
            
            const subgraphs = parser.yy.getSubGraphs();
            
            // Basic validation
            if (subgraphs.length === testCase.expectedSubgraphs) {
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
      console.log('\n📊 COMPREHENSIVE SUBGRAPH PARSING COMPARISON RESULTS:');
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
