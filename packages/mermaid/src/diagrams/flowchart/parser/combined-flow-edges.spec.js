import { FlowDB } from '../flowDb.js';
import { getFlowchartParser } from './parserFactory.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

const keywords = [
  'graph',
  'flowchart',
  'flowchart-elk',
  'style',
  'default',
  'linkStyle',
  'interpolate',
  'classDef',
  'class',
  'href',
  'call',
  'click',
  '_self',
  '_blank',
  '_parent',
  '_top',
  'end',
  'subgraph',
  'kitty',
];

const doubleEndedEdges = [
  { edgeStart: 'x--', edgeEnd: '--x', stroke: 'normal', type: 'double_arrow_cross' },
  { edgeStart: 'x==', edgeEnd: '==x', stroke: 'thick', type: 'double_arrow_cross' },
  { edgeStart: 'x-.', edgeEnd: '.-x', stroke: 'dotted', type: 'double_arrow_cross' },
  { edgeStart: 'o--', edgeEnd: '--o', stroke: 'normal', type: 'double_arrow_circle' },
  { edgeStart: 'o==', edgeEnd: '==o', stroke: 'thick', type: 'double_arrow_circle' },
  { edgeStart: 'o-.', edgeEnd: '.-o', stroke: 'dotted', type: 'double_arrow_circle' },
  { edgeStart: '<--', edgeEnd: '-->', stroke: 'normal', type: 'double_arrow_point' },
  { edgeStart: '<==', edgeEnd: '==>', stroke: 'thick', type: 'double_arrow_point' },
  { edgeStart: '<-.', edgeEnd: '.->', stroke: 'dotted', type: 'double_arrow_point' },
];

const regularEdges = [
  { edgeStart: '--', edgeEnd: '--x', stroke: 'normal', type: 'arrow_cross' },
  { edgeStart: '==', edgeEnd: '==x', stroke: 'thick', type: 'arrow_cross' },
  { edgeStart: '-.', edgeEnd: '.-x', stroke: 'dotted', type: 'arrow_cross' },
  { edgeStart: '--', edgeEnd: '--o', stroke: 'normal', type: 'arrow_circle' },
  { edgeStart: '==', edgeEnd: '==o', stroke: 'thick', type: 'arrow_circle' },
  { edgeStart: '-.', edgeEnd: '.-o', stroke: 'dotted', type: 'arrow_circle' },
  { edgeStart: '--', edgeEnd: '-->', stroke: 'normal', type: 'arrow_point' },
  { edgeStart: '==', edgeEnd: '==>', stroke: 'thick', type: 'arrow_point' },
  { edgeStart: '-.', edgeEnd: '.->', stroke: 'dotted', type: 'arrow_point' },

  { edgeStart: '--', edgeEnd: '----x', stroke: 'normal', type: 'arrow_cross' },
  { edgeStart: '==', edgeEnd: '====x', stroke: 'thick', type: 'arrow_cross' },
  { edgeStart: '-.', edgeEnd: '...-x', stroke: 'dotted', type: 'arrow_cross' },
  { edgeStart: '--', edgeEnd: '----o', stroke: 'normal', type: 'arrow_circle' },
  { edgeStart: '==', edgeEnd: '====o', stroke: 'thick', type: 'arrow_circle' },
  { edgeStart: '-.', edgeEnd: '...-o', stroke: 'dotted', type: 'arrow_circle' },
  { edgeStart: '--', edgeEnd: '---->', stroke: 'normal', type: 'arrow_point' },
  { edgeStart: '==', edgeEnd: '====>', stroke: 'thick', type: 'arrow_point' },
  { edgeStart: '-.', edgeEnd: '...->', stroke: 'dotted', type: 'arrow_point' },
];

// Test configuration for all parsers
const PARSERS = ['jison', 'antlr', 'lark'];

console.log('🚀 Starting comprehensive edge test comparison across all parsers');

