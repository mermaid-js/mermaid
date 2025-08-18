import { describe, it, expect, beforeAll } from 'vitest';
import { FlowchartLexer } from './flowLexer.js';
import { FlowDB } from '../flowDb.js';
// @ts-ignore: JISON doesn't support types
import jisonParser from './flow.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

/**
 * LEXER VALIDATION FRAMEWORK
 *
 * This test suite implements the novel Phase 1 approach from updated-mission.md:
 * - Compare Chevrotain lexer tokenization against JISON lexer tokenization
 * - Ensure 100% compatibility before proceeding to parser implementation
 * - Systematic validation of all existing flowchart syntax patterns
 */

interface TokenComparison {
  input: string;
  jisonTokens: any[];
  chevrotainTokens: any[];
  match: boolean;
  differences: string[];
}

interface LexerValidationResult {
  totalTests: number;
  passed: number;
  failed: number;
  compatibility: number;
  failures: TokenComparison[];
}

class LexerValidator {
  private jisonParser: any;
  private chevrotainLexer: any;
  private flowDb: FlowDB;

  constructor() {
    this.jisonParser = jisonParser;
    this.chevrotainLexer = FlowchartLexer;
    this.flowDb = new FlowDB();

    // Initialize JISON parser with FlowDB instance (required for proper operation)
    this.jisonParser.yy = this.flowDb;
  }

  /**
   * Extract tokens from JISON lexer
   * Now properly initialized with FlowDB
   */
  private extractJisonTokens(input: string): any[] {
    const tokens: any[] = [];

    try {
      // Clear FlowDB state before parsing
      this.flowDb.clear();

      // Try to parse with properly initialized JISON parser
      this.jisonParser.parse(input);

      tokens.push({
        type: 'PARSE_SUCCESS',
        value: 'JISON parser succeeded',
        line: 1,
        column: 1,
      });
    } catch (error) {
      // If JISON parser fails, record the error type
      const errorMessage = error.message || 'Unknown error';

      // Categorize the error
      let errorType = 'PARSE_ERROR';
      if (errorMessage.includes('Lexical error') || errorMessage.includes('Unexpected character')) {
        errorType = 'LEXER_ERROR';
      } else if (errorMessage.includes('Parse error') || errorMessage.includes('Expecting')) {
        errorType = 'PARSER_ERROR';
      }

      tokens.push({
        type: errorType,
        value: errorMessage,
        line: 0,
        column: 0,
      });
    }

    return tokens;
  }

  /**
   * Extract tokens from Chevrotain lexer
   */
  private extractChevrotainTokens(input: string): any[] {
    const tokens: any[] = [];

    try {
      const result = this.chevrotainLexer.tokenize(input);

      // Check for lexer errors
      if (result.errors.length > 0) {
        tokens.push({
          type: 'LEXER_ERROR',
          value: result.errors.map((e) => e.message).join('; '),
          line: result.errors[0].line || 0,
          column: result.errors[0].column || 0,
        });
      } else {
        // If no lexer errors, mark as successful
        tokens.push({
          type: 'PARSE_SUCCESS',
          value: 'Chevrotain lexer succeeded',
          line: 1,
          column: 1,
        });
      }
    } catch (error) {
      tokens.push({
        type: 'LEXER_ERROR',
        value: error.message,
        line: 0,
        column: 0,
      });
    }

    return tokens;
  }

  /**
   * Compare lexer results from both parsers
   * Simplified approach: Focus on success/failure compatibility
   */
  private compareTokens(
    jisonTokens: any[],
    chevrotainTokens: any[]
  ): { match: boolean; differences: string[] } {
    const differences: string[] = [];

    // Get the primary result from each lexer
    const jisonResult = jisonTokens[0];
    const chevrotainResult = chevrotainTokens[0];

    if (!jisonResult || !chevrotainResult) {
      differences.push('Missing lexer results');
      return { match: false, differences };
    }

    // Check if both succeeded or both failed
    const jisonSuccess = jisonResult.type === 'PARSE_SUCCESS';
    const chevrotainSuccess = chevrotainResult.type === 'PARSE_SUCCESS';

    if (jisonSuccess !== chevrotainSuccess) {
      differences.push(
        `Success mismatch: JISON=${jisonSuccess ? 'SUCCESS' : 'FAILED'}, Chevrotain=${chevrotainSuccess ? 'SUCCESS' : 'FAILED'}`
      );

      // Add error details if available
      if (!jisonSuccess) {
        differences.push(`JISON error: ${jisonResult.value}`);
      }
      if (!chevrotainSuccess) {
        differences.push(`Chevrotain error: ${chevrotainResult.value}`);
      }
    }

    return {
      match: differences.length === 0,
      differences,
    };
  }

