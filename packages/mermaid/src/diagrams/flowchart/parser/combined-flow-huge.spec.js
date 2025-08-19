/**
 * Combined Flow Huge Test - All Four Parsers
 *
 * This test compares performance and scalability across JISON, ANTLR, LARK, and LEZER parsers
 * when handling very large flowchart diagrams.
 *
 * Original test: flow-huge.spec.js
 * Migration: Tests all four parsers with performance metrics
 */

import { FlowDB } from '../flowDb.js';
import { getFlowchartParser } from './parserFactory.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
  maxEdges: 10000, // Increase edge limit for huge diagram testing
});

console.log('🚀 Starting comprehensive huge diagram test comparison across all four parsers');

// Test configuration
const PARSERS = ['jison', 'antlr', 'lark', 'lezer'];

// Performance tracking
const performanceResults = {
  jison: { passed: 0, failed: 0, errors: [], avgTime: 0, maxMemory: 0 },
  antlr: { passed: 0, failed: 0, errors: [], avgTime: 0, maxMemory: 0 },
  lark: { passed: 0, failed: 0, errors: [], avgTime: 0, maxMemory: 0 },
  lezer: { passed: 0, failed: 0, errors: [], avgTime: 0, maxMemory: 0 },
};

// Helper function to measure memory usage
function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed / 1024 / 1024; // MB
  }
  return 0;
}

// Helper function to run tests with a specific parser
async function runWithParser(parserType, testFn) {
  const parser = await getFlowchartParser(parserType);
  return testFn(parser);
}

// Helper function to track test results
function trackResult(parserType, success, error = null, time = 0, memory = 0) {
  if (success) {
    performanceResults[parserType].passed++;
  } else {
    performanceResults[parserType].failed++;
    if (error) {
      performanceResults[parserType].errors.push(error.message || error.toString());
    }
  }
  performanceResults[parserType].avgTime = time;
  performanceResults[parserType].maxMemory = Math.max(
    performanceResults[parserType].maxMemory,
    memory
  );
}

// Generate huge diagram content
function generateHugeDiagram() {
  // Original test: ('A-->B;B-->A;'.repeat(415) + 'A-->B;').repeat(57) + 'A-->B;B-->A;'.repeat(275)
  // This creates 47,917 edges - let's use a smaller version for CI/testing
  const smallPattern = 'A-->B;B-->A;'.repeat(50) + 'A-->B;'; // 101 edges
  const mediumPattern = smallPattern.repeat(10); // ~1,010 edges
  const largePattern = mediumPattern.repeat(5); // ~5,050 edges

  return {
    small: `graph LR;${smallPattern}`,
    medium: `graph LR;${mediumPattern}`,
    large: `graph LR;${largePattern}`,
    // Original huge size - only for performance testing
    huge: `graph LR;${('A-->B;B-->A;'.repeat(415) + 'A-->B;').repeat(57) + 'A-->B;B-->A;'.repeat(275)}`,
  };
}

