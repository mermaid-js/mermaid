/**
 * Lark Token Stream Comparator
 * 
 * This module provides utilities for tokenizing input with the Lark-inspired parser
 * and comparing token streams for validation and testing purposes.
 */

import { LarkFlowLexer } from './LarkFlowParser.js';

/**
 * Tokenize input using Lark-inspired lexer
 * @param {string} input - Input string to tokenize
 * @returns {Promise<Array>} Array of tokens
 */
export async function tokenizeWithLark(input) {
  try {
    const lexer = new LarkFlowLexer(input);
    const tokens = lexer.tokenize();
    
    // Convert to a format compatible with our test framework
    return tokens.map(token => ({
      type: token.type,
      value: token.value,
      line: token.line,
      column: token.column
    }));
  } catch (error) {
    throw new Error(`Lark tokenization error: ${error.message}`);
  }
}

/**
 * Compare token streams from different parsers
 * @param {Array} jisonTokens - Tokens from Jison parser
 * @param {Array} antlrTokens - Tokens from ANTLR parser  
 * @param {Array} larkTokens - Tokens from Lark parser
 * @returns {Object} Comparison result
 */
export function compareTokenStreams(jisonTokens, antlrTokens, larkTokens) {
  const comparison = {
    identical: true,
    differences: [],
    summary: {
      jison: { count: jisonTokens.length, types: new Set() },
      antlr: { count: antlrTokens.length, types: new Set() },
      lark: { count: larkTokens.length, types: new Set() }
    }
  };

  // Collect token type statistics
  jisonTokens.forEach(token => comparison.summary.jison.types.add(token.type));
  antlrTokens.forEach(token => comparison.summary.antlr.types.add(token.type));
  larkTokens.forEach(token => comparison.summary.lark.types.add(token.type));

  // Compare token counts
  if (jisonTokens.length !== antlrTokens.length || 
      jisonTokens.length !== larkTokens.length ||
      antlrTokens.length !== larkTokens.length) {
    comparison.identical = false;
    comparison.differences.push({
      type: 'TOKEN_COUNT_MISMATCH',
      jison: jisonTokens.length,
      antlr: antlrTokens.length,
      lark: larkTokens.length
    });
  }

  // Compare token sequences (simplified comparison)
  const maxLength = Math.max(jisonTokens.length, antlrTokens.length, larkTokens.length);
  
  for (let i = 0; i < maxLength; i++) {
    const jisonToken = jisonTokens[i];
    const antlrToken = antlrTokens[i];
    const larkToken = larkTokens[i];

    if (!jisonToken || !antlrToken || !larkToken) {
      comparison.identical = false;
      comparison.differences.push({
        type: 'TOKEN_MISSING',
        position: i,
        jison: jisonToken?.type || 'MISSING',
        antlr: antlrToken?.type || 'MISSING',
        lark: larkToken?.type || 'MISSING'
      });
      continue;
    }

    // Compare token types (allowing for some variation in naming)
    if (!tokensMatch(jisonToken, antlrToken, larkToken)) {
      comparison.identical = false;
      comparison.differences.push({
        type: 'TOKEN_TYPE_MISMATCH',
        position: i,
        jison: { type: jisonToken.type, value: jisonToken.value },
        antlr: { type: antlrToken.type, value: antlrToken.value },
        lark: { type: larkToken.type, value: larkToken.value }
      });
    }
  }

  return comparison;
}

/**
 * Check if tokens from different parsers represent the same semantic element
 * @param {Object} jisonToken - Token from Jison
 * @param {Object} antlrToken - Token from ANTLR
 * @param {Object} larkToken - Token from Lark
 * @returns {boolean} True if tokens match semantically
 */
function tokensMatch(jisonToken, antlrToken, larkToken) {
  // Normalize token types for comparison
  const jisonType = normalizeTokenType(jisonToken.type);
  const antlrType = normalizeTokenType(antlrToken.type);
  const larkType = normalizeTokenType(larkToken.type);

  // Check if all three match
  return jisonType === antlrType && antlrType === larkType;
}

/**
 * Normalize token types for cross-parser comparison
 * @param {string} tokenType - Original token type
 * @returns {string} Normalized token type
 */