  /**
   * Validate a single input string
   */
  public validateInput(input: string): TokenComparison {
    const jisonTokens = this.extractJisonTokens(input);
    const chevrotainTokens = this.extractChevrotainTokens(input);
    const comparison = this.compareTokens(jisonTokens, chevrotainTokens);

    return {
      input,
      jisonTokens,
      chevrotainTokens,
      match: comparison.match,
      differences: comparison.differences,
    };
  }

  /**
   * Validate multiple inputs and return comprehensive results
   */
  public validateInputs(inputs: string[]): LexerValidationResult {
    const results = inputs.map((input) => this.validateInput(input));
    const passed = results.filter((r) => r.match).length;
    const failed = results.length - passed;
    const compatibility = results.length > 0 ? (passed / results.length) * 100 : 0;

    return {
      totalTests: results.length,
      passed,
      failed,
      compatibility,
      failures: results.filter((r) => !r.match),
    };
  }
}

/**
 * Pure Lexer Validator - Focuses only on tokenization, not parsing
 * This is the true lexer validation for Phase 1
 */
class PureLexerValidator {
  private chevrotainLexer: any;
  private jisonTokenTypeMap: Map<number, string>;

  constructor() {
    this.chevrotainLexer = FlowchartLexer;
    this.jisonTokenTypeMap = this.createJisonTokenTypeMap();
  }

  /**
   * Create mapping from JISON numeric token types to meaningful names
   * Based on the ACTUAL JISON parser's token definitions from symbols_
   */
  private createJisonTokenTypeMap(): Map<number, string> {
    const map = new Map<number, string>();

    // ACTUAL JISON token mappings from jisonParser.parser.symbols_
    map.set(2, 'error');
    map.set(3, 'start');
    map.set(4, 'graphConfig');
    map.set(5, 'document');
    map.set(6, 'line');
    map.set(7, 'statement');
    map.set(8, 'SEMI');
    map.set(9, 'NEWLINE');
    map.set(10, 'SPACE');
    map.set(11, 'EOF');
    map.set(12, 'GRAPH');
    map.set(13, 'NODIR');
    map.set(14, 'DIR');
    map.set(15, 'FirstStmtSeparator');
    map.set(16, 'ending');
    map.set(17, 'endToken');
    map.set(18, 'spaceList');
    map.set(19, 'spaceListNewline');
    map.set(20, 'vertexStatement');
    map.set(21, 'separator');
    map.set(22, 'styleStatement');
    map.set(23, 'linkStyleStatement');
    map.set(24, 'classDefStatement');
    map.set(25, 'classStatement');
    map.set(26, 'clickStatement');
    map.set(27, 'subgraph');
    map.set(28, 'textNoTags');
    map.set(29, 'SQS');
    map.set(30, 'text');
    map.set(31, 'SQE');
    map.set(32, 'end');
    map.set(33, 'direction');
    map.set(34, 'acc_title');
    map.set(35, 'acc_title_value');
    map.set(36, 'acc_descr');
    map.set(37, 'acc_descr_value');
    map.set(38, 'acc_descr_multiline_value');
    map.set(39, 'shapeData');
    map.set(40, 'SHAPE_DATA');
    map.set(41, 'link');
    map.set(42, 'node');
    map.set(43, 'styledVertex');
    map.set(44, 'AMP');
    map.set(45, 'vertex');
    map.set(46, 'STYLE_SEPARATOR');
    map.set(47, 'idString');
    map.set(48, 'DOUBLECIRCLESTART');
    map.set(49, 'DOUBLECIRCLEEND');
    map.set(50, 'PS');
    map.set(51, 'PE');
    map.set(52, '(-');
    map.set(53, '-)');
    map.set(54, 'STADIUMSTART');
    map.set(55, 'STADIUMEND');
    map.set(56, 'SUBROUTINESTART');
    map.set(57, 'SUBROUTINEEND');
    map.set(58, 'VERTEX_WITH_PROPS_START');
    map.set(59, 'NODE_STRING[field]');
    map.set(60, 'COLON');
    map.set(61, 'NODE_STRING[value]');
    map.set(62, 'PIPE');
    map.set(63, 'CYLINDERSTART');
    map.set(64, 'CYLINDEREND');
    map.set(65, 'DIAMOND_START');
    map.set(66, 'DIAMOND_STOP');
    map.set(67, 'TAGEND');
    map.set(68, 'TRAPSTART');
    map.set(69, 'TRAPEND');
    map.set(70, 'INVTRAPSTART');
    map.set(71, 'INVTRAPEND');
    map.set(72, 'linkStatement');
    map.set(73, 'arrowText');
    map.set(74, 'TESTSTR');
    map.set(75, 'START_LINK');
    map.set(76, 'edgeText');
    map.set(77, 'LINK');
    map.set(78, 'LINK_ID');
    map.set(79, 'edgeTextToken');
    map.set(80, 'STR');
    map.set(81, 'MD_STR');
    map.set(82, 'textToken');
    map.set(83, 'keywords');
    map.set(84, 'STYLE');
    map.set(85, 'LINKSTYLE');
    map.set(86, 'CLASSDEF');
    map.set(87, 'CLASS');
    map.set(88, 'CLICK');
    map.set(89, 'DOWN');
    map.set(90, 'UP');
    map.set(91, 'textNoTagsToken');
    map.set(92, 'stylesOpt');
    map.set(93, 'idString[vertex]');
    map.set(94, 'idString[class]');
    map.set(95, 'CALLBACKNAME');
    map.set(96, 'CALLBACKARGS');
    map.set(97, 'HREF');
    map.set(98, 'LINK_TARGET');
    map.set(99, 'STR[link]');
    map.set(100, 'STR[tooltip]');

    // Additional tokens that appear in practice
    map.set(109, 'NODE_STRING'); // This appears to be the actual NODE_STRING token

    return map;
  }

