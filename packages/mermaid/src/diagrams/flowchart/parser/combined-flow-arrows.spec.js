/**
 * Combined Flow Arrows Test - All Three Parsers
 *
 * This test runs all arrow test cases from flow-arrows.spec.js against
 * Jison, ANTLR, and Lark parsers to compare their behavior and compatibility.
 */

import { FlowDB } from '../flowDb.js';
import { getFlowchartParser } from './parserFactory.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

// Test cases extracted from flow-arrows.spec.js
const arrowTestCases = [
  {
    name: 'should handle a nodes and edges',
    input: 'graph TD;\nA-->B;',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '', stroke: 'normal', length: 1 },
    ],
  },
  {
    name: "should handle angle bracket ' > ' as direction LR",
    input: 'graph >;A-->B;',
    expectedDirection: 'LR',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '', stroke: 'normal', length: 1 },
    ],
  },
  {
    name: "should handle angle bracket ' < ' as direction RL",
    input: 'graph <;A-->B;',
    expectedDirection: 'RL',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '', stroke: 'normal', length: 1 },
    ],
  },
  {
    name: "should handle caret ' ^ ' as direction BT",
    input: 'graph ^;A-->B;',
    expectedDirection: 'BT',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '', stroke: 'normal', length: 1 },
    ],
  },
  {
    name: "should handle lower-case 'v' as direction TB",
    input: 'graph v;A-->B;',
    expectedDirection: 'TB',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '', stroke: 'normal', length: 1 },
    ],
  },
  {
    name: 'should handle a nodes and edges and a space between link and node',
    input: 'graph TD;A --> B;',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '', stroke: 'normal', length: 1 },
    ],
  },
  {
    name: 'should handle a nodes and edges, a space between link and node and each line ending without semicolon',
    input: 'graph TD\nA --> B\n style e red',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '', stroke: 'normal', length: 1 },
    ],
  },
  {
    name: 'should handle statements ending without semicolon',
    input: 'graph TD\nA-->B\nB-->C',
    expectedVertices: ['A', 'B', 'C'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '', stroke: 'normal', length: 1 },
      { start: 'B', end: 'C', type: 'arrow_point', text: '', stroke: 'normal', length: 1 },
    ],
  },
  {
    name: 'should handle double edged nodes and edges',
    input: 'graph TD;\nA<-->B;',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'double_arrow_point', text: '', stroke: 'normal', length: 1 },
    ],
  },
  {
    name: 'should handle double edged nodes with text',
    input: 'graph TD;\nA<-- text -->B;',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      {
        start: 'A',
        end: 'B',
        type: 'double_arrow_point',
        text: 'text',
        stroke: 'normal',
        length: 1,
      },
    ],
  },
  {
    name: 'should handle double edged nodes and edges on thick arrows',
    input: 'graph TD;\nA<==>B;',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'double_arrow_point', text: '', stroke: 'thick', length: 1 },
    ],
  },
  {
    name: 'should handle double edged nodes with text on thick arrows',
    input: 'graph TD;\nA<== text ==>B;',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      {
        start: 'A',
        end: 'B',
        type: 'double_arrow_point',
        text: 'text',
        stroke: 'thick',
        length: 1,
      },
    ],
  },
  {
    name: 'should handle double edged nodes and edges on dotted arrows',
    input: 'graph TD;\nA<-.->B;',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'double_arrow_point', text: '', stroke: 'dotted', length: 1 },
    ],
  },
  {
    name: 'should handle double edged nodes with text on dotted arrows',
    input: 'graph TD;\nA<-. text .->B;',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      {
        start: 'A',
        end: 'B',
        type: 'double_arrow_point',
        text: 'text',
        stroke: 'dotted',
        length: 1,
      },
    ],
  },
];

// Parser types to test
const parserTypes = ['jison', 'antlr', 'lark'];

// Results storage
const testResults = {
  jison: { passed: 0, failed: 0, errors: [] },
  antlr: { passed: 0, failed: 0, errors: [] },
  lark: { passed: 0, failed: 0, errors: [] },
};

