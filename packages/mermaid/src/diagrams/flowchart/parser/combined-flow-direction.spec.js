/**
 * Combined Flow Direction Test - All Three Parsers
 *
 * This test runs all direction test cases from flow-direction.spec.js against
 * Jison, ANTLR, and Lark parsers to compare their behavior and compatibility.
 */

import { FlowDB } from '../flowDb.js';
import { getFlowchartParser } from './parserFactory.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

// Test cases extracted from flow-direction.spec.js
const directionTestCases = [
  {
    name: 'should use default direction from top level',
    input: `flowchart TB
    subgraph A
      a --> b
    end`,
    expectedSubgraphs: [
      {
        id: 'A',
        nodes: ['b', 'a'],
        dir: undefined,
      },
    ],
  },
  {
    name: 'should handle a subgraph with a direction',
    input: `flowchart TB
    subgraph A
      direction BT
      a --> b
    end`,
    expectedSubgraphs: [
      {
        id: 'A',
        nodes: ['b', 'a'],
        dir: 'BT',
      },
    ],
  },
  {
    name: 'should use the last defined direction',
    input: `flowchart TB
    subgraph A
      direction BT
      a --> b
      direction RL
    end`,
    expectedSubgraphs: [
      {
        id: 'A',
        nodes: ['b', 'a'],
        dir: 'RL',
      },
    ],
  },
  {
    name: 'should handle nested subgraphs 1',
    input: `flowchart TB
    subgraph A
      direction RL
      b-->B
      a
    end
    a-->c
    subgraph B
      direction LR
      c
    end`,
    expectedSubgraphs: [
      {
        id: 'A',
        nodes: ['B', 'b', 'a'],
        dir: 'RL',
        shouldContain: ['B', 'b', 'a'],
        shouldNotContain: ['c'],
      },
      {
        id: 'B',
        nodes: ['c'],
        dir: 'LR',
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

describe('Combined Flow Direction Test - All Three Parsers', () => {
  console.log('🚀 Starting comprehensive direction test comparison across all parsers');
  console.log(`📊 Testing ${directionTestCases.length} test cases with ${parserTypes.length} parsers`);

  // Test each parser type
  parserTypes.forEach((parserType) => {
    describe(`${parserType.toUpperCase()} Parser Direction Tests`, () => {
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
      directionTestCases.forEach((testCase, index) => {
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

            // Get subgraphs
            const subgraphs = parser.yy.getSubGraphs();

            // Verify number of subgraphs
            expect(subgraphs.length).toBe(testCase.expectedSubgraphs.length);

            // Verify each expected subgraph
            testCase.expectedSubgraphs.forEach((expectedSubgraph) => {
              const actualSubgraph = subgraphs.find((sg) => sg.id === expectedSubgraph.id);
              expect(actualSubgraph).toBeDefined();

              // Verify subgraph ID
              expect(actualSubgraph.id).toBe(expectedSubgraph.id);

              // Verify direction
              expect(actualSubgraph.dir).toBe(expectedSubgraph.dir);

              // Verify nodes count
              expect(actualSubgraph.nodes.length).toBe(expectedSubgraph.nodes.length);

              // For complex node verification (like nested subgraphs)
              if (expectedSubgraph.shouldContain) {
                expectedSubgraph.shouldContain.forEach((nodeId) => {
                  expect(actualSubgraph.nodes).toContain(nodeId);
                });
              }

              if (expectedSubgraph.shouldNotContain) {
                expectedSubgraph.shouldNotContain.forEach((nodeId) => {
                  expect(actualSubgraph.nodes).not.toContain(nodeId);
                });
              }

              // For simple node verification
              if (!expectedSubgraph.shouldContain && !expectedSubgraph.shouldNotContain) {
                expectedSubgraph.nodes.forEach((expectedNodeId, nodeIndex) => {
                  expect(actualSubgraph.nodes[nodeIndex]).toBe(expectedNodeId);
                });
              }
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
      console.log('🔍 COMBINED FLOW DIRECTION TEST RESULTS');
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
        console.log('🚀 All three parsers (JISON, ANTLR, LARK) handle directions identically!');
      } else {
        console.log('\n⚠️  Some parsers have compatibility issues with direction handling.');
        
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