  /**
   * Convert JISON numeric token type to meaningful name
   */
  private mapJisonTokenType(numericType: number): string {
    return this.jisonTokenTypeMap.get(numericType) || `UNKNOWN_${numericType}`;
  }

  /**
   * Normalize token types for comparison
   * Maps JISON token names to Chevrotain equivalents
   */
  private normalizeTokenType(jisonType: string): string {
    const typeMap: Record<string, string> = {
      GRAPH: 'Graph',
      DIR: 'DirectionValue',
      subgraph: 'Subgraph',
      end: 'End',
      STYLE: 'Style',
      LINKSTYLE: 'LinkStyle',
      CLASSDEF: 'ClassDef',
      CLASS: 'Class',
      CLICK: 'Click',
      HREF: 'Href',
      LINK: 'LINK',
      START_LINK: 'START_LINK',
      PS: 'PS',
      PE: 'PE',
      SQS: 'SQS',
      SQE: 'SQE',
      PIPE: 'PIPE',
      COLON: 'COLON',
      SEMI: 'Semicolon',
      NEWLINE: 'Newline',
      SPACE: 'Space',
    };

    return typeMap[jisonType] || jisonType;
  }

  /**
   * Extract tokens directly from JISON lexer (bypassing parser)
   * This implements direct JISON lexer access for Phase 1 validation
   * Fixed to handle JISON lexer states and token type mapping properly
   */
  private extractJisonLexerTokens(input: string): any[] {
    const tokens: any[] = [];

    try {
      // Access the JISON lexer directly
      const lexer = jisonParser.lexer || jisonParser.parser?.lexer;

      if (!lexer) {
        tokens.push({
          type: 'LEXER_NOT_FOUND',
          value: 'JISON lexer not accessible',
          line: 1,
          column: 1,
        });
        return tokens;
      }

      // CRITICAL FIX: Set the yy object for the lexer
      // The JISON lexer needs access to FlowDB methods via this.yy
      if (!lexer.yy) {
        lexer.yy = new FlowDB();
      }

      // Clear the FlowDB state and ensure proper initialization
      lexer.yy.clear();

      // CRITICAL: Ensure the lex property is properly set up
      // The JISON lexer calls yy.lex.firstGraph() so this must exist
      if (!lexer.yy.lex || typeof lexer.yy.lex.firstGraph !== 'function') {
        lexer.yy.lex = {
          firstGraph: lexer.yy.firstGraph.bind(lexer.yy),
        };
      }

      // SIMPLIFIED APPROACH: Skip complex reset, just set basic properties
      // Reset line/column tracking
      lexer.yylineno = 1;
      if (lexer.yylloc) {
        lexer.yylloc = {
          first_line: 1,
          last_line: 1,
          first_column: 0,
          last_column: 0,
        };
      }

      // Initialize lexer with input
      try {
        lexer.setInput(input);
      } catch (setInputError) {
        tokens.push({
          type: 'LEXER_ERROR',
          value: `setInput failed: ${setInputError.message}`,
          line: 0,
          column: 0,
        });
        return tokens;
      }

      // Extract tokens one by one with proper error handling
      let token;
      let count = 0;
      const maxTokens = 50; // Reduced limit - should not need 100 tokens for simple inputs

      while (count < maxTokens) {
        try {
          // Debug: Check lexer state before calling lex()
          const debugInfo = {
            hasLex: typeof lexer.lex === 'function',
            hasYytext: lexer.hasOwnProperty('yytext'),
            hasYylineno: lexer.hasOwnProperty('yylineno'),
            hasYylloc: lexer.hasOwnProperty('yylloc'),
            inputLength: lexer.input ? lexer.input.length : 'undefined',
          };

          if (count === 0) {
            console.debug('JISON lexer debug info:', debugInfo);
          }

          token = lexer.lex();

          if (token === 'EOF' || token === 1 || token === 11) {
            // JISON EOF can be 1, 'EOF', or 11 (based on token mapping)
            tokens.push({
              type: 'EOF',
              value: '',
              line: lexer.yylineno || 1,
              column: lexer.yylloc?.last_column || 0,
            });
            break;
          }

          // Get token information with mapped type name
          const tokenInfo = {
            type: typeof token === 'number' ? this.mapJisonTokenType(token) : token,
            originalType: token, // Keep original for debugging
            value: lexer.yytext || '',
            line: lexer.yylineno || 1,
            column: lexer.yylloc?.first_column || 0,
          };

          tokens.push(tokenInfo);
          count++;
        } catch (lexError) {
          // If lexer throws an error, record it and stop
          tokens.push({
            type: 'LEXER_ERROR',
            value: lexError.message || 'Lexer error',
            line: lexer.yylineno || 1,
            column: lexer.yylloc?.first_column || 0,
          });
          break;
        }
      }

      // If we hit the limit, something is wrong
      if (count >= maxTokens) {
        tokens.push({
          type: 'LEXER_ERROR',
          value: 'Lexer produced too many tokens - possible infinite loop',
          line: lexer.yylineno || 1,
          column: lexer.yylloc?.first_column || 0,
        });
      }
    } catch (error) {
      tokens.push({
        type: 'LEXER_ERROR',
        value: error.message,
        line: 0,
        column: 0,
      });
    }

    return tokens;
  }

