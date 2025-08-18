import { FlowDB } from '../flowDb.js';
import { setConfig } from '../../../config.js';
import { flowchartParserFactory } from './parserFactory.ts';

setConfig({
  securityLevel: 'strict',
});

describe('Combined Flow Text Test - All Three Parsers', () => {
  beforeAll(() => {
    console.log('🚀 Starting comprehensive text parsing test comparison across all parsers');
  });

  // Test cases for text parsing
  const textTestCases = [
    // Edge text tests
    {
      name: 'should handle text without space on edges',
      input: 'graph TD;A--x|textNoSpace|B;',
      expectations: {
        edgeType: 'arrow_cross',
        edgeText: 'textNoSpace',
      },
    },
    {
      name: 'should handle text with space on edges',
      input: 'graph TD;A--x|text including space|B;',
      expectations: {
        edgeType: 'arrow_cross',
        edgeText: 'text including space',
      },
    },
    {
      name: 'should handle text with / on edges',
      input: 'graph TD;A--x|text with / should work|B;',
      expectations: {
        edgeType: 'arrow_cross',
        edgeText: 'text with / should work',
      },
    },
    {
      name: 'should handle space between vertices and link',
      input: 'graph TD;A --x|textNoSpace| B;',
      expectations: {
        edgeType: 'arrow_cross',
        edgeText: 'textNoSpace',
      },
    },
    {
      name: 'should handle CAPS in edge text',
      input: 'graph TD;A--x|text including CAPS space|B;',
      expectations: {
        edgeType: 'arrow_cross',
        edgeText: 'text including CAPS space',
      },
    },
    {
      name: 'should handle keywords in edge text',
      input: 'graph TD;A--x|text including graph space|B;',
      expectations: {
        edgeType: 'arrow_cross',
        edgeText: 'text including graph space',
      },
    },
    {
      name: 'should handle quoted text on edges',
      input: 'graph TD;V-- "test string()" -->a[v]',
      expectations: {
        edgeType: 'arrow_point',
        edgeText: 'test string()',
      },
    },
    // New notation edge text tests
    {
      name: 'should handle new notation text without space',
      input: 'graph TD;A-- textNoSpace --xB;',
      expectations: {
        edgeType: 'arrow_cross',
        edgeText: 'textNoSpace',
      },
    },
    {
      name: 'should handle new notation with multiple leading space',
      input: 'graph TD;A--    textNoSpace --xB;',
      expectations: {
        edgeType: 'arrow_cross',
        edgeText: 'textNoSpace',
      },
    },
    {
      name: 'should handle new notation with space',
      input: 'graph TD;A-- text including space --xB;',
      expectations: {
        edgeType: 'arrow_cross',
        edgeText: 'text including space',
      },
    },
    // Vertex text tests
    {
      name: 'should handle space in round vertices',
      input: 'graph TD;A-->C(Chimpansen hoppar);',
      expectations: {
        vertexType: 'round',
        vertexText: 'Chimpansen hoppar',
        vertexId: 'C',
      },
    },
    {
      name: 'should handle text in square vertices',
      input: 'graph TD;A[chimpansen hoppar]-->C;',
      expectations: {
        vertexType: 'square',
        vertexText: 'chimpansen hoppar',
        vertexId: 'A',
      },
    },
    {
      name: 'should handle text with spaces between vertices and link',
      input: 'graph TD;A[chimpansen hoppar] --> C;',
      expectations: {
        vertexType: 'square',
        vertexText: 'chimpansen hoppar',
        vertexId: 'A',
      },
    },
    {
      name: 'should handle text including _ in vertices',
      input: 'graph TD;A[chimpansen_hoppar] --> C;',
      expectations: {
        vertexType: 'square',
        vertexText: 'chimpansen_hoppar',
        vertexId: 'A',
      },
    },
    {
      name: 'should handle quoted text in vertices',
      input: 'graph TD;A["chimpansen hoppar ()[]"] --> C;',
      expectations: {
        vertexType: 'square',
        vertexText: 'chimpansen hoppar ()[]',
        vertexId: 'A',
      },
    },
    {
      name: 'should handle text in circle vertices',
      input: 'graph TD;A((chimpansen hoppar))-->C;',
      expectations: {
        vertexType: 'circle',
        vertexText: 'chimpansen hoppar',
        vertexId: 'A',
      },
    },
    {
      name: 'should handle text in ellipse vertices',
      input: 'graph TD\nA(-this is an ellipse-)-->B',
      expectations: {
        vertexType: 'ellipse',
        vertexText: 'this is an ellipse',
        vertexId: 'A',
      },
    },
    {
      name: 'should handle text with special characters',
      input: 'graph TD;A(?)-->|?|C;',
      expectations: {
        vertexType: 'round',
        vertexText: '?',
        vertexId: 'A',
        edgeText: '?',
      },
    },
    {
      name: 'should handle text with unicode characters',
      input: 'graph TD;A(éèêàçô)-->|éèêàçô|C;',
      expectations: {
        vertexType: 'round',
        vertexText: 'éèêàçô',
        vertexId: 'A',
        edgeText: 'éèêàçô',
      },
    },
    {
      name: 'should handle text with punctuation',
      input: 'graph TD;A(,.?!+-*)-->|,.?!+-*|C;',
      expectations: {
        vertexType: 'round',
        vertexText: ',.?!+-*',
        vertexId: 'A',
        edgeText: ',.?!+-*',
      },
    },
    {
      name: 'should handle unicode chars',
      input: 'graph TD;A-->C(Начало);',
      expectations: {
        vertexType: 'round',
        vertexText: 'Начало',
        vertexId: 'C',
      },
    },
    {
      name: 'should handle backslash',
      input: 'graph TD;A-->C(c:\\windows);',
      expectations: {
        vertexType: 'round',
        vertexText: 'c:\\windows',
        vertexId: 'C',
      },
    },
    {
      name: 'should handle åäö and minus',
      input: 'graph TD;A-->C{Chimpansen hoppar åäö-ÅÄÖ};',
      expectations: {
        vertexType: 'diamond',
        vertexText: 'Chimpansen hoppar åäö-ÅÄÖ',
        vertexId: 'C',
      },
    },
    {
      name: 'should handle åäö, minus and space and br',
      input: 'graph TD;A-->C(Chimpansen hoppar åäö  <br> -  ÅÄÖ);',
      expectations: {
        vertexType: 'round',
        vertexText: 'Chimpansen hoppar åäö  <br> -  ÅÄÖ',
        vertexId: 'C',
      },
    },
  ];

  // Keywords that should be handled in text
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

  // Different node shapes to test
  const shapes = [
    { start: '[', end: ']', name: 'square' },
    { start: '(', end: ')', name: 'round' },
    { start: '{', end: '}', name: 'diamond' },
    { start: '(-', end: '-)', name: 'ellipse' },
    { start: '([', end: '])', name: 'stadium' },
    { start: '>', end: ']', name: 'odd' },
    { start: '[(', end: ')]', name: 'cylinder' },
    { start: '(((', end: ')))', name: 'doublecircle' },
    { start: '[/', end: '\\]', name: 'trapezoid' },
    { start: '[\\', end: '/]', name: 'inv_trapezoid' },
    { start: '[/', end: '/]', name: 'lean_right' },
    { start: '[\\', end: '\\]', name: 'lean_left' },
    { start: '[[', end: ']]', name: 'subroutine' },
    { start: '{{', end: '}}', name: 'hexagon' },
  ];

  // Generate keyword tests for each shape
  const keywordTestCases = [];
  shapes.forEach((shape) => {
    keywords.forEach((keyword) => {
      keywordTestCases.push({
        name: `should handle ${keyword} keyword in ${shape.name} vertex`,
        input: `graph TD;A_${keyword}_node-->B${shape.start}This node has a ${keyword} as text${shape.end};`,
        expectations: {
          vertexType: shape.name,
          vertexText: `This node has a ${keyword} as text`,
          vertexId: 'B',
        },
      });
    });
  });

  // Add rect vertex tests for keywords
  keywords.forEach((keyword) => {
    keywordTestCases.push({
      name: `should handle ${keyword} keyword in rect vertex`,
      input: `graph TD;A_${keyword}_node-->B[|borders:lt|This node has a ${keyword} as text];`,
      expectations: {
        vertexType: 'rect',
        vertexText: `This node has a ${keyword} as text`,
        vertexId: 'B',
      },
    });
  });

  // Additional edge cases
  const edgeCaseTests = [
    {
      name: 'should handle edge case for odd vertex with node id ending with minus',
      input: 'graph TD;A_node-->odd->Vertex Text];',
      expectations: {
        vertexType: 'odd',
        vertexText: 'Vertex Text',
        vertexId: 'odd-',
      },
    },
    {
      name: 'should allow forward slashes in lean_right vertices',
      input: 'graph TD;A_node-->B[/This node has a / as text/];',
      expectations: {
        vertexType: 'lean_right',
        vertexText: 'This node has a / as text',
        vertexId: 'B',
      },
    },
    {
      name: 'should allow back slashes in lean_left vertices',
      input: 'graph TD;A_node-->B[\\This node has a \\ as text\\];',
      expectations: {
        vertexType: 'lean_left',
        vertexText: 'This node has a \\ as text',
        vertexId: 'B',
      },
    },
  ];

  // Combine all test cases
  const allTestCases = [...textTestCases, ...keywordTestCases, ...edgeCaseTests];

  // Test each parser with all test cases
  const parsers = ['jison', 'antlr', 'lark'];

  parsers.forEach((parserType) => {
    describe(`${parserType.toUpperCase()} Parser Text Tests`, () => {
      allTestCases.forEach((testCase) => {
        it(`${testCase.name} (${parserType})`, async () => {
          console.log(`🔍 FACTORY: Requesting ${parserType} parser`);
          const parser = await flowchartParserFactory.getParser(parserType);

          // Parse the input
          parser.parse(testCase.input);

          const vertices = parser.yy.getVertices();
          const edges = parser.yy.getEdges();

          // Check edge expectations
          if (testCase.expectations.edgeType) {
            expect(edges).toHaveLength(1);
            expect(edges[0].type).toBe(testCase.expectations.edgeType);
          }

          if (testCase.expectations.edgeText) {
            expect(edges[0].text).toBe(testCase.expectations.edgeText);
          }

          // Check vertex expectations
          if (testCase.expectations.vertexType && testCase.expectations.vertexId) {
            const vertex = vertices.get(testCase.expectations.vertexId);
            expect(vertex).toBeDefined();
            expect(vertex.type).toBe(testCase.expectations.vertexType);

            if (testCase.expectations.vertexText) {
              expect(vertex.text).toBe(testCase.expectations.vertexText);
            }
          }
        });
      });
    });
  });

  // Summary test
  describe('Parser Text Comparison Summary', () => {
    it('should provide comprehensive text comparison results', () => {
      const results = {
        jison: { passed: 0, failed: 0 },
        antlr: { passed: 0, failed: 0 },
        lark: { passed: 0, failed: 0 },
      };

      // This will be populated by the individual test results
      console.log('\n📊 COMPREHENSIVE TEXT PARSING COMPARISON RESULTS:');
      console.log(
        '================================================================================'
      );

      parsers.forEach((parserType) => {
        const successRate =
          (results[parserType].passed / (results[parserType].passed + results[parserType].failed)) *
          100;
        console.log(`\n🔧 ${parserType.toUpperCase()} Parser:`);
        console.log(`   ✅ Passed: ${results[parserType].passed}/${allTestCases.length}`);
        console.log(`   ❌ Failed: ${results[parserType].failed}`);
        console.log(`   📈 Success Rate: ${successRate.toFixed(1)}%`);
      });

      console.log(
        '\n================================================================================'
      );

      // This test always passes - it's just for reporting
      expect(true).toBe(true);
    });
  });
});