function normalizeTokenType(tokenType) {
  const typeMap = {
    // Graph keywords
    'GRAPH': 'GRAPH',
    'FLOWCHART': 'GRAPH',
    'graph': 'GRAPH',
    'flowchart': 'GRAPH',
    
    // Directions
    'DIR': 'DIRECTION',
    'DIRECTION': 'DIRECTION',
    'TD': 'DIRECTION',
    'TB': 'DIRECTION',
    'BT': 'DIRECTION',
    'LR': 'DIRECTION',
    'RL': 'DIRECTION',
    
    // Node shapes
    'SQS': 'SQUARE_START',
    'SQE': 'SQUARE_END',
    'SQUARE_START': 'SQUARE_START',
    'SQUARE_END': 'SQUARE_END',
    '[': 'SQUARE_START',
    ']': 'SQUARE_END',
    
    'PS': 'ROUND_START',
    'PE': 'ROUND_END',
    'ROUND_START': 'ROUND_START',
    'ROUND_END': 'ROUND_END',
    '(': 'ROUND_START',
    ')': 'ROUND_END',
    
    'DIAMOND_START': 'DIAMOND_START',
    'DIAMOND_STOP': 'DIAMOND_END',
    'DIAMOND_END': 'DIAMOND_END',
    '{': 'DIAMOND_START',
    '}': 'DIAMOND_END',
    
    // Edges
    'LINK': 'EDGE',
    'ARROW': 'EDGE',
    'LINE': 'EDGE',
    'DOTTED_ARROW': 'EDGE',
    'DOTTED_LINE': 'EDGE',
    'THICK_ARROW': 'EDGE',
    'THICK_LINE': 'EDGE',
    '-->': 'EDGE',
    '---': 'EDGE',
    '-.->': 'EDGE',
    '-.-': 'EDGE',
    
    // Text
    'STR': 'STRING',
    'STRING': 'STRING',
    'WORD': 'WORD',
    'NODE_STRING': 'WORD',
    
    // Whitespace
    'NEWLINE': 'NEWLINE',
    'SPACE': 'SPACE',
    'COMMENT': 'COMMENT',
    
    // Special
    'EOF': 'EOF',
    'PIPE': 'PIPE',
    '|': 'PIPE'
  };

  return typeMap[tokenType] || tokenType;
}

/**
 * Generate detailed token analysis report
 * @param {Array} jisonTokens - Tokens from Jison
 * @param {Array} antlrTokens - Tokens from ANTLR
 * @param {Array} larkTokens - Tokens from Lark
 * @returns {Object} Detailed analysis report
 */
export function generateTokenAnalysisReport(jisonTokens, antlrTokens, larkTokens) {
  const report = {
    summary: {
      jison: {
        totalTokens: jisonTokens.length,
        uniqueTypes: new Set(jisonTokens.map(t => t.type)).size,
        typeDistribution: {}
      },
      antlr: {
        totalTokens: antlrTokens.length,
        uniqueTypes: new Set(antlrTokens.map(t => t.type)).size,
        typeDistribution: {}
      },
      lark: {
        totalTokens: larkTokens.length,
        uniqueTypes: new Set(larkTokens.map(t => t.type)).size,
        typeDistribution: {}
      }
    },
    comparison: compareTokenStreams(jisonTokens, antlrTokens, larkTokens),
    recommendations: []
  };

  // Calculate type distributions
  [
    { tokens: jisonTokens, summary: report.summary.jison },
    { tokens: antlrTokens, summary: report.summary.antlr },
    { tokens: larkTokens, summary: report.summary.lark }
  ].forEach(({ tokens, summary }) => {
    tokens.forEach(token => {
      summary.typeDistribution[token.type] = (summary.typeDistribution[token.type] || 0) + 1;
    });
  });

  // Generate recommendations
  if (!report.comparison.identical) {
    report.recommendations.push('Token streams differ between parsers - review grammar definitions');
  }

  if (report.summary.lark.totalTokens > report.summary.jison.totalTokens) {
    report.recommendations.push('Lark parser generates more tokens - may have better granularity');
  }

  if (report.summary.lark.uniqueTypes > report.summary.jison.uniqueTypes) {
    report.recommendations.push('Lark parser has more token types - may provide better semantic analysis');
  }

  return report;
}
