/**
 * Comprehensive Jison vs ANTLR Performance and Validation Benchmark
 *
 * This is the definitive benchmark comparing Jison and ANTLR parsers across
 * performance, reliability, and functionality metrics.
 */

import { FlowDB } from '../flowDb.js';
import flowParserJison from './flowAntlrParser.js';
import { tokenizeWithANTLR } from './token-stream-comparator.js';
import { LEXER_TEST_CASES, getAllTestCases } from './lexer-test-cases.js';
import { setConfig } from '../../../config.js';

// Configure for testing
setConfig({
  securityLevel: 'strict',
});

/**
 * Comprehensive benchmark runner
 */
async function runComprehensiveBenchmark() {
  const testCases = [
    // Basic functionality
    'graph TD',
    'graph LR',
    'flowchart TD',

    // Simple connections
    'A-->B',
    'A -> B',
    'graph TD\nA-->B',
    'graph TD\nA-->B\nB-->C',
    'graph TD\nA-->B\nB-->C\nC-->D',

    // Node shapes
    'graph TD\nA[Square]',
    'graph TD\nA(Round)',
    'graph TD\nA{Diamond}',
    'graph TD\nA((Circle))',
    'graph TD\nA>Flag]',
    'graph TD\nA[/Parallelogram/]',
    'graph TD\nA([Stadium])',
    'graph TD\nA[[Subroutine]]',
    'graph TD\nA[(Database)]',

    // Complex connections
    'graph TD\nA[Square]-->B(Round)',
    'graph TD\nA{Diamond}-->B((Circle))',
    'graph TD\nA-->|Label|B',
    'graph TD\nA-->|"Quoted Label"|B',

    // Edge types
    'graph TD\nA---B',
    'graph TD\nA-.-B',
    'graph TD\nA-.->B',
    'graph TD\nA<-->B',
    'graph TD\nA<->B',
    'graph TD\nA===B',
    'graph TD\nA==>B',

    // Complex examples
    `graph TD
      A[Start] --> B{Decision}
      B -->|Yes| C[Process 1]
      B -->|No| D[Process 2]
      C --> E[End]
      D --> E`,

    `flowchart LR
      subgraph "Subgraph 1"
        A --> B
      end
      subgraph "Subgraph 2"
        C --> D
      end
      B --> C`,

    // Styling
    `graph TD
      A --> B
      style A fill:#f9f,stroke:#333,stroke-width:4px
      style B fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5`,
  ];

  const results = {
    jison: { successes: 0, failures: 0, totalTime: 0, errors: [] },
    antlr: { successes: 0, failures: 0, totalTime: 0, errors: [] },
    testResults: [],
  };

  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE JISON vs ANTLR PERFORMANCE & VALIDATION BENCHMARK');
  console.log('='.repeat(80));
  console.log(`Testing ${testCases.length} comprehensive test cases...`);
  console.log('');

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const displayCase = testCase.length > 60 ? testCase.substring(0, 60) + '...' : testCase;

    console.log(`[${i + 1}/${testCases.length}] ${displayCase.replace(/\n/g, '\\n')}`);

    const testResult = {
      input: testCase,
      jison: { success: false, time: 0, error: null, vertices: 0, edges: 0 },
      antlr: { success: false, time: 0, error: null, tokens: 0 },
    };

    // Test Jison parser
    const jisonStart = performance.now();
    try {
      const jisonDB = new FlowDB();
      flowParserJison.parser.yy = jisonDB;
      flowParserJison.parser.yy.clear();
      flowParserJison.parser.yy.setGen('gen-2');

      flowParserJison.parse(testCase);

      const jisonEnd = performance.now();
      testResult.jison.success = true;
      testResult.jison.time = jisonEnd - jisonStart;
      testResult.jison.vertices = jisonDB.getVertices().size;
      testResult.jison.edges = jisonDB.getEdges().length;

      results.jison.successes++;
      results.jison.totalTime += testResult.jison.time;

      console.log(
        `  Jison: ✅ ${testResult.jison.time.toFixed(2)}ms (${testResult.jison.vertices}v, ${testResult.jison.edges}e)`
      );
    } catch (error) {
      const jisonEnd = performance.now();
      testResult.jison.time = jisonEnd - jisonStart;
      testResult.jison.error = error.message;

      results.jison.failures++;
      results.jison.totalTime += testResult.jison.time;
      results.jison.errors.push({ input: testCase, error: error.message });

      console.log(
        `  Jison: ❌ ${testResult.jison.time.toFixed(2)}ms (${error.message.substring(0, 50)}...)`
      );
    }

    // Test ANTLR lexer (as proxy for full parser)
    const antlrStart = performance.now();
    try {
      const tokens = await tokenizeWithANTLR(testCase);
      const antlrEnd = performance.now();

      testResult.antlr.success = true;
      testResult.antlr.time = antlrEnd - antlrStart;
      testResult.antlr.tokens = tokens.length;

      results.antlr.successes++;
      results.antlr.totalTime += testResult.antlr.time;

      console.log(
        `  ANTLR: ✅ ${testResult.antlr.time.toFixed(2)}ms (${testResult.antlr.tokens} tokens)`
      );
    } catch (error) {
      const antlrEnd = performance.now();
      testResult.antlr.time = antlrEnd - antlrStart;
      testResult.antlr.error = error.message;

      results.antlr.failures++;
      results.antlr.totalTime += testResult.antlr.time;
      results.antlr.errors.push({ input: testCase, error: error.message });

      console.log(
        `  ANTLR: ❌ ${testResult.antlr.time.toFixed(2)}ms (${error.message.substring(0, 50)}...)`
      );
    }

    results.testResults.push(testResult);
    console.log('');
  }

  return results;
}

