/**
 * Combined Flow Single Node Test - All Three Parsers
 * Tests single node parsing across JISON, ANTLR, and LARK parsers
 */

import { getFlowchartParser } from './parserFactory.js';
import { setConfig } from '../../../config.js';
import { describe, it, expect, beforeEach } from 'vitest';

// Test configuration
setConfig({
  securityLevel: 'strict',
});

console.log('🚀 Starting comprehensive single node parsing test comparison across all parsers');

// Test data for single node parsing
const singleNodeTests = [
  {
    name: 'basic single node',
    input: 'graph TD;A;',
    expectedNodes: 1,
    expectedNodeId: 'A',
    expectedEdges: 0
  },
  {
    name: 'single node with whitespace',
    input: 'graph TD;A ;',
    expectedNodes: 1,
    expectedNodeId: 'A',
    expectedEdges: 0
  },
  {
    name: 'single square node',
    input: 'graph TD;a[A];',
    expectedNodes: 1,
    expectedNodeId: 'a',
    expectedNodeType: 'square',
    expectedNodeText: 'A',
    expectedEdges: 0
  },
  {
    name: 'single circle node',
    input: 'graph TD;a((A));',
    expectedNodes: 1,
    expectedNodeId: 'a',
    expectedNodeType: 'circle',
    expectedNodeText: 'A',
    expectedEdges: 0
  },
  {
    name: 'single round node',
    input: 'graph TD;a(A);',
    expectedNodes: 1,
    expectedNodeId: 'a',
    expectedNodeType: 'round',
    expectedNodeText: 'A',
    expectedEdges: 0
  },
  {
    name: 'single diamond node',
    input: 'graph TD;a{A};',
    expectedNodes: 1,
    expectedNodeId: 'a',
    expectedNodeType: 'diamond',
    expectedNodeText: 'A',
    expectedEdges: 0
  },
  {
    name: 'single hexagon node',
    input: 'graph TD;a{{A}};',
    expectedNodes: 1,
    expectedNodeId: 'a',
    expectedNodeType: 'hexagon',
    expectedNodeText: 'A',
    expectedEdges: 0
  },
  {
    name: 'single double circle node',
    input: 'graph TD;a(((A)));',
    expectedNodes: 1,
    expectedNodeId: 'a',
    expectedNodeType: 'doublecircle',
    expectedNodeText: 'A',
    expectedEdges: 0
  }
];

// Parser types to test
const parsers = ['jison', 'antlr', 'lark'];

describe('Combined Flow Single Node Test - All Three Parsers', () => {
  beforeEach(() => {
    setConfig({
      securityLevel: 'strict',
    });
  });

  console.log('📊 Testing single node parsing with 3 parsers');

  // Test results tracking
  const testResults = {
    jison: { passed: 0, failed: 0, errors: [] },
    antlr: { passed: 0, failed: 0, errors: [] },
    lark: { passed: 0, failed: 0, errors: [] }
  };

  // Generate tests for each parser and test case
  parsers.forEach((parserType) => {
    describe(`${parserType.toUpperCase()} Parser Single Node Tests`, () => {
      singleNodeTests.forEach((testCase) => {
        it(`should handle ${testCase.name} (${parserType})`, async () => {
          const parser = await getFlowchartParser(parserType);
          const flowDb = parser.yy;
          
          flowDb.clear();
          
          try {
            parser.parse(testCase.input);
            
            const vertices = flowDb.getVertices();
            const edges = flowDb.getEdges();
            
            expect(vertices.size).toBe(testCase.expectedNodes);
            expect(edges.length).toBe(testCase.expectedEdges);
            
            if (testCase.expectedNodeId) {
              expect(vertices.has(testCase.expectedNodeId)).toBe(true);
              const node = vertices.get(testCase.expectedNodeId);
              
              if (testCase.expectedNodeType) {
                expect(node.type).toBe(testCase.expectedNodeType);
              }
              if (testCase.expectedNodeText) {
                expect(node.text).toBe(testCase.expectedNodeText);
              }
            }
            
            testResults[parserType].passed++;
          } catch (error) {
            testResults[parserType].failed++;
            testResults[parserType].errors.push(`${testCase.name}: ${error.message}`);
            throw error;
          }
        });
      });
    });
  });

  describe('Parser Single Node Comparison Summary', () => {
    it('should provide comprehensive single node comparison results', () => {
      console.log('\n📊 COMPREHENSIVE SINGLE NODE PARSING COMPARISON RESULTS:');
      console.log('================================================================================');
      
      Object.entries(testResults).forEach(([parserName, results]) => {
        const total = results.passed + results.failed;
        const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0.0';
        
        console.log(`\n🔧 ${parserName.toUpperCase()} Parser:`);
        console.log(`   ✅ Passed: ${results.passed}/${singleNodeTests.length}`);
        console.log(`   ❌ Failed: ${results.failed}`);
        console.log(`   📈 Success Rate: ${successRate}%`);
        
        if (results.errors.length > 0) {
          console.log(`   🚨 Errors: ${results.errors.slice(0, 3).join(', ')}${results.errors.length > 3 ? '...' : ''}`);
        }
      });
      
      console.log('\n================================================================================');
      
      // This test always passes - it's just for reporting
      expect(true).toBe(true);
    });
  });
});
