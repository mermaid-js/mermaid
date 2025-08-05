/**
 * Lexer Validation Framework for Lezer-JISON Migration
 * Compares tokenization results between Lezer and JISON parsers
 */

import { parser as lezerParser } from './flow.grammar.js';
import { LezerTokenExtractor, Token, TokenExtractionResult } from './lezerTokenExtractor.js';
import { FlowDB } from '../flowDb.js';
// @ts-ignore: JISON doesn't support types
import jisonParser from './flow.jison';

export interface ValidationResult {
  matches: boolean;
  jisonResult: TokenExtractionResult;
  lezerResult: TokenExtractionResult;
  differences: string[];
  summary: ValidationSummary;
}

export interface ValidationSummary {
  totalJisonTokens: number;
  totalLezerTokens: number;
  matchingTokens: number;
  matchPercentage: number;
  jisonOnlyTokens: Token[];
  lezerOnlyTokens: Token[];
  positionMismatches: TokenMismatch[];
}

export interface TokenMismatch {
  position: number;
  jisonToken: Token | null;
  lezerToken: Token | null;
  reason: string;
}

/**
 * Validates tokenization compatibility between Lezer and JISON
 */
export class LexerValidator {
  private lezerExtractor: LezerTokenExtractor;
  private jisonTokenMap: Map<number, string>;

  constructor() {
    this.lezerExtractor = new LezerTokenExtractor();
    this.jisonTokenMap = this.createJisonTokenMap();
  }

  /**
   * Compare tokenization between Lezer and JISON
   */
  compareTokenization(input: string): ValidationResult {
    const jisonResult = this.tokenizeWithJison(input);
    const lezerResult = this.tokenizeWithLezer(input);
    
    const differences: string[] = [];
    const summary = this.createValidationSummary(jisonResult, lezerResult, differences);
    
    const matches = differences.length === 0 && summary.matchPercentage === 100;
    
    return {
      matches,
      jisonResult,
      lezerResult,
      differences,
      summary
    };
  }

  /**
   * Tokenize input using JISON parser
   */
  private tokenizeWithJison(input: string): TokenExtractionResult {
    const tokens: Token[] = [];
    const errors: string[] = [];

    try {
      const lexer = jisonParser.lexer;
      
      // Set up FlowDB instance
      if (!lexer.yy) {
        lexer.yy = new FlowDB();
      }
      lexer.yy.clear();

      // Ensure lex property is set up for JISON lexer
      if (!lexer.yy.lex || typeof lexer.yy.lex.firstGraph !== 'function') {
        lexer.yy.lex = {
          firstGraph: lexer.yy.firstGraph.bind(lexer.yy),
        };
      }

      // Reset lexer state
      lexer.yylineno = 1;
      if (lexer.yylloc) {
        lexer.yylloc = {
          first_line: 1,
          last_line: 1,
          first_column: 0,
          last_column: 0,
        };
      }

      lexer.setInput(input);

      let token;
      let count = 0;
      const maxTokens = 100; // Prevent infinite loops

      while (count < maxTokens) {
        try {
          token = lexer.lex();

          // Check for EOF
          if (token === 'EOF' || token === 1 || token === 11) {
            tokens.push({
              type: 'EOF',
              value: '',
              start: lexer.yylloc?.first_column || 0,
              end: lexer.yylloc?.last_column || 0
            });
            break;
          }

          tokens.push({
            type: this.mapJisonTokenType(token),
            value: lexer.yytext || '',
            start: lexer.yylloc?.first_column || 0,
            end: lexer.yylloc?.last_column || 0
          });
          count++;
        } catch (lexError) {
          errors.push(`JISON lexer error: ${lexError.message}`);
          break;
        }
      }
    } catch (error) {
      errors.push(`JISON tokenization error: ${error.message}`);
    }

    return { tokens, errors };
  }

  /**
   * Tokenize input using Lezer parser
   */
  private tokenizeWithLezer(input: string): TokenExtractionResult {
    try {
      const tree = lezerParser.parse(input);
      return this.lezerExtractor.extractTokens(tree, input);
    } catch (error) {
      return {
        tokens: [],
        errors: [`Lezer tokenization error: ${error.message}`]
      };
    }
  }

  /**
   * Create validation summary comparing both results
   */
  private createValidationSummary(
    jisonResult: TokenExtractionResult,
    lezerResult: TokenExtractionResult,
    differences: string[]
  ): ValidationSummary {
    const jisonTokens = jisonResult.tokens;
    const lezerTokens = lezerResult.tokens;
    
    // Filter out whitespace tokens for comparison
    const jisonFiltered = this.filterSignificantTokens(jisonTokens);
    const lezerFiltered = this.filterSignificantTokens(lezerTokens);
    
    const matchingTokens = this.countMatchingTokens(jisonFiltered, lezerFiltered, differences);
    const matchPercentage = jisonFiltered.length > 0 
      ? Math.round((matchingTokens / jisonFiltered.length) * 100)
      : 0;
    
    const jisonOnlyTokens = this.findUniqueTokens(jisonFiltered, lezerFiltered);
    const lezerOnlyTokens = this.findUniqueTokens(lezerFiltered, jisonFiltered);
    const positionMismatches = this.findPositionMismatches(jisonFiltered, lezerFiltered);
    
    return {
      totalJisonTokens: jisonFiltered.length,
      totalLezerTokens: lezerFiltered.length,
      matchingTokens,
      matchPercentage,
      jisonOnlyTokens,
      lezerOnlyTokens,
      positionMismatches
    };
  }

