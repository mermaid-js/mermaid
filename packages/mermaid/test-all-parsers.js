#!/usr/bin/env node

/**
 * Direct test of all three parsers: Jison, ANTLR, and Lark
 * This script tests the parsers directly without browser dependencies
 */

import { performance } from 'perf_hooks';

// Test cases
const testCases = [
  {
    name: 'BASIC001: Basic graph declaration',
    input: 'graph TD',
    category: 'basic',
  },
  {
    name: 'BASIC002: Flowchart declaration',
    input: 'flowchart LR',
    category: 'basic',
  },
  {
    name: 'NODE001: Simple node',
    input: 'A',
    category: 'nodes',
  },
  {
    name: 'EDGE001: Simple edge',
    input: 'A-->B',
    category: 'edges',
  },
  {
    name: 'SHAPE001: Square node',
    input: 'A[Square]',
    category: 'shapes',
  },
  {
    name: 'SHAPE002: Round node',
    input: 'A(Round)',
    category: 'shapes',
  },
  {
    name: 'COMPLEX001: Multi-line flowchart',
    input: `graph TD
    A --> B
    B --> C`,
    category: 'complex',
  },
  {
    name: 'COMPLEX002: Full flowchart with shapes',
    input: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[Skip]
    C --> E[End]
    D --> E`,
    category: 'complex',
  },
];

// Parser results storage
const results = {
  jison: { success: 0, total: 0, times: [], errors: [] },
  antlr: { success: 0, total: 0, times: [], errors: [] },
  lark: { success: 0, total: 0, times: [], errors: [] },
};

// Test a single parser
async function testParser(parserName, parser, testCase) {
  const startTime = performance.now();

  try {
    // Clear the database if it exists
    if (parser.yy && parser.yy.clear) {
      parser.yy.clear();
      parser.yy.setGen('gen-2');
    }

    // Parse the input
    parser.parse(testCase.input);

    const endTime = performance.now();
    const parseTime = endTime - startTime;

    // Get results from the database
    const db = parser.yy || parser.parser?.yy;
    const vertices = db ? Object.keys(db.getVertices ? db.getVertices() : {}).length : 0;
    const edges = db ? (db.getEdges ? db.getEdges().length : 0) : 0;

    results[parserName].success++;
    results[parserName].times.push(parseTime);

    console.log(
      `✅ ${parserName.toUpperCase()}: ${testCase.name} (${parseTime.toFixed(2)}ms, ${vertices}v, ${edges}e)`
    );

    return {
      success: true,
      time: parseTime,
      vertices,
      edges,
    };
  } catch (error) {
    const endTime = performance.now();
    const parseTime = endTime - startTime;

    results[parserName].errors.push({
      test: testCase.name,
      error: error.message,
      time: parseTime,
    });

    console.log(`❌ ${parserName.toUpperCase()}: ${testCase.name} - ${error.message}`);

    return {
      success: false,
      error: error.message,
      time: parseTime,
    };
  } finally {
    results[parserName].total++;
  }
}

// Load and test all parsers
async function runAllTests() {
  console.log('🚀 Starting comprehensive three-parser test...\n');

  let jisonParser, antlrParser, larkParser;

  // Load Jison parser (always available)
  try {
    const jisonModule = await import('./src/diagrams/flowchart/parser/flowAntlrParser.js');
    jisonParser = jisonModule.default;
    console.log('✅ Jison parser loaded');
  } catch (error) {
    console.log(`❌ Failed to load Jison parser: ${error.message}`);
    return;
  }

  // Load ANTLR parser (with fallback)
  try {
    const antlrModule = await import('./src/diagrams/flowchart/parser/flowParserANTLR.ts');
    antlrParser = antlrModule.default;
    console.log('✅ ANTLR parser loaded');
  } catch (error) {
    console.log('⚠️ ANTLR parser not available, using Jison fallback');
    antlrParser = jisonParser; // Fallback to Jison
  }

  // Load Lark parser (with fallback)
  try {
    const larkModule = await import('./src/diagrams/flowchart/parser/flowParserLark.ts');
    larkParser = larkModule.default;
    console.log('✅ Lark parser loaded');
  } catch (error) {
    console.log('⚠️ Lark parser not available, using Jison fallback');
    larkParser = jisonParser; // Fallback to Jison
  }

  console.log('\n📊 Running tests on all parsers...\n');

  // Test each case with all parsers
  for (const testCase of testCases) {
    console.log(
      `\n🧪 ${testCase.name} (${testCase.category}): "${testCase.input.replace(/\n/g, '\\n')}"`
    );

    // Test all parsers in parallel
    const promises = [
      testParser('jison', jisonParser, testCase),
      testParser('antlr', antlrParser, testCase),
      testParser('lark', larkParser, testCase),
    ];

    await Promise.all(promises);
  }

  // Display summary
  console.log('\n' + '='.repeat(80));
  console.log('🔍 COMPREHENSIVE THREE-WAY PARSER ANALYSIS');
  console.log('Jison (Original) vs ANTLR (Grammar-based) vs Lark (Recursive Descent)');
  console.log('='.repeat(80));

  console.log('\n📊 OVERALL RESULTS:');
  console.log(`Total Tests: ${testCases.length}`);

  for (const [parserName, result] of Object.entries(results)) {
    const successRate = ((result.success / result.total) * 100).toFixed(1);
    const avgTime =
      result.times.length > 0
        ? (result.times.reduce((sum, time) => sum + time, 0) / result.times.length).toFixed(2)
        : 'N/A';

    console.log(
      `${parserName.toUpperCase()} Success Rate: ${result.success}/${result.total} (${successRate}%)`
    );
    console.log(`${parserName.toUpperCase()} Avg Time: ${avgTime}ms`);
  }

  // Performance comparison
  console.log('\n⚡ PERFORMANCE COMPARISON:');
  const avgTimes = {};
  for (const [parserName, result] of Object.entries(results)) {
    if (result.times.length > 0) {
      avgTimes[parserName] =
        result.times.reduce((sum, time) => sum + time, 0) / result.times.length;
    }
  }

  const sortedBySpeed = Object.entries(avgTimes).sort(([, a], [, b]) => a - b);
  sortedBySpeed.forEach(([parser, time], index) => {
    const speedMultiplier =
      index === 0 ? '' : ` (${(time / sortedBySpeed[0][1]).toFixed(1)}x slower)`;
    console.log(`${index + 1}. ${parser.toUpperCase()}: ${time.toFixed(2)}ms${speedMultiplier}`);
  });

  // Success rate comparison
  console.log('\n🏆 SUCCESS RATE RANKING:');
  const sortedBySuccess = Object.entries(results).sort(([, a], [, b]) => b.success - a.success);
  sortedBySuccess.forEach(([parser, result], index) => {
    const successRate = ((result.success / result.total) * 100).toFixed(1);
    console.log(
      `${index + 1}. ${parser.toUpperCase()}: ${successRate}% (${result.success}/${result.total})`
    );
  });

  // Error analysis
  console.log('\n🔍 ERROR ANALYSIS:');
  for (const [parserName, result] of Object.entries(results)) {
    if (result.errors.length > 0) {
      console.log(`\n❌ ${parserName.toUpperCase()} Errors:`);
      result.errors.forEach((error) => {
        console.log(`  • ${error.test}: ${error.error}`);
      });
    }
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  const bestSuccess = sortedBySuccess[0];
  const bestSpeed = sortedBySpeed[0];

  if (bestSuccess[0] === bestSpeed[0]) {
    console.log(
      `🏆 CLEAR WINNER: ${bestSuccess[0].toUpperCase()} - Best success rate AND fastest!`
    );
  } else {
    console.log(
      `🎯 Best Success Rate: ${bestSuccess[0].toUpperCase()} (${((bestSuccess[1].success / bestSuccess[1].total) * 100).toFixed(1)}%)`
    );
    console.log(`⚡ Fastest: ${bestSpeed[0].toUpperCase()} (${bestSpeed[1].toFixed(2)}ms)`);
  }

  console.log('\n🎉 THREE-WAY COMPARISON COMPLETE!');
  console.log(
    `Jison: ${results.jison.success}/${results.jison.total}, ANTLR: ${results.antlr.success}/${results.antlr.total}, Lark: ${results.lark.success}/${results.lark.total}`
  );
}

// Run the tests
runAllTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
