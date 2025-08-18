/**
 * Combined Flow Style Test - All Three Parsers
 * Tests style and class definitions across JISON, ANTLR, and LARK parsers
 */

import { getFlowchartParser } from './parserFactory.js';
import { setConfig } from '../../../config.js';
import { describe, it, expect, beforeEach } from 'vitest';

// Test configuration
setConfig({
  securityLevel: 'strict',
});

console.log('🚀 Starting comprehensive style parsing test comparison across all parsers');

// Test data for style parsing
const styleTests = [
  {
    name: 'basic node style',
    input: 'graph TD;style Q background:#fff;',
    expectedNodeId: 'Q',
    expectedStyles: ['background:#fff']
  },
  {
    name: 'multiple styles for a node',
    input: 'graph TD;style R background:#fff,border:1px solid red;',
    expectedNodeId: 'R',
    expectedStyles: ['background:#fff', 'border:1px solid red']
  },
  {
    name: 'multiple nodes with styles',
    input: 'graph TD;style S background:#aaa;\nstyle T background:#bbb,border:1px solid red;',
    expectedNodes: {
      'S': ['background:#aaa'],
      'T': ['background:#bbb', 'border:1px solid red']
    }
  },
  {
    name: 'styles with graph definitions',
    input: 'graph TD;S-->T;\nstyle S background:#aaa;\nstyle T background:#bbb,border:1px solid red;',
    expectedNodes: {
      'S': ['background:#aaa'],
      'T': ['background:#bbb', 'border:1px solid red']
    },
    expectedEdges: 1
  },
  {
    name: 'class definition',
    input: 'graph TD;classDef exClass background:#bbb,border:1px solid red;',
    expectedClass: 'exClass',
    expectedClassStyles: ['background:#bbb', 'border:1px solid red']
  },
  {
    name: 'multiple class definitions',
    input: 'graph TD;classDef firstClass,secondClass background:#bbb,border:1px solid red;',
    expectedClasses: {
      'firstClass': ['background:#bbb', 'border:1px solid red'],
      'secondClass': ['background:#bbb', 'border:1px solid red']
    }
  },
  {
    name: 'class application to node',
    input: 'graph TD;\nclassDef exClass background:#bbb,border:1px solid red;\na-->b;\nclass a exClass;',
    expectedClass: 'exClass',
    expectedClassStyles: ['background:#bbb', 'border:1px solid red'],
    expectedNodeClass: { nodeId: 'a', className: 'exClass' }
  },
  {
    name: 'direct class application with :::',
    input: 'graph TD;\nclassDef exClass background:#bbb,border:1px solid red;\na-->b[test]:::exClass;',
    expectedClass: 'exClass',
    expectedClassStyles: ['background:#bbb', 'border:1px solid red'],
    expectedNodeClass: { nodeId: 'b', className: 'exClass' }
  }
];

// Parser types to test
const parsers = ['jison', 'antlr', 'lark'];

describe('Combined Flow Style Test - All Three Parsers', () => {
  beforeEach(() => {
    setConfig({
      securityLevel: 'strict',
    });
  });

  console.log('📊 Testing style parsing with 3 parsers');

  // Test results tracking
  const testResults = {
    jison: { passed: 0, failed: 0, errors: [] },
    antlr: { passed: 0, failed: 0, errors: [] },
    lark: { passed: 0, failed: 0, errors: [] }
  };

  // Generate tests for each parser and test case
  parsers.forEach((parserType) => {
    describe(`${parserType.toUpperCase()} Parser Style Tests`, () => {
      styleTests.forEach((testCase) => {
        it(`should handle ${testCase.name} (${parserType})`, async () => {
          const parser = await getFlowchartParser(parserType);
          const flowDb = parser.yy;
          
          flowDb.clear();
          flowDb.setGen('gen-2');
          
          try {
            parser.parse(testCase.input);
            
            const vertices = flowDb.getVertices();
            const edges = flowDb.getEdges();
            const classes = flowDb.getClasses();
            
            // Test single node styles
            if (testCase.expectedNodeId && testCase.expectedStyles) {
              expect(vertices.has(testCase.expectedNodeId)).toBe(true);
              const node = vertices.get(testCase.expectedNodeId);
              expect(node.styles.length).toBe(testCase.expectedStyles.length);
              testCase.expectedStyles.forEach((style, index) => {
                expect(node.styles[index]).toBe(style);
              });
            }
            
            // Test multiple node styles
            if (testCase.expectedNodes) {
              Object.entries(testCase.expectedNodes).forEach(([nodeId, expectedStyles]) => {
                expect(vertices.has(nodeId)).toBe(true);
                const node = vertices.get(nodeId);
                expect(node.styles.length).toBe(expectedStyles.length);
                expectedStyles.forEach((style, index) => {
                  expect(node.styles[index]).toBe(style);
                });
              });
            }
            
            // Test class definitions
            if (testCase.expectedClass && testCase.expectedClassStyles) {
              expect(classes.has(testCase.expectedClass)).toBe(true);
              const classObj = classes.get(testCase.expectedClass);
              expect(classObj.styles.length).toBe(testCase.expectedClassStyles.length);
              testCase.expectedClassStyles.forEach((style, index) => {
                expect(classObj.styles[index]).toBe(style);
              });
            }
            
            // Test multiple class definitions
            if (testCase.expectedClasses) {
              Object.entries(testCase.expectedClasses).forEach(([className, expectedStyles]) => {
                expect(classes.has(className)).toBe(true);
                const classObj = classes.get(className);
                expect(classObj.styles.length).toBe(expectedStyles.length);
                expectedStyles.forEach((style, index) => {
                  expect(classObj.styles[index]).toBe(style);
                });
              });
            }
            
            // Test node class applications
            if (testCase.expectedNodeClass) {
              const { nodeId, className } = testCase.expectedNodeClass;
              expect(vertices.has(nodeId)).toBe(true);
              const node = vertices.get(nodeId);
              expect(node.classes.length).toBeGreaterThan(0);
              expect(node.classes[0]).toBe(className);
            }
            
            // Test edge count
            if (testCase.expectedEdges !== undefined) {
              expect(edges.length).toBe(testCase.expectedEdges);
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

  describe('Parser Style Comparison Summary', () => {
    it('should provide comprehensive style comparison results', () => {
      console.log('\n📊 COMPREHENSIVE STYLE PARSING COMPARISON RESULTS:');
      console.log('================================================================================');
      
      Object.entries(testResults).forEach(([parserName, results]) => {
        const total = results.passed + results.failed;
        const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0.0';
        
        console.log(`\n🔧 ${parserName.toUpperCase()} Parser:`);
        console.log(`   ✅ Passed: ${results.passed}/${styleTests.length}`);
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