  /**
   * Filter out whitespace and insignificant tokens for comparison
   */
  private filterSignificantTokens(tokens: Token[]): Token[] {
    const insignificantTypes = ['SPACE', 'NEWLINE', 'space', 'newline'];
    return tokens.filter(token => !insignificantTypes.includes(token.type));
  }

  /**
   * Count matching tokens between two token arrays
   */
  private countMatchingTokens(jisonTokens: Token[], lezerTokens: Token[], differences: string[]): number {
    let matches = 0;
    const maxLength = Math.max(jisonTokens.length, lezerTokens.length);
    
    for (let i = 0; i < maxLength; i++) {
      const jisonToken = jisonTokens[i];
      const lezerToken = lezerTokens[i];
      
      if (!jisonToken && lezerToken) {
        differences.push(`Position ${i}: Lezer has extra token ${lezerToken.type}="${lezerToken.value}"`);
      } else if (jisonToken && !lezerToken) {
        differences.push(`Position ${i}: JISON has extra token ${jisonToken.type}="${jisonToken.value}"`);
      } else if (jisonToken && lezerToken) {
        if (this.tokensMatch(jisonToken, lezerToken)) {
          matches++;
        } else {
          differences.push(
            `Position ${i}: Token mismatch - JISON: ${jisonToken.type}="${jisonToken.value}" vs Lezer: ${lezerToken.type}="${lezerToken.value}"`
          );
        }
      }
    }
    
    return matches;
  }

  /**
   * Check if two tokens match
   */
  private tokensMatch(token1: Token, token2: Token): boolean {
    return token1.type === token2.type && token1.value === token2.value;
  }

  /**
   * Find tokens that exist in first array but not in second
   */
  private findUniqueTokens(tokens1: Token[], tokens2: Token[]): Token[] {
    return tokens1.filter(token1 => 
      !tokens2.some(token2 => this.tokensMatch(token1, token2))
    );
  }

  /**
   * Find position mismatches between token arrays
   */
  private findPositionMismatches(jisonTokens: Token[], lezerTokens: Token[]): TokenMismatch[] {
    const mismatches: TokenMismatch[] = [];
    const maxLength = Math.max(jisonTokens.length, lezerTokens.length);
    
    for (let i = 0; i < maxLength; i++) {
      const jisonToken = jisonTokens[i] || null;
      const lezerToken = lezerTokens[i] || null;
      
      if (!jisonToken || !lezerToken || !this.tokensMatch(jisonToken, lezerToken)) {
        mismatches.push({
          position: i,
          jisonToken,
          lezerToken,
          reason: this.getMismatchReason(jisonToken, lezerToken)
        });
      }
    }
    
    return mismatches;
  }

  /**
   * Get reason for token mismatch
   */
  private getMismatchReason(jisonToken: Token | null, lezerToken: Token | null): string {
    if (!jisonToken) return 'Missing in JISON';
    if (!lezerToken) return 'Missing in Lezer';
    if (jisonToken.type !== lezerToken.type) return 'Type mismatch';
    if (jisonToken.value !== lezerToken.value) return 'Value mismatch';
    return 'Unknown mismatch';
  }

  /**
   * Create comprehensive mapping from JISON numeric token types to names
   */
  private createJisonTokenMap(): Map<number, string> {
    return new Map([
      // Core tokens
      [11, 'EOF'],
      [12, 'GRAPH'],
      [14, 'DIR'],
      [27, 'subgraph'],
      [32, 'end'],

      // Brackets and parentheses
      [50, 'PS'], // (
      [51, 'PE'], // )
      [29, 'SQS'], // [
      [31, 'SQE'], // ]
      [65, 'DIAMOND_START'], // {
      [66, 'DIAMOND_STOP'], // }

      // Links and arrows
      [77, 'LINK'],
      [75, 'START_LINK'],

      // Node and text
      [109, 'NODE_STRING'],
      [80, 'STR'],
      [82, 'TEXT'],

      // Punctuation
      [8, 'SEMI'], // ;
      [9, 'NEWLINE'],
      [10, 'SPACE'],
      [62, 'PIPE'], // |
      [60, 'COLON'], // :
      [44, 'AMP'], // &
      [45, 'MULT'], // *
      [46, 'BRKT'], // #
      [47, 'MINUS'], // -
      [48, 'COMMA'], // ,

      // Add more mappings as needed
    ]);
  }

  /**
   * Map JISON numeric token type to meaningful name
   */
  private mapJisonTokenType(numericType: number | string): string {
    if (typeof numericType === 'string') {
      return numericType;
    }
    return this.jisonTokenMap.get(numericType) || `UNKNOWN_${numericType}`;
  }
}