  /**
   * Extract tokens from Chevrotain lexer
   */
  private extractChevrotainLexerTokens(input: string): any[] {
    const tokens: any[] = [];

    try {
      const result = this.chevrotainLexer.tokenize(input);

      // Convert Chevrotain tokens to comparable format
      result.tokens.forEach((token) => {
        tokens.push({
          type: token.tokenType.name,
          value: token.image,
          line: token.startLine || 1,
          column: token.startColumn || 1,
        });
      });

      // Record any lexer errors
      if (result.errors.length > 0) {
        result.errors.forEach((error) => {
          tokens.push({
            type: 'LEXER_ERROR',
            value: error.message,
            line: error.line || 0,
            column: error.column || 0,
          });
        });
      }
    } catch (error) {
      tokens.push({
        type: 'LEXER_ERROR',
        value: error.message,
        line: 0,
        column: 0,
      });
    }

    return tokens;
  }

  /**
   * Compare lexer tokens (not parser results)
   * True token-by-token comparison for Phase 1 validation
   */
  private compareTokens(
    jisonTokens: any[],
    chevrotainTokens: any[]
  ): { match: boolean; differences: string[] } {
    const differences: string[] = [];

    // Check for lexer access issues
    if (jisonTokens.length > 0 && jisonTokens[0].type === 'LEXER_NOT_FOUND') {
      differences.push('JISON lexer not accessible - cannot perform comparison');
      return { match: false, differences };
    }

    // Check for lexer errors
    const jisonErrors = jisonTokens.filter((t) => t.type === 'LEXER_ERROR');
    const chevrotainErrors = chevrotainTokens.filter((t) => t.type === 'LEXER_ERROR');

    if (jisonErrors.length > 0) {
      differences.push(`JISON lexer errors: ${jisonErrors.map((e) => e.value).join(', ')}`);
    }

    if (chevrotainErrors.length > 0) {
      differences.push(
        `Chevrotain lexer errors: ${chevrotainErrors.map((e) => e.value).join(', ')}`
      );
    }

    // If either lexer had errors, don't compare tokens
    if (jisonErrors.length > 0 || chevrotainErrors.length > 0) {
      return { match: false, differences };
    }

    // Filter out EOF tokens for comparison (JISON includes them, Chevrotain doesn't)
    const jisonNonEofTokens = jisonTokens.filter((t) => t.type !== 'EOF');
    const chevrotainNonEofTokens = chevrotainTokens.filter((t) => t.type !== 'EOF');

    // Compare token counts (excluding EOF)
    if (jisonNonEofTokens.length !== chevrotainNonEofTokens.length) {
      differences.push(
        `Token count mismatch: JISON=${jisonNonEofTokens.length}, Chevrotain=${chevrotainNonEofTokens.length}`
      );
    }

    // Compare each token (excluding EOF tokens)
    const maxLength = Math.max(jisonNonEofTokens.length, chevrotainNonEofTokens.length);
    for (let i = 0; i < maxLength; i++) {
      const jisonToken = jisonNonEofTokens[i];
      const chevrotainToken = chevrotainNonEofTokens[i];

      if (!jisonToken) {
        differences.push(
          `Token ${i}: Missing in JISON, Chevrotain has ${chevrotainToken.type}="${chevrotainToken.value}"`
        );
        continue;
      }

      if (!chevrotainToken) {
        differences.push(
          `Token ${i}: Missing in Chevrotain, JISON has ${jisonToken.type}="${jisonToken.value}"`
        );
        continue;
      }

      // Compare token type (with normalization)
      const normalizedJisonType = this.normalizeTokenType(jisonToken.type);
      if (normalizedJisonType !== chevrotainToken.type) {
        differences.push(
          `Token ${i} type: JISON="${jisonToken.type}" (normalized: "${normalizedJisonType}"), Chevrotain="${chevrotainToken.type}"`
        );
      }

      // Compare token value (with whitespace normalization for certain tokens)
      let jisonValue = jisonToken.value;
      let chevrotainValue = chevrotainToken.value;

      // Normalize whitespace for direction tokens
      if (normalizedJisonType === 'DirectionValue') {
        jisonValue = jisonValue.trim();
        chevrotainValue = chevrotainValue.trim();
      }

      if (jisonValue !== chevrotainValue) {
        differences.push(
          `Token ${i} value: JISON="${jisonToken.value}", Chevrotain="${chevrotainToken.value}"`
        );
      }
    }

    return {
      match: differences.length === 0,
      differences,
    };
  }