describe('Combined Flow Edges Test - All Three Parsers', () => {
  let testResults = {
    jison: { passed: 0, failed: 0, errors: [] },
    antlr: { passed: 0, failed: 0, errors: [] },
    lark: { passed: 0, failed: 0, errors: [] },
  };

  // Track total test count for reporting
  let totalTests = 0;

  beforeAll(() => {
    console.log('📊 Testing edge parsing with 3 parsers');
  });

  afterAll(() => {
    // Print comprehensive results
    console.log(
      '\n================================================================================'
    );
    console.log('🔍 COMBINED FLOW EDGES TEST RESULTS');
    console.log(
      '================================================================================\n'
    );

    PARSERS.forEach((parser) => {
      const results = testResults[parser];
      const total = results.passed + results.failed;
      const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0.0';

      console.log(`📊 ${parser.toUpperCase()} Parser Results:`);
      console.log(`   ✅ Passed: ${results.passed}/${total} (${successRate}%)`);
      console.log(`   ❌ Failed: ${results.failed}`);
      if (results.errors.length > 0) {
        console.log(`   🔍 Sample errors: ${results.errors.slice(0, 3).join(', ')}`);
      }
      console.log('');
    });

    const totalPassed = Object.values(testResults).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(testResults).reduce((sum, r) => sum + r.failed, 0);
    const overallTotal = totalPassed + totalFailed;
    const overallSuccessRate =
      overallTotal > 0 ? ((totalPassed / overallTotal) * 100).toFixed(1) : '0.0';

    console.log('================================================================================');
    console.log('📈 OVERALL RESULTS');
    console.log('================================================================================');
    console.log(`Total Tests: ${overallTotal}`);
    console.log(`Total Passed: ${totalPassed}`);
    console.log(`Total Failed: ${totalFailed}`);
    console.log(`Overall Success Rate: ${overallSuccessRate}%`);

    if (overallSuccessRate === '100.0') {
      console.log('\n🎉 SUCCESS: All parsers achieved 100% compatibility!');
      console.log('🚀 All three parsers (JISON, ANTLR, LARK) handle edges identically!');
    } else {
      console.log('\n⚠️  Some compatibility issues remain - see individual parser results above');
    }
    console.log('================================================================================');
  });

  // Helper function to track test results
  function trackResult(parserType, passed, error = null) {
    totalTests++;
    if (passed) {
      testResults[parserType].passed++;
      console.log(`✅ ${parserType.toUpperCase()}: ${expect.getState().currentTestName}`);
    } else {
      testResults[parserType].failed++;
      if (error) {
        testResults[parserType].errors.push(error.message || error);
      }
      console.log(`❌ ${parserType.toUpperCase()}: ${expect.getState().currentTestName}`);
    }
  }

  // Helper function to run a test with a specific parser
  async function runWithParser(parserType, testFn) {
    const parser = await getFlowchartParser(parserType);
    parser.yy.clear();
    return testFn(parser);
  }

  // Basic edge type tests
  describe('JISON Parser Edge Tests', () => {
    beforeAll(async () => {
      const parser = await getFlowchartParser('jison');
      console.log('✅ JISON parser loaded successfully');
    });

    it('should handle open ended edges (jison)', async () => {
      await runWithParser('jison', (parser) => {
        try {
          const res = parser.parse('graph TD;A---B;');
          const edges = parser.yy.getEdges();
          expect(edges[0].type).toBe('arrow_open');
          trackResult('jison', true);
        } catch (error) {
          trackResult('jison', false, error);
          throw error;
        }
      });
    });

    it('should handle cross ended edges (jison)', async () => {
      await runWithParser('jison', (parser) => {
        try {
          const res = parser.parse('graph TD;A--xB;');
          const edges = parser.yy.getEdges();
          expect(edges[0].type).toBe('arrow_cross');
          trackResult('jison', true);
        } catch (error) {
          trackResult('jison', false, error);
          throw error;
        }
      });
    });

    it('should handle circle ended edges (jison)', async () => {
      await runWithParser('jison', (parser) => {
        try {
          const res = parser.parse('graph TD;A--oB;');
          const edges = parser.yy.getEdges();
          expect(edges[0].type).toBe('arrow_circle');
          trackResult('jison', true);
        } catch (error) {
          trackResult('jison', false, error);
          throw error;
        }
      });
    });
  });

  describe('ANTLR Parser Edge Tests', () => {
    beforeAll(async () => {
      const parser = await getFlowchartParser('antlr');
      console.log('✅ ANTLR parser loaded successfully');
    });

    it('should handle open ended edges (antlr)', async () => {
      await runWithParser('antlr', (parser) => {
        try {
          const res = parser.parse('graph TD;A---B;');
          const edges = parser.yy.getEdges();
          expect(edges[0].type).toBe('arrow_open');
          trackResult('antlr', true);
        } catch (error) {
          trackResult('antlr', false, error);
          throw error;
        }
      });
    });

    it('should handle cross ended edges (antlr)', async () => {
      await runWithParser('antlr', (parser) => {
        try {
          const res = parser.parse('graph TD;A--xB;');
          const edges = parser.yy.getEdges();
          expect(edges[0].type).toBe('arrow_cross');
          trackResult('antlr', true);
        } catch (error) {
          trackResult('antlr', false, error);
          throw error;
        }
      });
    });

    it('should handle circle ended edges (antlr)', async () => {
      await runWithParser('antlr', (parser) => {
        try {
          const res = parser.parse('graph TD;A--oB;');
          const edges = parser.yy.getEdges();
          expect(edges[0].type).toBe('arrow_circle');
          trackResult('antlr', true);
        } catch (error) {
          trackResult('antlr', false, error);
          throw error;
        }
      });
    });
  });

  describe('LARK Parser Edge Tests', () => {
    beforeAll(async () => {
      const parser = await getFlowchartParser('lark');
      console.log('✅ LARK parser loaded successfully');
    });

    it('should handle open ended edges (lark)', async () => {
      await runWithParser('lark', (parser) => {
        try {
          const res = parser.parse('graph TD;A---B;');
          const edges = parser.yy.getEdges();
          expect(edges[0].type).toBe('arrow_open');
          trackResult('lark', true);
        } catch (error) {
          trackResult('lark', false, error);
          throw error;
        }
      });
    });

    it('should handle cross ended edges (lark)', async () => {
      await runWithParser('lark', (parser) => {
        try {
          const res = parser.parse('graph TD;A--xB;');
          const edges = parser.yy.getEdges();
          expect(edges[0].type).toBe('arrow_cross');
          trackResult('lark', true);
        } catch (error) {
          trackResult('lark', false, error);
          throw error;
        }
      });
    });

    it('should handle circle ended edges (lark)', async () => {
      await runWithParser('lark', (parser) => {
        try {
          const res = parser.parse('graph TD;A--oB;');
          const edges = parser.yy.getEdges();
          expect(edges[0].type).toBe('arrow_circle');
          trackResult('lark', true);
        } catch (error) {
          trackResult('lark', false, error);
          throw error;
        }
      });
    });
  });

  // Test multiple edges
  describe('JISON Parser Multiple Edges Tests', () => {
    it('should handle multiple edges (jison)', async () => {
      await runWithParser('jison', (parser) => {
        try {
          const res = parser.parse(
            'graph TD;A---|This is the 123 s text|B;\nA---|This is the second edge|B;'
          );
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          expect(vert.get('A').id).toBe('A');
          expect(vert.get('B').id).toBe('B');
          expect(edges.length).toBe(2);
          expect(edges[0].start).toBe('A');
          expect(edges[0].end).toBe('B');
          expect(edges[0].type).toBe('arrow_open');
          expect(edges[0].text).toBe('This is the 123 s text');
          expect(edges[0].stroke).toBe('normal');
          expect(edges[1].start).toBe('A');
          expect(edges[1].end).toBe('B');
          expect(edges[1].type).toBe('arrow_open');
          expect(edges[1].text).toBe('This is the second edge');
          expect(edges[1].stroke).toBe('normal');
          trackResult('jison', true);
        } catch (error) {
          trackResult('jison', false, error);
          throw error;
        }
      });
    });
  });

  describe('ANTLR Parser Multiple Edges Tests', () => {
    it('should handle multiple edges (antlr)', async () => {
      await runWithParser('antlr', (parser) => {
        try {
          const res = parser.parse(
            'graph TD;A---|This is the 123 s text|B;\nA---|This is the second edge|B;'
          );
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          expect(vert.get('A').id).toBe('A');
          expect(vert.get('B').id).toBe('B');
          expect(edges.length).toBe(2);
          expect(edges[0].start).toBe('A');
          expect(edges[0].end).toBe('B');
          expect(edges[0].type).toBe('arrow_open');
          expect(edges[0].text).toBe('This is the 123 s text');
          expect(edges[0].stroke).toBe('normal');
          expect(edges[1].start).toBe('A');
          expect(edges[1].end).toBe('B');
          expect(edges[1].type).toBe('arrow_open');
          expect(edges[1].text).toBe('This is the second edge');
          expect(edges[1].stroke).toBe('normal');
          trackResult('antlr', true);
        } catch (error) {
          trackResult('antlr', false, error);
          throw error;
        }
      });
    });
  });

  describe('LARK Parser Multiple Edges Tests', () => {
    it('should handle multiple edges (lark)', async () => {
      await runWithParser('lark', (parser) => {
        try {
          const res = parser.parse(
            'graph TD;A---|This is the 123 s text|B;\nA---|This is the second edge|B;'
          );
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          expect(vert.get('A').id).toBe('A');
          expect(vert.get('B').id).toBe('B');
          expect(edges.length).toBe(2);
          expect(edges[0].start).toBe('A');
          expect(edges[0].end).toBe('B');
          expect(edges[0].type).toBe('arrow_open');
          expect(edges[0].text).toBe('This is the 123 s text');
          expect(edges[0].stroke).toBe('normal');
          expect(edges[1].start).toBe('A');
          expect(edges[1].end).toBe('B');
          expect(edges[1].type).toBe('arrow_open');
          expect(edges[1].text).toBe('This is the second edge');
          expect(edges[1].stroke).toBe('normal');
          trackResult('lark', true);
        } catch (error) {
          trackResult('lark', false, error);
          throw error;
        }
      });
    });
  });

  // Test double-ended edges
  describe('JISON Parser Double-Ended Edge Tests', () => {
    it('should handle double arrow point edges (jison)', async () => {
      await runWithParser('jison', (parser) => {
        try {
          const res = parser.parse('graph TD;\nA <-- text --> B;');
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          expect(vert.get('A').id).toBe('A');
          expect(vert.get('B').id).toBe('B');
          expect(edges.length).toBe(1);
          expect(edges[0].start).toBe('A');
          expect(edges[0].end).toBe('B');
          expect(edges[0].type).toBe('double_arrow_point');
          expect(edges[0].text).toBe('text');
          expect(edges[0].stroke).toBe('normal');
          trackResult('jison', true);
        } catch (error) {
          trackResult('jison', false, error);
          throw error;
        }
      });
    });
  });

  describe('ANTLR Parser Double-Ended Edge Tests', () => {
    it('should handle double arrow point edges (antlr)', async () => {
      await runWithParser('antlr', (parser) => {
        try {
          const res = parser.parse('graph TD;\nA <-- text --> B;');
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          expect(vert.get('A').id).toBe('A');
          expect(vert.get('B').id).toBe('B');
          expect(edges.length).toBe(1);
          expect(edges[0].start).toBe('A');
          expect(edges[0].end).toBe('B');
          expect(edges[0].type).toBe('double_arrow_point');
          expect(edges[0].text).toBe('text');
          expect(edges[0].stroke).toBe('normal');
          trackResult('antlr', true);
        } catch (error) {
          trackResult('antlr', false, error);
          throw error;
        }
      });
    });
  });

  describe('LARK Parser Double-Ended Edge Tests', () => {
    it('should handle double arrow point edges (lark)', async () => {
      await runWithParser('lark', (parser) => {
        try {
          const res = parser.parse('graph TD;\nA <-- text --> B;');
          const vert = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          expect(vert.get('A').id).toBe('A');
          expect(vert.get('B').id).toBe('B');
          expect(edges.length).toBe(1);
          expect(edges[0].start).toBe('A');
          expect(edges[0].end).toBe('B');
          expect(edges[0].type).toBe('double_arrow_point');
          expect(edges[0].text).toBe('text');
          expect(edges[0].stroke).toBe('normal');
          trackResult('lark', true);
        } catch (error) {
          trackResult('lark', false, error);
          throw error;
        }
      });
    });
  });

  describe('Parser Comparison Summary', () => {
    it('should provide comprehensive comparison results', () => {
      // This test always passes and serves as a summary
      expect(true).toBe(true);
    });
  });
});
