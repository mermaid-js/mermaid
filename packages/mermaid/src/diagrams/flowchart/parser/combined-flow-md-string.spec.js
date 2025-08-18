/**
 * Combined Flow Markdown String Test - All Three Parsers
 *
 * This test compares markdown string formatting across JISON, ANTLR, and LARK parsers
 * for flowchart diagrams including backtick-delimited markdown in nodes, edges, and subgraphs.
 *
 * Original test: flow-md-string.spec.js
 * Migration: Tests all three parsers with comprehensive markdown string scenarios
 *
 * IMPLEMENTATION STATUS:
 * - JISON: ✅ Full markdown support (reference implementation)
 * - ANTLR: ✅ Markdown features IMPLEMENTED (comprehensive visitor methods)
 * - LARK: ✅ Markdown features IMPLEMENTED (full parsing support)
 *
 * All three parsers should now handle markdown string features identically.
 */

import { FlowDB } from '../flowDb.js';
import { getFlowchartParser } from './parserFactory.js';
import { setConfig } from '../../../config.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

console.log('🚀 Starting comprehensive markdown string test comparison across all parsers');

// Test results tracking
const testResults = {
  jison: { passed: 0, failed: 0, errors: [] },
  antlr: { passed: 0, failed: 0, errors: [] },
  lark: { passed: 0, failed: 0, errors: [] }
};

// Helper function to run tests with a specific parser
async function runWithParser(parserType, testFn) {
  const parser = await getFlowchartParser(parserType);
  return testFn(parser);
}

// Helper function to track test results
function trackResult(parserType, success, error = null) {
  if (success) {
    testResults[parserType].passed++;
  } else {
    testResults[parserType].failed++;
    if (error) {
      testResults[parserType].errors.push(error.message || error.toString());
    }
  }
}

