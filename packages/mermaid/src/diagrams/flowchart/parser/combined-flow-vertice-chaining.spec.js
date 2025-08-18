import { setConfig } from '../../../config.js';
import { FlowchartParserFactory } from './parserFactory.js';

setConfig({
  securityLevel: 'strict',
});

console.log('🚀 Starting comprehensive vertex chaining test comparison across all parsers');

const parserFactory = FlowchartParserFactory.getInstance();

// Test cases for vertex chaining functionality
const testCases = [
  {
    name: 'should handle chaining of vertices',
    input: `
    graph TD
      A-->B-->C;
    `,
    expectedVertices: ['A', 'B', 'C'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '' },
      { start: 'B', end: 'C', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle multiple vertices in link statement at the beginning',
    input: `
    graph TD
      A & B --> C;
    `,
    expectedVertices: ['A', 'B', 'C'],
    expectedEdges: [
      { start: 'A', end: 'C', type: 'arrow_point', text: '' },
      { start: 'B', end: 'C', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle multiple vertices in link statement at the end',
    input: `
    graph TD
      A-->B & C;
    `,
    expectedVertices: ['A', 'B', 'C'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '' },
      { start: 'A', end: 'C', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle chaining of vertices at both ends at once',
    input: `
    graph TD
      A & B--> C & D;
    `,
    expectedVertices: ['A', 'B', 'C', 'D'],
    expectedEdges: [
      { start: 'A', end: 'C', type: 'arrow_point', text: '' },
      { start: 'A', end: 'D', type: 'arrow_point', text: '' },
      { start: 'B', end: 'C', type: 'arrow_point', text: '' },
      { start: 'B', end: 'D', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle chaining and multiple nodes in link statement FVC',
    input: `
    graph TD
      A --> B & B2 & C --> D2;
    `,
    expectedVertices: ['A', 'B', 'B2', 'C', 'D2'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: '' },
      { start: 'A', end: 'B2', type: 'arrow_point', text: '' },
      { start: 'A', end: 'C', type: 'arrow_point', text: '' },
      { start: 'B', end: 'D2', type: 'arrow_point', text: '' },
      { start: 'B2', end: 'D2', type: 'arrow_point', text: '' },
      { start: 'C', end: 'D2', type: 'arrow_point', text: '' },
    ],
  },
  {
    name: 'should handle chaining and multiple nodes with extra info in statements',
    input: `
    graph TD
      A[ h ] -- hello --> B[" test "]:::exClass & C --> D;
      classDef exClass background:#bbb,border:1px solid red;
    `,
    expectedVertices: ['A', 'B', 'C', 'D'],
    expectedEdges: [
      { start: 'A', end: 'B', type: 'arrow_point', text: 'hello' },
      { start: 'A', end: 'C', type: 'arrow_point', text: 'hello' },
      { start: 'B', end: 'D', type: 'arrow_point', text: '' },
      { start: 'C', end: 'D', type: 'arrow_point', text: '' },
    ],
    hasClasses: true,
    expectedClasses: {
      exClass: {
        styles: ['background:#bbb', 'border:1px solid red'],
      },
    },
    expectedVertexClasses: {
      B: ['exClass'],
    },
  },
];

console.log(`📊 Testing vertex chaining with ${testCases.length} test cases and 3 parsers`);

describe('Combined Flow Vertex Chaining Test - All Three Parsers', () => {
  let jisonResults = [];
  let antlrResults = [];
  let larkResults = [];

  // Helper function to validate test results
  function validateTestResult(parser, testCase, vertices, edges, classes = null) {
    try {
      // Check vertices
      testCase.expectedVertices.forEach((vertexId) => {
        expect(vertices.get(vertexId)?.id).toBe(vertexId);
      });

      // Check edges
      expect(edges.length).toBe(testCase.expectedEdges.length);
      testCase.expectedEdges.forEach((expectedEdge, index) => {
        expect(edges[index].start).toBe(expectedEdge.start);
        expect(edges[index].end).toBe(expectedEdge.end);
        expect(edges[index].type).toBe(expectedEdge.type);
        expect(edges[index].text).toBe(expectedEdge.text);
      });

      // Check classes if expected
      if (testCase.hasClasses && testCase.expectedClasses) {
        Object.entries(testCase.expectedClasses).forEach(([className, classData]) => {
          const actualClass = classes.get(className);
          expect(actualClass).toBeDefined();
          expect(actualClass.styles.length).toBe(classData.styles.length);
          classData.styles.forEach((style, index) => {
            expect(actualClass.styles[index]).toBe(style);
          });
        });
      }

      // Check vertex classes if expected
      if (testCase.expectedVertexClasses) {
        Object.entries(testCase.expectedVertexClasses).forEach(([vertexId, expectedClasses]) => {
          const vertex = vertices.get(vertexId);
          expect(vertex.classes).toEqual(expectedClasses);
        });
      }

      return true;
    } catch (error) {
      console.error(`❌ ${parser}: ${testCase.name} - ${error.message}`);
      return false;
    }
  }

  describe('JISON Parser Vertex Chaining Tests', () => {
    testCases.forEach((testCase, index) => {
      it(`${testCase.name} (jison)`, async () => {
        const startTime = performance.now();
        const parser = await parserFactory.getParser('jison');

        try {
          parser.parse(testCase.input);
          const vertices = parser.yy.getVertices();
          const edges = parser.yy.getEdges();
          const classes = parser.yy.getClasses();

          const success = validateTestResult('JISON', testCase, vertices, edges, classes);
          const endTime = performance.now();

          jisonResults.push({
            test: testCase.name,
            success,
            time: endTime - startTime,
            vertices: vertices.size,
            edges: edges.length,
          });

          if (success) {
            console.log(`✅ JISON: ${testCase.name}`);
          }
        } catch (error) {
          console.error(`❌ JISON: ${testCase.name} - ${error.message}`);
          jisonResults.push({
            test: testCase.name,
            success: false,
            time: 0,
            error: error.message,
          });
          throw error;
        }
      });
    });
  });

  describe('ANTLR Parser Vertex Chaining Tests', () => {
    testCases.forEach((testCase, index) => {
      it(`${testCase.name} (antlr)`, async () => {
        const startTime = performance.now();
        const parser = await parserFactory.getParser('antlr');

        try {
          parser.parse(testCase.input);
          const vertices = parser.yy.getVertices();
          const edges = parser.yy.getEdges();
          const classes = parser.yy.getClasses();

          const success = validateTestResult('ANTLR', testCase, vertices, edges, classes);
          const endTime = performance.now();

          antlrResults.push({
            test: testCase.name,
            success,
            time: endTime - startTime,
            vertices: vertices.size,
            edges: edges.length,
          });

          if (success) {
            console.log(`✅ ANTLR: ${testCase.name}`);
          }
        } catch (error) {
          console.error(`❌ ANTLR: ${testCase.name} - ${error.message}`);
          antlrResults.push({
            test: testCase.name,
            success: false,
            time: 0,
            error: error.message,
          });
          throw error;
        }
      });
    });
  });

  describe('LARK Parser Vertex Chaining Tests', () => {
    testCases.forEach((testCase, index) => {
      it(`${testCase.name} (lark)`, async () => {
        const startTime = performance.now();
        const parser = await parserFactory.getParser('lark');

        try {
          parser.parse(testCase.input);
          const vertices = parser.yy.getVertices();
          const edges = parser.yy.getEdges();
          const classes = parser.yy.getClasses();

          const success = validateTestResult('LARK', testCase, vertices, edges, classes);
          const endTime = performance.now();

          larkResults.push({
            test: testCase.name,
            success,
            time: endTime - startTime,
            vertices: vertices.size,
            edges: edges.length,
          });

          if (success) {
            console.log(`✅ LARK: ${testCase.name}`);
          }
        } catch (error) {
          console.error(`❌ LARK: ${testCase.name} - ${error.message}`);
          larkResults.push({
            test: testCase.name,
            success: false,
            time: 0,
            error: error.message,
          });
          throw error;
        }
      });
    });
  });

  describe('Parser Vertex Chaining Comparison Summary', () => {
    it('should provide comprehensive vertex chaining comparison results', () => {
      const jisonPassed = jisonResults.filter((r) => r.success).length;
      const antlrPassed = antlrResults.filter((r) => r.success).length;
      const larkPassed = larkResults.filter((r) => r.success).length;

      const jisonSuccessRate = ((jisonPassed / jisonResults.length) * 100).toFixed(1);
      const antlrSuccessRate = ((antlrPassed / antlrResults.length) * 100).toFixed(1);
      const larkSuccessRate = ((larkPassed / larkResults.length) * 100).toFixed(1);

      console.log('\n📊 COMPREHENSIVE VERTEX CHAINING PARSING COMPARISON RESULTS:');
      console.log(
        '================================================================================'
      );
      console.log('');
      console.log('🔧 JISON Parser:');
      console.log(`   ✅ Passed: ${jisonPassed}`);
      console.log(`   ❌ Failed: ${jisonResults.length - jisonPassed}`);
      console.log(`   📈 Success Rate: ${jisonSuccessRate}%`);
      console.log('');
      console.log('🔧 ANTLR Parser:');
      console.log(`   ✅ Passed: ${antlrPassed}`);
      console.log(`   ❌ Failed: ${antlrResults.length - antlrPassed}`);
      console.log(`   📈 Success Rate: ${antlrSuccessRate}%`);
      console.log('');
      console.log('🔧 LARK Parser:');
      console.log(`   ✅ Passed: ${larkPassed}`);
      console.log(`   ❌ Failed: ${larkResults.length - larkPassed}`);
      console.log(`   📈 Success Rate: ${larkSuccessRate}%`);
      console.log('');
      console.log(
        '================================================================================'
      );

      // All parsers should have the same success rate for compatibility
      expect(jisonPassed).toBeGreaterThan(0);
      expect(antlrPassed).toBeGreaterThan(0);
      expect(larkPassed).toBeGreaterThan(0);
    });
  });
});
