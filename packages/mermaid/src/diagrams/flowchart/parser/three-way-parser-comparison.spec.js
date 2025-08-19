/**
 * COMPREHENSIVE THREE-WAY PARSER COMPARISON
 *
 * This test suite compares Jison, ANTLR, and Lark-inspired parsers across
 * performance, reliability, and functionality metrics.
 *
 * Tests all three parsing technologies:
 * - Jison (original)
 * - ANTLR (grammar-based)
 * - Lark-inspired (recursive descent)
 */

import { describe, it, expect } from 'vitest';
import { FlowDB } from '../flowDb.js';
import flowParserJison from './flowAntlrParser.js';
import flowParserANTLR from './flowParserANTLR.ts';
import flowParserLark from './flowParserLark.js';
import { tokenizeWithANTLR } from './token-stream-comparator.js';
import { tokenizeWithLark } from './lark-token-stream-comparator.js';
import { setConfig } from '../../../config.js';

// Configure for testing
setConfig({
  securityLevel: 'strict',
});

/**
 * Comprehensive test cases for three-way comparison
 */
const COMPREHENSIVE_TEST_CASES = [
  // Basic Graph Declarations
  {
    id: 'GRA001',
    description: 'should parse "graph TD" correctly',
    input: 'graph TD',
    category: 'basic',
  },
  {
    id: 'GRA002',
    description: 'should parse "graph LR" correctly',
    input: 'graph LR',
    category: 'basic',
  },
  {
    id: 'FLO001',
    description: 'should parse "flowchart TD" correctly',
    input: 'flowchart TD',
    category: 'basic',
  },

  // Simple Nodes
  {
    id: 'NOD001',
    description: 'should parse simple node "A" correctly',
    input: 'A',
    category: 'nodes',
  },
  {
    id: 'NOD002',
    description: 'should parse node "A1" correctly',
    input: 'A1',
    category: 'nodes',
  },

  // Basic Edges
  {
    id: 'EDG001',
    description: 'should parse "A-->B" correctly',
    input: 'A-->B',
    category: 'edges',
  },
  {
    id: 'EDG002',
    description: 'should parse "A---B" correctly',
    input: 'A---B',
    category: 'edges',
  },
  {
    id: 'EDG003',
    description: 'should parse "A-.->B" correctly',
    input: 'A-.->B',
    category: 'edges',
  },

  // Node Shapes
  {
    id: 'SHA001',
    description: 'should parse square brackets "A[Square]" correctly',
    input: 'A[Square]',
    category: 'shapes',
  },
  {
    id: 'SHA002',
    description: 'should parse round parentheses "A(Round)" correctly',
    input: 'A(Round)',
    category: 'shapes',
  },
  {
    id: 'SHA003',
    description: 'should parse diamond "A{Diamond}" correctly',
    input: 'A{Diamond}',
    category: 'shapes',
  },
  {
    id: 'SHA004',
    description: 'should parse double circle "A((Circle))" correctly',
    input: 'A((Circle))',
    category: 'shapes',
  },

  // Complex Examples
  {
    id: 'CPX001',
    description: 'should parse complex multi-line flowchart',
    input: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]`,
    category: 'complex',
  },
];

/**
 * Test result structure for three-way comparison
 */
// interface ThreeWayTestResult {
testId: string;
input: string;
jison: {
  success: boolean;
  tokenCount: number;
  vertices: number;
  edges: number;
  error: string | null;
  time: number;
}
antlr: {
  success: boolean;
  tokenCount: number;
  vertices: number;
  edges: number;
  error: string | null;
  time: number;
}
lark: {
  success: boolean;
  tokenCount: number;
  vertices: number;
  edges: number;
  error: string | null;
  time: number;
}
comparison: {
  allMatch: boolean;
  bestPerformer: string;
  mostReliable: string;
}
// }

/**
 * Test a single input with all three parsers
 */
async function runThreeWayComparison(testCase) {
  const result = {
    testId: testCase.id,
    input: testCase.input,
    jison: { success: false, tokenCount: 0, vertices: 0, edges: 0, error: null, time: 0 },
    antlr: { success: false, tokenCount: 0, vertices: 0, edges: 0, error: null, time: 0 },
    lark: { success: false, tokenCount: 0, vertices: 0, edges: 0, error: null, time: 0 },
    comparison: { allMatch: false, bestPerformer: '', mostReliable: '' },
  };

  // Test Jison parser
  const jisonStart = performance.now();
  try {
    const jisonDB = new FlowDB();
    flowParserJison.parser.yy = jisonDB;
    flowParserJison.parser.yy.clear();
    flowParserJison.parser.yy.setGen('gen-2');

    flowParserJison.parse(testCase.input);

    const jisonEnd = performance.now();
    result.jison = {
      success: true,
      tokenCount: 0, // Jison doesn't expose token count easily
      vertices: jisonDB.getVertices().size,
      edges: jisonDB.getEdges().length,
      error: null,
      time: jisonEnd - jisonStart,
    };
  } catch (error) {
    const jisonEnd = performance.now();
    result.jison = {
      success: false,
      tokenCount: 0,
      vertices: 0,
      edges: 0,
      error: error.message,
      time: jisonEnd - jisonStart,
    };
  }

  // Test ANTLR parser
  const antlrStart = performance.now();
  try {
    const antlrDB = new FlowDB();
    flowParserANTLR.parser.yy = antlrDB;
    flowParserANTLR.parser.yy.clear();
    flowParserANTLR.parser.yy.setGen('gen-2');

    flowParserANTLR.parse(testCase.input);

    const antlrTokens = await tokenizeWithANTLR(testCase.input);
    const antlrEnd = performance.now();

    result.antlr = {
      success: true,
      tokenCount: antlrTokens.length,
      vertices: antlrDB.getVertices().size,
      edges: antlrDB.getEdges().length,
      error: null,
      time: antlrEnd - antlrStart,
    };
  } catch (error) {
    const antlrEnd = performance.now();
    result.antlr = {
      success: false,
      tokenCount: 0,
      vertices: 0,
      edges: 0,
      error: error.message,
      time: antlrEnd - antlrStart,
    };
  }

  // Test Lark parser
  const larkStart = performance.now();
  try {
    const larkDB = new FlowDB();
    flowParserLark.parser.yy = larkDB;
    flowParserLark.parser.yy.clear();
    flowParserLark.parser.yy.setGen('gen-2');

    flowParserLark.parse(testCase.input);

    const larkTokens = await tokenizeWithLark(testCase.input);
    const larkEnd = performance.now();

    result.lark = {
      success: true,
      tokenCount: larkTokens.length,
      vertices: larkDB.getVertices().size,
      edges: larkDB.getEdges().length,
      error: null,
      time: larkEnd - larkStart,
    };
  } catch (error) {
    const larkEnd = performance.now();
    result.lark = {
      success: false,
      tokenCount: 0,
      vertices: 0,
      edges: 0,
      error: error.message,
      time: larkEnd - larkStart,
    };
  }

  // Analyze comparison
  const successCount = [result.jison.success, result.antlr.success, result.lark.success].filter(
    Boolean
  ).length;
  result.comparison.allMatch =
    successCount === 3 &&
    result.jison.vertices === result.antlr.vertices &&
    result.antlr.vertices === result.lark.vertices &&
    result.jison.edges === result.antlr.edges &&
    result.antlr.edges === result.lark.edges;

  // Determine best performer (fastest among successful parsers)
  const performers = [];
  if (result.jison.success) performers.push({ name: 'jison', time: result.jison.time });
  if (result.antlr.success) performers.push({ name: 'antlr', time: result.antlr.time });
  if (result.lark.success) performers.push({ name: 'lark', time: result.lark.time });

  if (performers.length > 0) {
    performers.sort((a, b) => a.time - b.time);
    result.comparison.bestPerformer = performers[0].name;
  }

  // Determine most reliable (success rate will be calculated across all tests)
  result.comparison.mostReliable =
    successCount === 3
      ? 'all'
      : result.antlr.success
        ? 'antlr'
        : result.lark.success
          ? 'lark'
          : result.jison.success
            ? 'jison'
            : 'none';

  return result;
}

describe('Three-Way Parser Comparison: Jison vs ANTLR vs Lark', () => {
  describe('Individual Test Cases', () => {
    COMPREHENSIVE_TEST_CASES.forEach((testCase) => {
      it(`${testCase.id}: ${testCase.description}`, async () => {
        const result = await runThreeWayComparison(testCase);

        console.log(
          `\n📊 ${testCase.id} (${testCase.category}): "${testCase.input.replace(/\n/g, '\\n')}"`
        );
        console.log(
          `  Jison:  ${result.jison.success ? '✅' : '❌'} ${result.jison.vertices}v ${result.jison.edges}e (${result.jison.time.toFixed(2)}ms)`
        );
        console.log(
          `  ANTLR:  ${result.antlr.success ? '✅' : '❌'} ${result.antlr.vertices}v ${result.antlr.edges}e (${result.antlr.time.toFixed(2)}ms)`
        );
        console.log(
          `  Lark:   ${result.lark.success ? '✅' : '❌'} ${result.lark.vertices}v ${result.lark.edges}e (${result.lark.time.toFixed(2)}ms)`
        );
        console.log(
          `  Match:  ${result.comparison.allMatch ? '✅ IDENTICAL' : '❌ DIFFERENT'} Best: ${result.comparison.bestPerformer.toUpperCase()}`
        );

        if (!result.jison.success) console.log(`  Jison Error: ${result.jison.error}`);
        if (!result.antlr.success) console.log(`  ANTLR Error: ${result.antlr.error}`);
        if (!result.lark.success) console.log(`  Lark Error: ${result.lark.error}`);

        // At least one parser should succeed
        expect(result.jison.success || result.antlr.success || result.lark.success).toBe(true);
      });
    });
  });

  describe('Comprehensive Three-Way Analysis', () => {
    it('should provide comprehensive comparison across all parsers', async () => {
      console.log('\n' + '='.repeat(80));
      console.log('🔍 COMPREHENSIVE THREE-WAY PARSER ANALYSIS');
      console.log('Jison (Original) vs ANTLR (Grammar-based) vs Lark (Recursive Descent)');
      console.log('='.repeat(80));

      const results = [];
      const categoryStats = new Map();

      // Run all tests
      for (const testCase of COMPREHENSIVE_TEST_CASES) {
        const result = await runThreeWayComparison(testCase);
        results.push(result);

        // Track category statistics
        if (!categoryStats.has(testCase.category)) {
          categoryStats.set(testCase.category, {
            total: 0,
            jisonSuccess: 0,
            antlrSuccess: 0,
            larkSuccess: 0,
            allMatch: 0,
            jisonTime: 0,
            antlrTime: 0,
            larkTime: 0,
          });
        }

        const stats = categoryStats.get(testCase.category);
        stats.total++;
        if (result.jison.success) {
          stats.jisonSuccess++;
          stats.jisonTime += result.jison.time;
        }
        if (result.antlr.success) {
          stats.antlrSuccess++;
          stats.antlrTime += result.antlr.time;
        }
        if (result.lark.success) {
          stats.larkSuccess++;
          stats.larkTime += result.lark.time;
        }
        if (result.comparison.allMatch) {
          stats.allMatch++;
        }
      }

      // Calculate overall statistics
      const totalTests = results.length;
      const jisonSuccesses = results.filter((r) => r.jison.success).length;
      const antlrSuccesses = results.filter((r) => r.antlr.success).length;
      const larkSuccesses = results.filter((r) => r.lark.success).length;
      const allMatches = results.filter((r) => r.comparison.allMatch).length;

      const totalJisonTime = results.reduce((sum, r) => sum + r.jison.time, 0);
      const totalAntlrTime = results.reduce((sum, r) => sum + r.antlr.time, 0);
      const totalLarkTime = results.reduce((sum, r) => sum + r.lark.time, 0);

      console.log('\n📊 OVERALL RESULTS:');
      console.log(`Total Tests: ${totalTests}`);
      console.log(
        `Jison Success Rate:  ${jisonSuccesses}/${totalTests} (${((jisonSuccesses / totalTests) * 100).toFixed(1)}%)`
      );
      console.log(
        `ANTLR Success Rate:  ${antlrSuccesses}/${totalTests} (${((antlrSuccesses / totalTests) * 100).toFixed(1)}%)`
      );
      console.log(
        `Lark Success Rate:   ${larkSuccesses}/${totalTests} (${((larkSuccesses / totalTests) * 100).toFixed(1)}%)`
      );
      console.log(
        `Perfect Matches:     ${allMatches}/${totalTests} (${((allMatches / totalTests) * 100).toFixed(1)}%)`
      );

      console.log('\n⚡ PERFORMANCE COMPARISON:');
      const avgJisonTime = totalJisonTime / totalTests;
      const avgAntlrTime = totalAntlrTime / totalTests;
      const avgLarkTime = totalLarkTime / totalTests;

      console.log(`Jison Avg Time:  ${avgJisonTime.toFixed(2)}ms`);
      console.log(
        `ANTLR Avg Time:  ${avgAntlrTime.toFixed(2)}ms (${(avgAntlrTime / avgJisonTime).toFixed(2)}x)`
      );
      console.log(
        `Lark Avg Time:   ${avgLarkTime.toFixed(2)}ms (${(avgLarkTime / avgJisonTime).toFixed(2)}x)`
      );

      console.log('\n📋 CATEGORY BREAKDOWN:');
      for (const [category, stats] of categoryStats.entries()) {
        const jisonRate = ((stats.jisonSuccess / stats.total) * 100).toFixed(1);
        const antlrRate = ((stats.antlrSuccess / stats.total) * 100).toFixed(1);
        const larkRate = ((stats.larkSuccess / stats.total) * 100).toFixed(1);
        const matchRate = ((stats.allMatch / stats.total) * 100).toFixed(1);

        console.log(`  ${category.toUpperCase()}:`);
        console.log(`    Tests: ${stats.total}`);
        console.log(`    Jison:  ${stats.jisonSuccess}/${stats.total} (${jisonRate}%)`);
        console.log(`    ANTLR:  ${stats.antlrSuccess}/${stats.total} (${antlrRate}%)`);
        console.log(`    Lark:   ${stats.larkSuccess}/${stats.total} (${larkRate}%)`);
        console.log(`    Matches: ${stats.allMatch}/${stats.total} (${matchRate}%)`);
      }

      console.log('\n🏆 PARSER RANKINGS:');

      // Reliability ranking
      const reliabilityRanking = [
        { name: 'Jison', rate: jisonSuccesses / totalTests },
        { name: 'ANTLR', rate: antlrSuccesses / totalTests },
        { name: 'Lark', rate: larkSuccesses / totalTests },
      ].sort((a, b) => b.rate - a.rate);

      console.log('📊 RELIABILITY (Success Rate):');
      reliabilityRanking.forEach((parser, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        console.log(`  ${medal} ${parser.name}: ${(parser.rate * 100).toFixed(1)}%`);
      });

      // Performance ranking
      const performanceRanking = [
        { name: 'Jison', time: avgJisonTime },
        { name: 'ANTLR', time: avgAntlrTime },
        { name: 'Lark', time: avgLarkTime },
      ].sort((a, b) => a.time - b.time);

      console.log('\n⚡ PERFORMANCE (Speed):');
      performanceRanking.forEach((parser, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        console.log(`  ${medal} ${parser.name}: ${parser.time.toFixed(2)}ms avg`);
      });

      console.log('\n💡 RECOMMENDATIONS:');

      if (antlrSuccesses >= jisonSuccesses && antlrSuccesses >= larkSuccesses) {
        console.log('✅ ANTLR RECOMMENDED: Best or equal reliability');
      } else if (larkSuccesses >= jisonSuccesses && larkSuccesses >= antlrSuccesses) {
        console.log('✅ LARK RECOMMENDED: Best or equal reliability');
      } else {
        console.log('⚠️ JISON CURRENT: Still most reliable, but consider alternatives');
      }

      if (avgLarkTime < avgJisonTime && avgLarkTime < avgAntlrTime) {
        console.log('🚀 LARK FASTEST: Best performance characteristics');
      } else if (avgJisonTime < avgAntlrTime && avgJisonTime < avgLarkTime) {
        console.log('🚀 JISON FASTEST: Current parser has best performance');
      } else {
        console.log('⚡ ANTLR ACCEPTABLE: Performance within reasonable bounds');
      }

      console.log('\n🎯 STRATEGIC DECISION:');
      const bestReliability = reliabilityRanking[0];
      const bestPerformance = performanceRanking[0];

      if (bestReliability.name === bestPerformance.name) {
        console.log(
          `🏆 CLEAR WINNER: ${bestReliability.name} excels in both reliability and performance`
        );
      } else {
        console.log(
          `⚖️ TRADE-OFF: ${bestReliability.name} most reliable, ${bestPerformance.name} fastest`
        );
        console.log('   Consider reliability vs performance requirements for final decision');
      }

      console.log('='.repeat(80));

      // Assertions for test framework
      expect(antlrSuccesses + larkSuccesses).toBeGreaterThan(totalTests * 0.8); // Combined alternatives should be reliable
      expect(Math.max(antlrSuccesses, larkSuccesses)).toBeGreaterThanOrEqual(jisonSuccesses * 0.8); // Best alternative should be competitive

      console.log(`\n🎉 THREE-WAY COMPARISON COMPLETE!`);
      console.log(
        `Jison: ${jisonSuccesses}/${totalTests}, ANTLR: ${antlrSuccesses}/${totalTests}, Lark: ${larkSuccesses}/${totalTests}`
      );
    });
  });
});