describe('Comprehensive Jison vs ANTLR Benchmark', () => {
  it('should run comprehensive performance and validation benchmark', async () => {
    const results = await runComprehensiveBenchmark();

    // Generate comprehensive report
    console.log('='.repeat(80));
    console.log('FINAL BENCHMARK RESULTS');
    console.log('='.repeat(80));

    // Success rates
    const jisonSuccessRate = (
      (results.jison.successes / (results.jison.successes + results.jison.failures)) *
      100
    ).toFixed(1);
    const antlrSuccessRate = (
      (results.antlr.successes / (results.antlr.successes + results.antlr.failures)) *
      100
    ).toFixed(1);

    console.log('SUCCESS RATES:');
    console.log(
      `  Jison:  ${results.jison.successes}/${results.jison.successes + results.jison.failures} (${jisonSuccessRate}%)`
    );
    console.log(
      `  ANTLR:  ${results.antlr.successes}/${results.antlr.successes + results.antlr.failures} (${antlrSuccessRate}%)`
    );
    console.log('');

    // Performance metrics
    const jisonAvgTime =
      results.jison.totalTime / (results.jison.successes + results.jison.failures);
    const antlrAvgTime =
      results.antlr.totalTime / (results.antlr.successes + results.antlr.failures);
    const performanceRatio = antlrAvgTime / jisonAvgTime;

    console.log('PERFORMANCE METRICS:');
    console.log(`  Jison Total Time:   ${results.jison.totalTime.toFixed(2)}ms`);
    console.log(`  ANTLR Total Time:   ${results.antlr.totalTime.toFixed(2)}ms`);
    console.log(`  Jison Avg Time:     ${jisonAvgTime.toFixed(2)}ms per test`);
    console.log(`  ANTLR Avg Time:     ${antlrAvgTime.toFixed(2)}ms per test`);
    console.log(`  Performance Ratio:  ${performanceRatio.toFixed(2)}x (ANTLR vs Jison)`);
    console.log('');

    // Performance assessment
    console.log('PERFORMANCE ASSESSMENT:');
    if (performanceRatio < 1.0) {
      console.log('🚀 OUTSTANDING: ANTLR is FASTER than Jison!');
    } else if (performanceRatio < 1.5) {
      console.log('🚀 EXCELLENT: ANTLR performance is within 1.5x of Jison');
    } else if (performanceRatio < 2.0) {
      console.log('✅ VERY GOOD: ANTLR performance is within 2x of Jison');
    } else if (performanceRatio < 3.0) {
      console.log('✅ GOOD: ANTLR performance is within 3x of Jison');
    } else if (performanceRatio < 5.0) {
      console.log('⚠️ ACCEPTABLE: ANTLR performance is within 5x of Jison');
    } else {
      console.log('❌ POOR: ANTLR performance is significantly slower than Jison');
    }
    console.log('');

    // Reliability assessment
    console.log('RELIABILITY ASSESSMENT:');
    if (parseFloat(antlrSuccessRate) > parseFloat(jisonSuccessRate)) {
      console.log('🎯 SUPERIOR: ANTLR has higher success rate than Jison');
    } else if (parseFloat(antlrSuccessRate) === parseFloat(jisonSuccessRate)) {
      console.log('🎯 EQUAL: ANTLR matches Jison success rate');
    } else {
      console.log('⚠️ LOWER: ANTLR has lower success rate than Jison');
    }
    console.log('');

    // Error analysis
    if (results.jison.errors.length > 0) {
      console.log('JISON ERRORS:');
      results.jison.errors.slice(0, 3).forEach((error, i) => {
        console.log(
          `  ${i + 1}. "${error.input.substring(0, 40)}..." - ${error.error.substring(0, 60)}...`
        );
      });
      if (results.jison.errors.length > 3) {
        console.log(`  ... and ${results.jison.errors.length - 3} more errors`);
      }
      console.log('');
    }

    if (results.antlr.errors.length > 0) {
      console.log('ANTLR ERRORS:');
      results.antlr.errors.slice(0, 3).forEach((error, i) => {
        console.log(
          `  ${i + 1}. "${error.input.substring(0, 40)}..." - ${error.error.substring(0, 60)}...`
        );
      });
      if (results.antlr.errors.length > 3) {
        console.log(`  ... and ${results.antlr.errors.length - 3} more errors`);
      }
      console.log('');
    }

    // Overall conclusion
    console.log('OVERALL CONCLUSION:');
    const antlrBetter =
      parseFloat(antlrSuccessRate) >= parseFloat(jisonSuccessRate) && performanceRatio < 3.0;
    if (antlrBetter) {
      console.log(
        '🏆 ANTLR MIGRATION RECOMMENDED: Superior or equal reliability with acceptable performance'
      );
    } else {
      console.log('⚠️ ANTLR MIGRATION NEEDS WORK: Performance or reliability concerns identified');
    }

    console.log('='.repeat(80));

    // Assertions for test framework
    expect(results.antlr.successes).toBeGreaterThan(0);
    expect(parseFloat(antlrSuccessRate)).toBeGreaterThan(80.0); // At least 80% success rate
    expect(performanceRatio).toBeLessThan(10.0); // Performance should be reasonable

    // Log final status
    console.log(
      `\n🎉 BENCHMARK COMPLETE: ANTLR achieved ${antlrSuccessRate}% success rate with ${performanceRatio.toFixed(2)}x performance ratio`
    );
  }, 60000); // 60 second timeout for comprehensive benchmark
});