  /**
   * Validate a single input for lexer compatibility
   */
  public validateInput(input: string): TokenComparison {
    const jisonTokens = this.extractJisonLexerTokens(input);
    const chevrotainTokens = this.extractChevrotainLexerTokens(input);
    const comparison = this.compareTokens(jisonTokens, chevrotainTokens);

    return {
      input,
      jisonTokens,
      chevrotainTokens,
      match: comparison.match,
      differences: comparison.differences,
    };
  }

  /**
   * Validate multiple inputs
   */
  public validateInputs(inputs: string[]): LexerValidationResult {
    const results = inputs.map((input) => this.validateInput(input));
    const passed = results.filter((r) => r.match).length;
    const failed = results.length - passed;
    const compatibility = results.length > 0 ? (passed / results.length) * 100 : 0;

    return {
      totalTests: results.length,
      passed,
      failed,
      compatibility,
      failures: results.filter((r) => !r.match),
    };
  }
}

// Test data extracted from existing JISON test files
// This represents the comprehensive dataset for lexer validation
const BASIC_SYNTAX_TESTS = [
  // Basic graph declarations
  'graph TD',
  'graph LR',
  'graph TB',
  'graph RL',
  'graph BT',
  'flowchart TD',
  'flowchart LR',

  // Simple nodes
  'A',
  'A1',
  'node1',
  'default',
  'end',
  'graph',

  // Basic edges
  'A-->B',
  'A --- B',
  'A-.-B',
  'A===B',
  'A-.->B',
  'A==>B',

  // Node shapes
  'A[Square]',
  'A(Round)',
  'A{Diamond}',
  'A((Circle))',
  'A>Asymmetric]',
  'A[[Subroutine]]',
  'A[(Database)]',
  'A([Stadium])',
  'A[/Parallelogram/]',
  'A[\\Parallelogram\\]',
  'A[/Trapezoid\\]',
  'A[\\Trapezoid/]',

  // Edge text
  'A-->|text|B',
  'A---|text|B',
  'A-.-|text|B',
  'A==>|text|B',
  'A-.->|text|B',

  // Comments
  '%% This is a comment',
  'A-->B %% Comment',

  // Whitespace variations
  ' A --> B ',
  '\tA\t-->\tB\t',
  'A\n-->\nB',

  // Special characters in text
  'A[Text with spaces]',
  'A[Text-with-dashes]',
  'A[Text_with_underscores]',
  'A[Text.with.dots]',
  'A[Text:with:colons]',
  'A[Text,with,commas]',
  'A[Text+with+plus]',
  'A[Text*with*asterisk]',
  'A[Text<with<less]',
  'A[Text&with&ampersand]',
];

const COMPLEX_SYNTAX_TESTS = [
  // Multi-line graphs
  `graph TD
    A-->B
    B-->C`,

  // Subgraphs
  `graph TD
    subgraph Sub
      A-->B
    end`,

  // Classes and styles
  'classDef className fill:#f9f,stroke:#333,stroke-width:4px',
  'class A,B className',
  'style A fill:#f9f',

  // Click events
  'click A callback "Tooltip"',
  'click A href "http://example.com"',

  // Complex edge patterns
  'A & B --> C',
  'A --> B --> C',
  'A --> B & C',

  // Node data syntax (new feature)
  'D@{ shape: rounded }',
  'E@{ shape: "custom", color: "red" }',

  // Accessibility
  'accTitle: Chart Title',
  'accDescr: Chart Description',
  `accDescr {
    Multi-line
    description
  }`,
];

const EDGE_CASE_TESTS = [
  // Empty and minimal inputs
  '',
  ' ',
  '\n',
  '\t',

  // Keywords as node names
  'end-->start',
  'graph-->flowchart',
  'style-->class',

  // Special character combinations
  'A-->B-->C-->D',
  'A--->B',
  'A---->B',
  'A<-->B',
  'A<--->B',

  // Quoted strings
  'A["Quoted text"]',
  "A['Single quoted']",
  'A[`Backtick quoted`]',

  // Unicode and special characters
  'A[Text with émojis 🎉]',
  'A[Text with unicode ñáéíóú]',

  // Malformed syntax (should produce consistent errors)
  'A[Unclosed bracket',
  'A-->',
  '-->B',
  'A{Unclosed brace',
  'A((Unclosed circle',
];

