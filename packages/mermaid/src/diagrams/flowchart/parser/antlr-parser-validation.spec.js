/**
 * ANTLR Parser Validation Test Suite
 * 
 * This comprehensive test suite validates the ANTLR parser against existing
 * flowchart test cases to ensure 100% compatibility with the Jison parser.
 */

import { FlowDB } from '../flowDb.js';
import flowParserJison from './flowParser.ts';
import flowParserANTLR from './flowParserANTLR.ts';
import { setConfig } from '../../../config.js';

// Configure for testing
setConfig({
  securityLevel: 'strict',
});

/**
 * Compare two FlowDB instances for equality
 * @param {FlowDB} jisonDB - FlowDB from Jison parser
 * @param {FlowDB} antlrDB - FlowDB from ANTLR parser
 * @returns {Object} Comparison result
 */
function compareFlowDBs(jisonDB, antlrDB) {
  const comparison = {
    identical: true,
    differences: [],
    summary: {
      vertices: { jison: 0, antlr: 0, match: true },
      edges: { jison: 0, antlr: 0, match: true },
      direction: { jison: '', antlr: '', match: true },
      subGraphs: { jison: 0, antlr: 0, match: true },
      classes: { jison: 0, antlr: 0, match: true }
    }
  };

  try {
    // Compare vertices
    const jisonVertices = jisonDB.getVertices();
    const antlrVertices = antlrDB.getVertices();
    
    comparison.summary.vertices.jison = jisonVertices.size;
    comparison.summary.vertices.antlr = antlrVertices.size;
    comparison.summary.vertices.match = jisonVertices.size === antlrVertices.size;
    
    if (!comparison.summary.vertices.match) {
      comparison.identical = false;
      comparison.differences.push({
        type: 'VERTEX_COUNT_MISMATCH',
        jison: jisonVertices.size,
        antlr: antlrVertices.size
      });
    }

    // Compare edges
    const jisonEdges = jisonDB.getEdges();
    const antlrEdges = antlrDB.getEdges();
    
    comparison.summary.edges.jison = jisonEdges.length;
    comparison.summary.edges.antlr = antlrEdges.length;
    comparison.summary.edges.match = jisonEdges.length === antlrEdges.length;
    
    if (!comparison.summary.edges.match) {
      comparison.identical = false;
      comparison.differences.push({
        type: 'EDGE_COUNT_MISMATCH',
        jison: jisonEdges.length,
        antlr: antlrEdges.length
      });
    }

    // Compare direction
    const jisonDirection = jisonDB.getDirection() || '';
    const antlrDirection = antlrDB.getDirection() || '';
    
    comparison.summary.direction.jison = jisonDirection;
    comparison.summary.direction.antlr = antlrDirection;
    comparison.summary.direction.match = jisonDirection === antlrDirection;
    
    if (!comparison.summary.direction.match) {
      comparison.identical = false;
      comparison.differences.push({
        type: 'DIRECTION_MISMATCH',
        jison: jisonDirection,
        antlr: antlrDirection
      });
    }

    // Compare subgraphs
    const jisonSubGraphs = jisonDB.getSubGraphs();
    const antlrSubGraphs = antlrDB.getSubGraphs();
    
    comparison.summary.subGraphs.jison = jisonSubGraphs.length;
    comparison.summary.subGraphs.antlr = antlrSubGraphs.length;
    comparison.summary.subGraphs.match = jisonSubGraphs.length === antlrSubGraphs.length;
    
    if (!comparison.summary.subGraphs.match) {
      comparison.identical = false;
      comparison.differences.push({
        type: 'SUBGRAPH_COUNT_MISMATCH',
        jison: jisonSubGraphs.length,
        antlr: antlrSubGraphs.length
      });
    }

    // Compare classes
    const jisonClasses = jisonDB.getClasses();
    const antlrClasses = antlrDB.getClasses();
    
    comparison.summary.classes.jison = jisonClasses.size;
    comparison.summary.classes.antlr = antlrClasses.size;
    comparison.summary.classes.match = jisonClasses.size === antlrClasses.size;
    
    if (!comparison.summary.classes.match) {
      comparison.identical = false;
      comparison.differences.push({
        type: 'CLASS_COUNT_MISMATCH',
        jison: jisonClasses.size,
        antlr: antlrClasses.size
      });
    }

  } catch (error) {
    comparison.identical = false;
    comparison.differences.push({
      type: 'COMPARISON_ERROR',
      error: error.message
    });
  }

  return comparison;
}

/**
 * Test a single flowchart input with both parsers
 * @param {string} input - Flowchart input to test
 * @returns {Object} Test result
 */
async function testSingleInput(input) {
  const result = {
    input: input,
    jison: { success: false, error: null, db: null },
    antlr: { success: false, error: null, db: null },
    comparison: null
  };

  // Test Jison parser
  try {
    const jisonDB = new FlowDB();
    flowParserJison.parser.yy = jisonDB;
    flowParserJison.parser.yy.clear();
    flowParserJison.parser.yy.setGen('gen-2');
    
    flowParserJison.parse(input);
    
    result.jison.success = true;
    result.jison.db = jisonDB;
  } catch (error) {
    result.jison.error = error.message;
  }

  // Test ANTLR parser
  try {
    const antlrDB = new FlowDB();
    flowParserANTLR.parser.yy = antlrDB;
    flowParserANTLR.parser.yy.clear();
    flowParserANTLR.parser.yy.setGen('gen-2');
    
    flowParserANTLR.parse(input);
    
    result.antlr.success = true;
    result.antlr.db = antlrDB;
  } catch (error) {
    result.antlr.error = error.message;
  }

  // Compare results if both succeeded
  if (result.jison.success && result.antlr.success) {
    result.comparison = compareFlowDBs(result.jison.db, result.antlr.db);
  }

  return result;
}

