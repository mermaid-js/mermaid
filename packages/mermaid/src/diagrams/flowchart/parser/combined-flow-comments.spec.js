/**
 * Combined Flow Comments Test - All Three Parsers
 *
 * This test runs all comment test cases from flow-comments.spec.js against
 * Jison, ANTLR, and Lark parsers to compare their behavior and compatibility.
 */

import { FlowDB } from '../flowDb.js';
import { getFlowchartParser } from './parserFactory.js';
import { setConfig } from '../../../config.js';
import { cleanupComments } from '../../../diagram-api/comments.js';

setConfig({
  securityLevel: 'strict',
});

// Test cases extracted from flow-comments.spec.js
const commentTestCases = [
  {
    name: 'should handle comments',
    input: 'graph TD;\n%% Comment\n A-->B;',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle comments at the start',
    input: '%% Comment\ngraph TD;\n A-->B;',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle comments at the end',
    input: 'graph TD;\n A-->B\n %% Comment at the end\n',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle comments at the end no trailing newline',
    input: 'graph TD;\n A-->B\n%% Comment',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle comments at the end many trailing newlines',
    input: 'graph TD;\n A-->B\n%% Comment\n\n\n',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle no trailing newlines',
    input: 'graph TD;\n A-->B',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle many trailing newlines',
    input: 'graph TD;\n A-->B\n\n',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle a comment with blank rows in-between',
    input: 'graph TD;\n\n\n %% Comment\n A-->B;',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle a comment with mermaid flowchart code in them',
    input: 'graph TD;\n\n\n %% Test od>Odd shape]-->|Two line<br>edge comment|ro;\n A-->B;',
    expectedVertices: ['A', 'B'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '' },
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

describe('Combined Flow Comments Test - All Three Parsers', () => {
  console.log('🚀 Starting comprehensive comment test comparison across all parsers');
  console.log(`📊 Testing ${commentTestCases.length} test cases with ${parserTypes.length} parsers`);

  // Test each parser type
  parserTypes.forEach((parserType) => {
    describe(`${parserType.toUpperCase()} Parser Comment Tests`, () => {
      let parser;

      beforeAll(async () => {
        try {
          console.log(`🔍 FACTORY: Requesting ${parserType} parser`);
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
      commentTestCases.forEach((testCase, index) => {
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
            // Parse the input with comment cleanup
            const cleanedInput = cleanupComments(testCase.input);
            parser.parse(cleanedInput);

            // Get results
            const vertices = parser.yy.getVertices();
            const edges = parser.yy.getEdges();

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
            });

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
      console.log('🔍 COMBINED FLOW COMMENTS TEST RESULTS');
      console.log('='.repeat(80));

      let totalTests = 0;
      let totalPassed = 0;
      let totalFailed = 0;

      parserTypes.forEach((parserType) => {
        const results = testResults[parserType];
        totalTests += results.passed + results.failed;
        totalPassed += results.passed;
        totalFailed += results.failed;

        const successRate = results.passed + results.failed > 0 
          ? ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
          : '0.0';

        console.log(`\n📊 ${parserType.toUpperCase()} Parser Results:`);
        console.log(`   ✅ Passed: ${results.passed}/${results.passed + results.failed} (${successRate}%)`);
        console.log(`   ❌ Failed: ${results.failed}`);

        if (results.errors.length > 0) {
          console.log(`   🚨 Errors:`);
          results.errors.forEach((error, index) => {
            console.log(`      ${index + 1}. ${error.test}: ${error.error}`);
          });
        }
      });

      console.log('\n' + '='.repeat(80));
      console.log('📈 OVERALL RESULTS');
      console.log('='.repeat(80));
      console.log(`Total Tests: ${totalTests}`);
      console.log(`Total Passed: ${totalPassed}`);
      console.log(`Total Failed: ${totalFailed}`);
      console.log(`Overall Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0'}%`);

      // Check if all parsers achieved 100% success
      const allParsersSuccess = parserTypes.every(
        (parserType) => testResults[parserType].failed === 0 && testResults[parserType].passed > 0
      );

      if (allParsersSuccess) {
        console.log('\n🎉 SUCCESS: All parsers achieved 100% compatibility!');
        console.log('🚀 All three parsers (JISON, ANTLR, LARK) handle comments identically!');
      } else {
        console.log('\n⚠️  Some parsers have compatibility issues with comment handling.');
        
        // Identify which parsers have issues
        parserTypes.forEach((parserType) => {
          const results = testResults[parserType];
          if (results.failed > 0) {
            console.log(`   🔴 ${parserType.toUpperCase()}: ${results.failed} failed tests`);
          } else if (results.passed === 0) {
            console.log(`   🔴 ${parserType.toUpperCase()}: No tests passed (parser may not be available)`);
          }
        });
      }

      console.log('='.repeat(80));

      // The test should pass regardless of individual parser results
      // This is an informational summary
      expect(true).toBe(true);
    });
  });
});