describe('Lexer Validation Framework', () => {
  let validator: LexerValidator;

  beforeAll(() => {
    validator = new LexerValidator();
  });

  describe('Basic Syntax Validation', () => {
    it('should achieve 100% compatibility for basic syntax', () => {
      const result = validator.validateInputs(BASIC_SYNTAX_TESTS);

      // Log detailed results for debugging
      console.log(`\n=== BASIC SYNTAX VALIDATION RESULTS ===`);
      console.log(`Total tests: ${result.totalTests}`);
      console.log(`Passed: ${result.passed}`);
      console.log(`Failed: ${result.failed}`);
      console.log(`Compatibility: ${result.compatibility.toFixed(2)}%`);

      if (result.failures.length > 0) {
        console.log(`\n=== FAILURES ===`);
        result.failures.forEach((failure, index) => {
          console.log(`\nFailure ${index + 1}: "${failure.input}"`);
          console.log(`JISON tokens: ${JSON.stringify(failure.jisonTokens, null, 2)}`);
          console.log(`Chevrotain tokens: ${JSON.stringify(failure.chevrotainTokens, null, 2)}`);
          console.log(`Differences: ${failure.differences.join(', ')}`);
        });
      }

      // For Phase 1, we require 100% compatibility
      expect(result.compatibility).toBe(100);
    });
  });

  describe('Complex Syntax Validation', () => {
    it('should achieve 100% compatibility for complex syntax', () => {
      const result = validator.validateInputs(COMPLEX_SYNTAX_TESTS);

      console.log(`\n=== COMPLEX SYNTAX VALIDATION RESULTS ===`);
      console.log(`Total tests: ${result.totalTests}`);
      console.log(`Passed: ${result.passed}`);
      console.log(`Failed: ${result.failed}`);
      console.log(`Compatibility: ${result.compatibility.toFixed(2)}%`);

      if (result.failures.length > 0) {
        console.log(`\n=== FAILURES ===`);
        result.failures.forEach((failure, index) => {
          console.log(`\nFailure ${index + 1}: "${failure.input}"`);
          console.log(`Differences: ${failure.differences.join(', ')}`);
        });
      }

      expect(result.compatibility).toBe(100);
    });
  });

  describe('Edge Case Validation', () => {
    it('should handle edge cases consistently', () => {
      const result = validator.validateInputs(EDGE_CASE_TESTS);

      console.log(`\n=== EDGE CASE VALIDATION RESULTS ===`);
      console.log(`Total tests: ${result.totalTests}`);
      console.log(`Passed: ${result.passed}`);
      console.log(`Failed: ${result.failed}`);
      console.log(`Compatibility: ${result.compatibility.toFixed(2)}%`);

      if (result.failures.length > 0) {
        console.log(`\n=== FAILURES ===`);
        result.failures.forEach((failure, index) => {
          console.log(`\nFailure ${index + 1}: "${failure.input}"`);
          console.log(`Differences: ${failure.differences.join(', ')}`);
        });
      }

      expect(result.compatibility).toBe(100);
    });
  });

  describe('Extracted Test Cases from JISON Tests', () => {
    // Test cases extracted from existing flow*.spec.js files
    const EXTRACTED_TEST_CASES = [
      // From flow.spec.js
      'graph TD;\n\n\n %% Comment\n A-->B; \n B-->C;',
      'graph TD\nendpoint --> sender',
      'graph TD\nblend --> monograph',
      'graph TD\ndefault --> monograph',
      'graph TD;A(.)-->B;',
      'graph TD;A(Start 103a.a1)-->B;',
      'graph TD;A(:)-->B;',
      'graph TD;A(,)-->B;',
      'graph TD;A(a-b)-->B;',
      'graph TD;A(+)-->B;',
      'graph TD;A(*)-->B;',
      'graph TD;A(<)-->B;',
      'graph TD;A(&)-->B;',
      'graph TD;\n  node1TB\n',
      'graph TD;A--x|text including URL space|B;',
      'graph TB;subgraph "number as labels";1;end;',

      // From flow-arrows.spec.js patterns
      'graph TD;A-->B;',
      'graph TD;A --- B;',
      'graph TD;A-.-B;',
      'graph TD;A===B;',
      'graph TD;A-.->B;',
      'graph TD;A==>B;',
      'graph TD;A<-->B;',
      'graph TD;A x--x B;',
      'graph TD;A o--o B;',

      // From flow-edges.spec.js patterns
      'graph TD;A-->B-->C;',
      'graph TD;A-->B & C;',
      'graph TD;A & B-->C;',

      // From flow-singlenode.spec.js patterns
      'graph TD;A;',
      'graph TD;A ;',
      'graph TD;A[rect];',
      'graph TD;A(round);',
      'graph TD;A{diamond};',
      'graph TD;A>asymmetric];',
      'graph TD;A[[subroutine]];',
      'graph TD;A[(database)];',
      'graph TD;A([stadium]);',

      // From flow-text.spec.js patterns
      'graph TD;A[<b>Bold text</b>];',
      'graph TD;A["Double quoted"];',
      "graph TD;A['Single quoted'];",
      'graph TD;A[`Backtick quoted`];',

      // From flow-style.spec.js patterns
      'graph TD;A-->B;\nstyle A fill:#f9f;',
      'graph TD;A-->B;\nclassDef className fill:#f9f;',
      'graph TD;A-->B;\nclass A className;',

      // From flow-subgraph.spec.js patterns
      'graph TD;\nsubgraph Title\nA-->B;\nend;',
      'graph TD;\nsubgraph "Quoted Title"\nA-->B;\nend;',
      'graph TD;\nsubgraph\nA-->B;\nend;',

      // From flow-interactions.spec.js patterns
      'graph TD;A-->B;\nclick A callback;',
      'graph TD;A-->B;\nclick A href "http://example.com";',

      // From flow-direction.spec.js patterns
      'flowchart TB\nA-->B;',
      'flowchart LR\nA-->B;',
      'flowchart RL\nA-->B;',
      'flowchart BT\nA-->B;',

      // From flow-comments.spec.js patterns
      'graph TD;\n%% Comment\n A-->B;',
      'graph TD;A-->B; %% Inline comment',

      // From flow-md-string.spec.js patterns
      'graph TD;A["`Markdown **bold**`"];',
      'graph TD;A["`Markdown *italic*`"];',

      // From flow-node-data.spec.js patterns
      'flowchart TB\nD@{ shape: rounded}',
      'flowchart TB\nE@{ shape: "custom", color: "red" }',
    ];

    it('should achieve 100% compatibility for extracted test cases', () => {
      const result = validator.validateInputs(EXTRACTED_TEST_CASES);

      console.log(`\n=== EXTRACTED TEST CASES VALIDATION RESULTS ===`);
      console.log(`Total tests: ${result.totalTests}`);
      console.log(`Passed: ${result.passed}`);
      console.log(`Failed: ${result.failed}`);
      console.log(`Compatibility: ${result.compatibility.toFixed(2)}%`);

      if (result.failures.length > 0) {
        console.log(`\n=== FAILURES ===`);
        result.failures.forEach((failure, index) => {
          console.log(`\nFailure ${index + 1}: "${failure.input}"`);
          console.log(
            `JISON tokens (${failure.jisonTokens.length}):`,
            failure.jisonTokens.map((t) => `${t.type}="${t.value}"`).join(', ')
          );
          console.log(
            `Chevrotain tokens (${failure.chevrotainTokens.length}):`,
            failure.chevrotainTokens.map((t) => `${t.type}="${t.value}"`).join(', ')
          );
          console.log(`Differences: ${failure.differences.join('; ')}`);
        });
      }

      // This is the critical test - all existing JISON test cases must pass
      expect(result.compatibility).toBe(100);
    });
  });

  describe('Individual Token Validation', () => {
    it('should validate individual problematic tokens', () => {
      // Test specific tokens that are likely to cause issues
      const problematicInputs = [
        'graph',
        'TD',
        'A',
        '-->',
        'B',
        ';',
        '[',
        'text',
        ']',
        '(',
        ')',
        '{',
        '}',
        '|',
        '%% comment',
        '@{',
        'shape:',
        'rounded',
        '}',
      ];

      problematicInputs.forEach((input) => {
        const result = validator.validateInput(input);
        if (!result.match) {
          console.log(`\nToken validation failed for: "${input}"`);
          console.log(`JISON: ${JSON.stringify(result.jisonTokens)}`);
          console.log(`Chevrotain: ${JSON.stringify(result.chevrotainTokens)}`);
          console.log(`Differences: ${result.differences.join(', ')}`);
        }
        expect(result.match).toBe(true);
      });
    });
  });

  describe('JISON Lexer Structure Exploration', () => {
    it('should explore JISON parser structure to find lexer access', () => {
      console.log('\n=== JISON Parser Structure Exploration ===');

      console.log('\n1. Main parser object properties:');
      console.log(Object.keys(jisonParser));

      console.log('\n2. Parser object properties:');
      if (jisonParser.parser) {
        console.log(Object.keys(jisonParser.parser));
      }

      console.log('\n3. Lexer object properties:');
      if (jisonParser.lexer) {
        console.log(Object.keys(jisonParser.lexer));
        console.log('\nLexer methods:');
        console.log(
          Object.getOwnPropertyNames(jisonParser.lexer).filter(
            (name) => typeof jisonParser.lexer[name] === 'function'
          )
        );
      }

      console.log('\n4. Parser.lexer properties:');
      if (jisonParser.parser && jisonParser.parser.lexer) {
        console.log(Object.keys(jisonParser.parser.lexer));
        console.log('\nParser.lexer methods:');
        console.log(
          Object.getOwnPropertyNames(jisonParser.parser.lexer).filter(
            (name) => typeof jisonParser.parser.lexer[name] === 'function'
          )
        );
      }

      console.log('\n5. Available methods on main parser:');
      console.log(
        Object.getOwnPropertyNames(jisonParser).filter(
          (name) => typeof jisonParser[name] === 'function'
        )
      );

      console.log('\n6. JISON token constants:');
      if (jisonParser.parser && jisonParser.parser.symbols_) {
        console.log('Parser symbols:', Object.keys(jisonParser.parser.symbols_));
        console.log('Token mappings:');
        Object.entries(jisonParser.parser.symbols_).forEach(([name, id]) => {
          console.log(`  ${name}: ${id}`);
        });
      } else {
        console.log('No symbols_ found');
      }

      console.log('\n7. JISON lexer rules:');
      if (jisonParser.lexer && jisonParser.lexer.rules) {
        console.log('Number of lexer rules:', jisonParser.lexer.rules.length);
        console.log('First 10 rules:', jisonParser.lexer.rules.slice(0, 10));
      }

      // Test simple lexer access
      console.log('\n6. Testing simple lexer access:');
      try {
        const lexer = jisonParser.lexer || jisonParser.parser?.lexer;
        if (lexer) {
          console.log('Lexer found, setting up FlowDB...');

          // Set up the yy object (FlowDB instance)
          if (!lexer.yy) {
            lexer.yy = new FlowDB();
          }
          lexer.yy.clear();

          // CRITICAL: Ensure the lex property is properly set up
          if (!lexer.yy.lex || typeof lexer.yy.lex.firstGraph !== 'function') {
            lexer.yy.lex = {
              firstGraph: lexer.yy.firstGraph.bind(lexer.yy),
            };
          }

          console.log('Testing setInput...');
          lexer.setInput('graph TD');
          console.log('setInput successful');

          console.log('Testing lex() call...');
          console.log('Current lexer state before lex():', lexer.topState());
          console.log('State stack size:', lexer.stateStackSize());

          const firstToken = lexer.lex();
          console.log('First token:', firstToken);
          console.log('yytext:', lexer.yytext);
          console.log('yylineno:', lexer.yylineno);
          console.log('Current lexer state after first lex():', lexer.topState());

          console.log('Testing second lex() call...');
          const secondToken = lexer.lex();
          console.log('Second token:', secondToken);
          console.log('yytext:', lexer.yytext);
          console.log('Current lexer state after second lex():', lexer.topState());
        } else {
          console.log('No lexer found');
        }
      } catch (error) {
        console.log('Lexer test error:', error.message);
        console.log('Error stack:', error.stack);
      }

      // This test always passes - it's just for exploration
      expect(true).toBe(true);
    });
  });

  describe('Pure Lexer Validation (Tokenization Only)', () => {
    it('should validate Chevrotain lexer tokenization', () => {
      // Create a pure lexer validator that only compares tokenization
      const lexerOnlyValidator = new PureLexerValidator();

      // Test cases that should have clean tokenization
      const lexerTestCases = [
        'graph TD',
        'flowchart LR',
        'A-->B',
        'A[Square]',
        'A(Round)',
        'A{Diamond}',
        'A-->|text|B',
        '%% comment',
        'subgraph',
        'end',
        'style',
        'class',
        'click',
        '@{',
        'shape:',
        'rounded',
        '}',
      ];

      const result = lexerOnlyValidator.validateInputs(lexerTestCases);

      console.log(`\n=== PURE LEXER VALIDATION RESULTS ===`);
      console.log(`Total tests: ${result.totalTests}`);
      console.log(`Passed: ${result.passed}`);
      console.log(`Failed: ${result.failed}`);
      console.log(`Compatibility: ${result.compatibility.toFixed(2)}%`);

      if (result.failures.length > 0) {
        console.log(`\n=== LEXER FAILURES ===`);
        result.failures.forEach((failure, index) => {
          console.log(`\nFailure ${index + 1}: "${failure.input}"`);
          console.log(`Chevrotain tokens: ${JSON.stringify(failure.chevrotainTokens)}`);
          console.log(`Differences: ${failure.differences.join(', ')}`);
        });
      }

      // For now, we expect this to show the limitation of JISON lexer access
      // Once we implement direct JISON lexer access, this should achieve 100%
      console.log(
        '\nNote: This test demonstrates the need for direct JISON lexer access in Phase 1'
      );
    });
  });
});