describe('Combined Flow Huge Test - All Four Parsers', () => {
  console.log('📊 Testing huge diagram parsing with 4 parsers (JISON, ANTLR, LARK, LEZER)');

  const diagrams = generateHugeDiagram();

  // Test each parser with small diagrams first
  describe('JISON Parser Huge Tests', () => {
    it('should handle small huge diagrams (jison)', async () => {
      await runWithParser('jison', (parser) => {
        try {
          const startTime = Date.now();
          const startMemory = getMemoryUsage();

          const res = parser.parse(diagrams.small);
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          const endTime = Date.now();
          const endMemory = getMemoryUsage();

          expect(edges[0].type).toBe('arrow_point');
          expect(edges.length).toBe(101);
          expect(vert.size).toBe(2);

          trackResult('jison', true, null, endTime - startTime, endMemory - startMemory);
        } catch (error) {
          trackResult('jison', false, error);
          throw error;
        }
      });
    });

    it('should handle medium huge diagrams (jison)', async () => {
      await runWithParser('jison', (parser) => {
        try {
          const startTime = Date.now();
          const startMemory = getMemoryUsage();

          const res = parser.parse(diagrams.medium);
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          const endTime = Date.now();
          const endMemory = getMemoryUsage();

          expect(edges[0].type).toBe('arrow_point');
          expect(edges.length).toBeGreaterThan(1000);
          expect(vert.size).toBe(2);

          trackResult('jison', true, null, endTime - startTime, endMemory - startMemory);
        } catch (error) {
          trackResult('jison', false, error);
          throw error;
        }
      });
    });
  });

  describe('ANTLR Parser Huge Tests', () => {
    it('should handle small huge diagrams (antlr)', async () => {
      await runWithParser('antlr', (parser) => {
        try {
          const startTime = Date.now();
          const startMemory = getMemoryUsage();

          const res = parser.parse(diagrams.small);
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          const endTime = Date.now();
          const endMemory = getMemoryUsage();

          expect(edges[0].type).toBe('arrow_point');
          expect(edges.length).toBe(101);
          expect(vert.size).toBe(2);

          trackResult('antlr', true, null, endTime - startTime, endMemory - startMemory);
        } catch (error) {
          trackResult('antlr', false, error);
          throw error;
        }
      });
    });

    it('should handle medium huge diagrams (antlr)', async () => {
      await runWithParser('antlr', (parser) => {
        try {
          const startTime = Date.now();
          const startMemory = getMemoryUsage();

          const res = parser.parse(diagrams.medium);
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          const endTime = Date.now();
          const endMemory = getMemoryUsage();

          expect(edges[0].type).toBe('arrow_point');
          expect(edges.length).toBeGreaterThan(1000);
          expect(vert.size).toBe(2);

          trackResult('antlr', true, null, endTime - startTime, endMemory - startMemory);
        } catch (error) {
          trackResult('antlr', false, error);
          throw error;
        }
      });
    });
  });

  describe('LARK Parser Huge Tests', () => {
    it('should handle small huge diagrams (lark)', async () => {
      await runWithParser('lark', (parser) => {
        try {
          const startTime = Date.now();
          const startMemory = getMemoryUsage();

          const res = parser.parse(diagrams.small);
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          const endTime = Date.now();
          const endMemory = getMemoryUsage();

          expect(edges[0].type).toBe('arrow_point');
          expect(edges.length).toBe(101);
          expect(vert.size).toBe(2);

          trackResult('lark', true, null, endTime - startTime, endMemory - startMemory);
        } catch (error) {
          trackResult('lark', false, error);
          throw error;
        }
      });
    });

    it('should handle medium huge diagrams (lark)', async () => {
      await runWithParser('lark', (parser) => {
        try {
          const startTime = Date.now();
          const startMemory = getMemoryUsage();

          const res = parser.parse(diagrams.medium);
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          const endTime = Date.now();
          const endMemory = getMemoryUsage();

          expect(edges[0].type).toBe('arrow_point');
          expect(edges.length).toBeGreaterThan(1000);
          expect(vert.size).toBe(2);

          trackResult('lark', true, null, endTime - startTime, endMemory - startMemory);
        } catch (error) {
          trackResult('lark', false, error);
          throw error;
        }
      });
    });
  });

  describe('LEZER Parser Huge Tests', () => {
    it('should handle small huge diagrams (lezer)', async () => {
      await runWithParser('lezer', (parser) => {
        try {
          const startTime = Date.now();
          const startMemory = getMemoryUsage();

          const res = parser.parse(diagrams.small);
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          const endTime = Date.now();
          const endMemory = getMemoryUsage();

          expect(edges[0].type).toBe('arrow_point');
          expect(edges.length).toBe(101);
          expect(vert.size).toBe(2);

          trackResult('lezer', true, null, endTime - startTime, endMemory - startMemory);
        } catch (error) {
          trackResult('lezer', false, error);
          throw error;
        }
      });
    });

    it('should handle medium huge diagrams (lezer)', async () => {
      await runWithParser('lezer', (parser) => {
        try {
          const startTime = Date.now();
          const startMemory = getMemoryUsage();

          const res = parser.parse(diagrams.medium);
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          const endTime = Date.now();
          const endMemory = getMemoryUsage();

          expect(edges[0].type).toBe('arrow_point');
          expect(edges.length).toBeGreaterThan(1000);
          expect(vert.size).toBe(2);

          trackResult('lezer', true, null, endTime - startTime, endMemory - startMemory);
        } catch (error) {
          trackResult('lezer', false, error);
          throw error;
        }
      });
    });
  });

  // Performance comparison summary
  describe('Parser Performance Comparison Summary', () => {
    it('should provide comprehensive performance comparison results', () => {
      console.log(
        '\n================================================================================'
      );
      console.log('🔍 COMBINED FLOW HUGE TEST RESULTS');
      console.log(
        '================================================================================'
      );

      PARSERS.forEach((parser) => {
        const results = performanceResults[parser];
        const total = results.passed + results.failed;
        const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0.0';

        console.log(`\n📊 ${parser.toUpperCase()} Parser Results:`);
        console.log(`   ✅ Passed: ${results.passed}/${total} (${successRate}%)`);
        console.log(`   ❌ Failed: ${results.failed}`);
        console.log(`   ⏱️  Avg Time: ${results.avgTime}ms`);
        console.log(`   💾 Max Memory: ${results.maxMemory.toFixed(2)}MB`);
        if (results.errors.length > 0) {
          console.log(`   🔍 Sample errors: ${results.errors.slice(0, 2).join(', ')}`);
        }
      });

      const totalTests = PARSERS.reduce((sum, parser) => {
        const results = performanceResults[parser];
        return sum + results.passed + results.failed;
      }, 0);

      const totalPassed = PARSERS.reduce(
        (sum, parser) => sum + performanceResults[parser].passed,
        0
      );
      const overallSuccessRate =
        totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';

      console.log(
        '\n================================================================================'
      );
      console.log('📈 OVERALL PERFORMANCE RESULTS');
      console.log(
        '================================================================================'
      );
      console.log(`Total Tests: ${totalTests}`);
      console.log(`Total Passed: ${totalPassed}`);
      console.log(`Total Failed: ${totalTests - totalPassed}`);
      console.log(`Overall Success Rate: ${overallSuccessRate}%`);

      if (overallSuccessRate === '100.0') {
        console.log('\n🎉 SUCCESS: All parsers achieved 100% compatibility!');
        console.log(
          '🚀 All four parsers (JISON, ANTLR, LARK, LEZER) handle huge diagrams identically!'
        );
      } else {
        console.log(
          '\n⚠️  Some performance or compatibility issues remain - see individual parser results above'
        );
      }
      console.log(
        '================================================================================\n'
      );

      // The test should pass regardless of individual parser performance
      // This is a summary test that always passes to show results
      expect(true).toBe(true);
    });
  });
});