describe('Combined Flow Markdown String Test - All Three Parsers', () => {
  console.log('📊 Testing markdown string parsing with 3 parsers');

  // Set security configuration for tests
  beforeEach(() => {
    setConfig({
      securityLevel: 'strict',
    });
  });

  // Test each parser with markdown formatting in nodes and labels
  describe('JISON Parser Markdown Tests', () => {
    it('should handle markdown formatting in nodes and labels (jison)', async () => {
      await runWithParser('jison', (parser) => {
        try {
          const flowDb = parser.yy;
          flowDb.clear();

          parser.parse(`flowchart
A["\`The cat in **the** hat\`"]-- "\`The *bat* in the chat\`" -->B["The dog in the hog"] -- "The rat in the mat" -->C;`);
          
          const vert = flowDb.getVertices();
          const edges = flowDb.getEdges();

          // Test node A (markdown)
          expect(vert.get('A').id).toBe('A');
          expect(vert.get('A').text).toBe('The cat in **the** hat');
          expect(vert.get('A').labelType).toBe('markdown');
          
          // Test node B (string)
          expect(vert.get('B').id).toBe('B');
          expect(vert.get('B').text).toBe('The dog in the hog');
          expect(vert.get('B').labelType).toBe('string');
          
          // Test edges
          expect(edges.length).toBe(2);
          expect(edges[0].start).toBe('A');
          expect(edges[0].end).toBe('B');
          expect(edges[0].type).toBe('arrow_point');
          expect(edges[0].text).toBe('The *bat* in the chat');
          expect(edges[0].labelType).toBe('markdown');
          expect(edges[1].start).toBe('B');
          expect(edges[1].end).toBe('C');
          expect(edges[1].type).toBe('arrow_point');
          expect(edges[1].text).toBe('The rat in the mat');
          expect(edges[1].labelType).toBe('string');
          
          trackResult('jison', true);
        } catch (error) {
          trackResult('jison', false, error);
          throw error;
        }
      });
    });

    it('should handle markdown formatting in subgraphs (jison)', async () => {
      await runWithParser('jison', (parser) => {
        try {
          const flowDb = parser.yy;
          flowDb.clear();

          parser.parse(`flowchart LR
subgraph "One"
  a("\`The **cat**
  in the hat\`") -- "1o" --> b{{"\`The **dog** in the hog\`"}}
end
subgraph "\`**Two**\`"
  c("\`The **cat**
  in the hat\`") -- "\`1o **ipa**\`" --> d("The dog in the hog")
end`);
          
          const subgraphs = flowDb.getSubGraphs();
          expect(subgraphs.length).toBe(2);
          
          const subgraph = subgraphs[0];
          expect(subgraph.nodes.length).toBe(2);
          expect(subgraph.title).toBe('One');
          expect(subgraph.labelType).toBe('text');

          const subgraph2 = subgraphs[1];
          expect(subgraph2.nodes.length).toBe(2);
          expect(subgraph2.title).toBe('**Two**');
          expect(subgraph2.labelType).toBe('markdown');
          
          trackResult('jison', true);
        } catch (error) {
          trackResult('jison', false, error);
          throw error;
        }
      });
    });
  });

  describe('ANTLR Parser Markdown Tests', () => {
    it('should handle markdown formatting in nodes and labels (antlr)', async () => {
      await runWithParser('antlr', (parser) => {
        try {
          const flowDb = parser.yy;
          flowDb.clear();

          parser.parse(`flowchart
A["\`The cat in **the** hat\`"]-- "\`The *bat* in the chat\`" -->B["The dog in the hog"] -- "The rat in the mat" -->C;`);
          
          const vert = flowDb.getVertices();
          const edges = flowDb.getEdges();

          // Test node A (markdown)
          expect(vert.get('A').id).toBe('A');
          expect(vert.get('A').text).toBe('The cat in **the** hat');
          expect(vert.get('A').labelType).toBe('markdown');
          
          // Test node B (string)
          expect(vert.get('B').id).toBe('B');
          expect(vert.get('B').text).toBe('The dog in the hog');
          expect(vert.get('B').labelType).toBe('string');
          
          // Test edges
          expect(edges.length).toBe(2);
          expect(edges[0].start).toBe('A');
          expect(edges[0].end).toBe('B');
          expect(edges[0].type).toBe('arrow_point');
          expect(edges[0].text).toBe('The *bat* in the chat');
          expect(edges[0].labelType).toBe('markdown');
          expect(edges[1].start).toBe('B');
          expect(edges[1].end).toBe('C');
          expect(edges[1].type).toBe('arrow_point');
          expect(edges[1].text).toBe('The rat in the mat');
          expect(edges[1].labelType).toBe('string');
          
          trackResult('antlr', true);
        } catch (error) {
          trackResult('antlr', false, error);
          throw error;
        }
      });
    });

    it('should handle markdown formatting in subgraphs (antlr)', async () => {
      await runWithParser('antlr', (parser) => {
        try {
          const flowDb = parser.yy;
          flowDb.clear();

          parser.parse(`flowchart LR
subgraph "One"
  a("\`The **cat**
  in the hat\`") -- "1o" --> b{{"\`The **dog** in the hog\`"}}
end
subgraph "\`**Two**\`"
  c("\`The **cat**
  in the hat\`") -- "\`1o **ipa**\`" --> d("The dog in the hog")
end`);
          
          const subgraphs = flowDb.getSubGraphs();
          expect(subgraphs.length).toBe(2);
          
          const subgraph = subgraphs[0];
          expect(subgraph.nodes.length).toBe(2);
          expect(subgraph.title).toBe('One');
          expect(subgraph.labelType).toBe('text');

          const subgraph2 = subgraphs[1];
          expect(subgraph2.nodes.length).toBe(2);
          expect(subgraph2.title).toBe('**Two**');
          expect(subgraph2.labelType).toBe('markdown');
          
          trackResult('antlr', true);
        } catch (error) {
          trackResult('antlr', false, error);
          throw error;
        }
      });
    });
  });

  describe('LARK Parser Markdown Tests', () => {
    it('should handle markdown formatting in nodes and labels (lark)', async () => {
      await runWithParser('lark', (parser) => {
        try {
          const flowDb = parser.yy;
          flowDb.clear();

          parser.parse(`flowchart
A["\`The cat in **the** hat\`"]-- "\`The *bat* in the chat\`" -->B["The dog in the hog"] -- "The rat in the mat" -->C;`);
          
          const vert = flowDb.getVertices();
          const edges = flowDb.getEdges();

          // Test node A (markdown)
          expect(vert.get('A').id).toBe('A');
          expect(vert.get('A').text).toBe('The cat in **the** hat');
          expect(vert.get('A').labelType).toBe('markdown');
          
          // Test node B (string)
          expect(vert.get('B').id).toBe('B');
          expect(vert.get('B').text).toBe('The dog in the hog');
          expect(vert.get('B').labelType).toBe('string');
          
          // Test edges
          expect(edges.length).toBe(2);
          expect(edges[0].start).toBe('A');
          expect(edges[0].end).toBe('B');
          expect(edges[0].type).toBe('arrow_point');
          expect(edges[0].text).toBe('The *bat* in the chat');
          expect(edges[0].labelType).toBe('markdown');
          expect(edges[1].start).toBe('B');
          expect(edges[1].end).toBe('C');
          expect(edges[1].type).toBe('arrow_point');
          expect(edges[1].text).toBe('The rat in the mat');
          expect(edges[1].labelType).toBe('string');
          
          trackResult('lark', true);
        } catch (error) {
          trackResult('lark', false, error);
          throw error;
        }
      });
    });

    it('should handle markdown formatting in subgraphs (lark)', async () => {
      await runWithParser('lark', (parser) => {
        try {
          const flowDb = parser.yy;
          flowDb.clear();

          parser.parse(`flowchart LR
subgraph "One"
  a("\`The **cat**
  in the hat\`") -- "1o" --> b{{"\`The **dog** in the hog\`"}}
end
subgraph "\`**Two**\`"
  c("\`The **cat**
  in the hat\`") -- "\`1o **ipa**\`" --> d("The dog in the hog")
end`);
          
          const subgraphs = flowDb.getSubGraphs();
          expect(subgraphs.length).toBe(2);
          
          const subgraph = subgraphs[0];
          expect(subgraph.nodes.length).toBe(2);
          expect(subgraph.title).toBe('One');
          expect(subgraph.labelType).toBe('text');

          const subgraph2 = subgraphs[1];
          expect(subgraph2.nodes.length).toBe(2);
          expect(subgraph2.title).toBe('**Two**');
          expect(subgraph2.labelType).toBe('markdown');
          
          trackResult('lark', true);
        } catch (error) {
          trackResult('lark', false, error);
          throw error;
        }
      });
    });
  });

  describe('Parser Markdown Comparison Summary', () => {
    it('should provide comprehensive markdown comparison results', () => {
      console.log('\n📊 COMPREHENSIVE MARKDOWN STRING PARSING COMPARISON RESULTS:');
      console.log('='.repeat(80));
      
      Object.entries(testResults).forEach(([parser, results]) => {
        const total = results.passed + results.failed;
        const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0.0';
        
        console.log(`\n🔧 ${parser.toUpperCase()} Parser:`);
        console.log(`   ✅ Passed: ${results.passed}`);
        console.log(`   ❌ Failed: ${results.failed}`);
        console.log(`   📈 Success Rate: ${successRate}%`);
        
        if (results.errors.length > 0) {
          console.log(`   🚨 Errors: ${results.errors.slice(0, 3).join(', ')}${results.errors.length > 3 ? '...' : ''}`);
        }
      });
      
      console.log('\n' + '='.repeat(80));
      
      // This test always passes - it's just for reporting
      expect(true).toBe(true);
    });
  });
});