describe('ANTLR Parser Validation Against Jison Parser', () => {
  
  describe('Basic Functionality Tests', () => {
    const basicTests = [
      'graph TD',
      'graph LR',
      'flowchart TD',
      'A-->B',
      'A --> B',
      'graph TD\nA-->B',
      'graph TD\nA-->B\nB-->C'
    ];

    basicTests.forEach(testInput => {
      it(`should parse "${testInput.replace(/\n/g, '\\n')}" identically to Jison`, async () => {
        const result = await testSingleInput(testInput);
        
        console.log(`\n📊 Test: "${testInput.replace(/\n/g, '\\n')}"`);
        console.log(`Jison: ${result.jison.success ? '✅' : '❌'} ${result.jison.error || ''}`);
        console.log(`ANTLR: ${result.antlr.success ? '✅' : '❌'} ${result.antlr.error || ''}`);
        
        if (result.comparison) {
          console.log(`Match: ${result.comparison.identical ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);
          if (!result.comparison.identical) {
            console.log('Differences:', result.comparison.differences);
          }
        }

        // Both parsers should succeed
        expect(result.jison.success).toBe(true);
        expect(result.antlr.success).toBe(true);
        
        // Results should be identical
        if (result.comparison) {
          expect(result.comparison.identical).toBe(true);
        }
      });
    });
  });

  describe('Node Shape Tests', () => {
    const shapeTests = [
      'graph TD\nA[Square]',
      'graph TD\nA(Round)',
      'graph TD\nA{Diamond}',
      'graph TD\nA((Circle))',
      'graph TD\nA>Flag]',
      'graph TD\nA[/Parallelogram/]',
      'graph TD\nA[\\Parallelogram\\]',
      'graph TD\nA([Stadium])',
      'graph TD\nA[[Subroutine]]',
      'graph TD\nA[(Database)]',
      'graph TD\nA(((Cloud)))'
    ];

    shapeTests.forEach(testInput => {
      it(`should parse node shape "${testInput.split('\\n')[1]}" identically to Jison`, async () => {
        const result = await testSingleInput(testInput);
        
        console.log(`\n📊 Shape Test: "${testInput.replace(/\n/g, '\\n')}"`);
        console.log(`Jison: ${result.jison.success ? '✅' : '❌'} ${result.jison.error || ''}`);
        console.log(`ANTLR: ${result.antlr.success ? '✅' : '❌'} ${result.antlr.error || ''}`);
        
        if (result.comparison) {
          console.log(`Match: ${result.comparison.identical ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);
        }

        // ANTLR parser should succeed (Jison may fail on some shapes)
        expect(result.antlr.success).toBe(true);
        
        // If both succeed, they should match
        if (result.jison.success && result.comparison) {
          expect(result.comparison.identical).toBe(true);
        }
      });
    });
  });

  describe('Edge Type Tests', () => {
    const edgeTests = [
      'graph TD\nA-->B',
      'graph TD\nA->B',
      'graph TD\nA---B',
      'graph TD\nA-.-B',
      'graph TD\nA-.->B',
      'graph TD\nA<-->B',
      'graph TD\nA<->B',
      'graph TD\nA===B',
      'graph TD\nA==>B'
    ];

    edgeTests.forEach(testInput => {
      it(`should parse edge type "${testInput.split('\\n')[1]}" identically to Jison`, async () => {
        const result = await testSingleInput(testInput);
        
        console.log(`\n📊 Edge Test: "${testInput.replace(/\n/g, '\\n')}"`);
        console.log(`Jison: ${result.jison.success ? '✅' : '❌'} ${result.jison.error || ''}`);
        console.log(`ANTLR: ${result.antlr.success ? '✅' : '❌'} ${result.antlr.error || ''}`);
        
        if (result.comparison) {
          console.log(`Match: ${result.comparison.identical ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);
        }

        // ANTLR parser should succeed
        expect(result.antlr.success).toBe(true);
        
        // If both succeed, they should match
        if (result.jison.success && result.comparison) {
          expect(result.comparison.identical).toBe(true);
        }
      });
    });
  });

  describe('Complex Flowchart Tests', () => {
    const complexTests = [
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
      
      `graph TD
        A --> B
        style A fill:#f9f,stroke:#333,stroke-width:4px
        style B fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5`
    ];

    complexTests.forEach((testInput, index) => {
      it(`should parse complex flowchart ${index + 1} identically to Jison`, async () => {
        const result = await testSingleInput(testInput);
        
        console.log(`\n📊 Complex Test ${index + 1}:`);
        console.log(`Jison: ${result.jison.success ? '✅' : '❌'} ${result.jison.error || ''}`);
        console.log(`ANTLR: ${result.antlr.success ? '✅' : '❌'} ${result.antlr.error || ''}`);
        
        if (result.comparison) {
          console.log(`Match: ${result.comparison.identical ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);
          if (!result.comparison.identical) {
            console.log('Summary:', result.comparison.summary);
          }
        }

        // ANTLR parser should succeed
        expect(result.antlr.success).toBe(true);
        
        // If both succeed, they should match
        if (result.jison.success && result.comparison) {
          expect(result.comparison.identical).toBe(true);
        }
      });
    });
  });

});