describe('Combined Flow Arrows Test - All Three Parsers', () => {
  console.log('🚀 Starting comprehensive arrow test comparison across all parsers');
  console.log(`📊 Testing ${arrowTestCases.length} test cases with ${parserTypes.length} parsers`);

  // Test each parser type
  parserTypes.forEach((parserType) => {
    describe(`${parserType.toUpperCase()} Parser Arrow Tests`, () => {
      let parser;

      beforeAll(async () => {
        try {
          parser = await getFlowchartParser(parserType);
          console.log(`✅ ${parserType.toUpperCase()} parser loaded successfully`);
        } catch (error) {
          console.log(`❌ Failed to load ${parserType.toUpperCase()} parser: ${error.message}`);
          parser = null;
        }
      });

      beforeEach(() => {
        if (parser && parser.yy) {
          // Use safe method calls with fallbacks
          if (typeof parser.yy.clear === 'function') {
            parser.yy.clear();
          }
          if (typeof parser.yy.setGen === 'function') {
            parser.yy.setGen('gen-2');
          }
        }
      });

      // Run each test case
      arrowTestCases.forEach((testCase, index) => {
        it(`${testCase.name} (${parserType})`, () => {
          if (!parser) {
            testResults[parserType].failed++;
            testResults[parserType].errors.push({
              test: testCase.name,
              error: 'Parser not available',
            });
            throw new Error(`${parserType.toUpperCase()} parser not available`);
          }

          try {
            // Parse the input
            parser.parse(testCase.input);

            // Get results
            const vertices = parser.yy.getVertices();
            const edges = parser.yy.getEdges();
            const direction = parser.yy.getDirection ? parser.yy.getDirection() : null;

            // Verify vertices with flexible access
            testCase.expectedVertices.forEach((expectedVertexId) => {
              let vertex;

              // Try different ways to access vertices based on data structure
              if (vertices && typeof vertices.get === 'function') {
                // Map-like interface
                vertex = vertices.get(expectedVertexId);
              } else if (vertices && typeof vertices === 'object') {
                // Object-like interface
                vertex = vertices[expectedVertexId];
              } else if (Array.isArray(vertices)) {
                // Array interface
                vertex = vertices.find((v) => v.id === expectedVertexId);
              }

              expect(vertex).toBeDefined();
              if (vertex && vertex.id) {
                expect(vertex.id).toBe(expectedVertexId);
              }
            });

            // Verify edges
            expect(edges.length).toBe(testCase.expectedEdges.length);

            testCase.expectedEdges.forEach((expectedEdge, edgeIndex) => {
              const actualEdge = edges[edgeIndex];
              expect(actualEdge.start).toBe(expectedEdge.start);
              expect(actualEdge.end).toBe(expectedEdge.end);
              expect(actualEdge.type).toBe(expectedEdge.type);
              expect(actualEdge.text).toBe(expectedEdge.text);
              expect(actualEdge.stroke).toBe(expectedEdge.stroke);
              expect(actualEdge.length).toBe(expectedEdge.length);
            });

            // Verify direction if expected
            if (testCase.expectedDirection) {
              expect(direction).toBe(testCase.expectedDirection);
            }

            testResults[parserType].passed++;
            console.log(`✅ ${parserType.toUpperCase()}: ${testCase.name}`);
          } catch (error) {
            testResults[parserType].failed++;
            testResults[parserType].errors.push({
              test: testCase.name,
              error: error.message,
            });
            console.log(`❌ ${parserType.toUpperCase()}: ${testCase.name} - ${error.message}`);
            throw error;
          }
        });
      });
    });
  });

  // Summary test that runs after all parser tests
  describe('Parser Comparison Summary', () => {
    it('should provide comprehensive comparison results', () => {
      console.log('\n' + '='.repeat(80));
      console.log('🔍 COMBINED FLOW ARROWS TEST RESULTS');
      console.log('Comprehensive comparison across all three parsers');
      console.log('='.repeat(80));

      console.log(`\n📊 OVERALL RESULTS (${arrowTestCases.length} test cases):`);

      parserTypes.forEach((parserType) => {
        const result = testResults[parserType];
        const total = result.passed + result.failed;
        const successRate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0.0';

        console.log(`\n${parserType.toUpperCase()} PARSER:`);
        console.log(`  ✅ Passed: ${result.passed}/${total} (${successRate}%)`);
        console.log(`  ❌ Failed: ${result.failed}/${total}`);

        if (result.errors.length > 0) {
          console.log(`  🔍 Error Summary:`);
          const errorCounts = {};
          result.errors.forEach((error) => {
            errorCounts[error.error] = (errorCounts[error.error] || 0) + 1;
          });

          Object.entries(errorCounts).forEach(([errorMsg, count]) => {
            console.log(`    • ${errorMsg}: ${count} cases`);
          });
        }
      });

      // Performance ranking
      console.log('\n🏆 SUCCESS RATE RANKING:');
      const sortedResults = parserTypes
        .map((type) => ({
          parser: type,
          successRate:
            (testResults[type].passed / (testResults[type].passed + testResults[type].failed)) *
            100,
          passed: testResults[type].passed,
          total: testResults[type].passed + testResults[type].failed,
        }))
        .sort((a, b) => b.successRate - a.successRate);

      sortedResults.forEach((result, index) => {
        console.log(
          `${index + 1}. ${result.parser.toUpperCase()}: ${result.successRate.toFixed(1)}% (${result.passed}/${result.total})`
        );
      });

      // Recommendations
      console.log('\n💡 RECOMMENDATIONS:');
      const bestParser = sortedResults[0];
      if (bestParser.successRate === 100) {
        console.log(
          `🏆 PERFECT COMPATIBILITY: ${bestParser.parser.toUpperCase()} parser passes all arrow tests!`
        );
      } else if (bestParser.successRate > 80) {
        console.log(
          `🎯 BEST CHOICE: ${bestParser.parser.toUpperCase()} parser with ${bestParser.successRate.toFixed(1)}% success rate`
        );
      } else {
        console.log(
          `⚠️ ALL PARSERS HAVE ISSUES: Best is ${bestParser.parser.toUpperCase()} with only ${bestParser.successRate.toFixed(1)}% success`
        );
      }

      console.log('\n🎉 COMBINED ARROW TEST COMPLETE!');
      console.log(`Total test cases: ${arrowTestCases.length}`);
      console.log(`Parsers tested: ${parserTypes.length}`);
      console.log(`Total test executions: ${arrowTestCases.length * parserTypes.length}`);

      // The test should pass - we're just collecting data
      expect(true).toBe(true);
    });
  });
});
