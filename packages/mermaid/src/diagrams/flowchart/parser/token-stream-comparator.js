/**
 * Token Stream Comparator for ANTLR vs Jison Lexer Validation
 *
 * This module provides utilities to tokenize inputs with both ANTLR and Jison lexers
 * and compare the results with detailed mismatch reporting.
 */

/**
 * Tokenize input using ANTLR lexer
 * @param {string} input - Input text to tokenize
 * @returns {Promise<Array>} Array of token objects
 */
export async function tokenizeWithANTLR(input) {
  const tokens = [];

  try {
    // Dynamic import to handle potential module loading issues
    const { FlowLexer } = await import('./generated/src/diagrams/flowchart/parser/FlowLexer.js');
    const { ANTLRInputStream, CommonTokenStream } = await import('antlr4ts');

    const inputStream = new ANTLRInputStream(input);
    const lexer = new FlowLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);

    // Fill the token stream
    tokenStream.fill();

    // Extract all tokens
    const allTokens = tokenStream.getTokens();

    for (const token of allTokens) {
      tokens.push({
        type: lexer.vocabulary.getSymbolicName(token.type) || token.type.toString(),
        value: token.text || '',
        line: token.line,
        column: token.charPositionInLine,
        channel: token.channel,
        tokenIndex: token.tokenIndex,
      });
    }
  } catch (error) {
    console.error('ANTLR tokenization error:', error);
    throw new Error(`ANTLR tokenization failed: ${error.message}`);
  }

  return tokens;
}

/**
 * Tokenize input using Jison lexer
 * @param {string} input - Input text to tokenize
 * @returns {Promise<Array>} Array of token objects
 */
export async function tokenizeWithJison(input) {
  const tokens = [];

  try {
    // Dynamic import to handle potential module loading issues
    const { parser } = await import('./flow.jison');
    const { FlowDB } = await import('../flowDb.js');

    // Initialize the parser context properly
    parser.yy = new FlowDB();
    parser.yy.clear();

    // Create a new lexer instance from the Jison parser
    const lexer = parser.lexer;
    lexer.setInput(input);

    let token;
    let tokenIndex = 0;

    while ((token = lexer.lex()) !== 'EOF') {
      tokens.push({
        type: token,
        value: lexer.yytext,
        line: lexer.yylineno,
        column: lexer.yylloc ? lexer.yylloc.first_column : 0,
        state: lexer.topState ? lexer.topState() : 'INITIAL',
        tokenIndex: tokenIndex++,
      });
    }

    // Add EOF token
    tokens.push({
      type: 'EOF',
      value: '',
      line: lexer.yylineno,
      column: lexer.yylloc ? lexer.yylloc.last_column : 0,
      state: lexer.topState ? lexer.topState() : 'INITIAL',
      tokenIndex: tokenIndex,
    });
  } catch (error) {
    console.error('Jison tokenization error:', error);
    throw new Error(`Jison tokenization failed: ${error.message}`);
  }

  return tokens;
}

/**
 * Compare two token streams and report differences
 * @param {Array} jisonTokens - Tokens from Jison lexer
 * @param {Array} antlrTokens - Tokens from ANTLR lexer
 * @param {string} input - Original input for context
 * @returns {Object} Comparison result with detailed analysis
 */
export function compareTokenStreams(jisonTokens, antlrTokens, input) {
  const result = {
    match: true,
    totalJisonTokens: jisonTokens.length,
    totalAntlrTokens: antlrTokens.length,
    differences: [],
    analysis: {
      lengthMismatch: jisonTokens.length !== antlrTokens.length,
      tokenMismatches: 0,
      valueMismatches: 0,
      positionMismatches: 0,
    },
  };

  const maxLength = Math.max(jisonTokens.length, antlrTokens.length);

  for (let i = 0; i < maxLength; i++) {
    const jisonToken = jisonTokens[i];
    const antlrToken = antlrTokens[i];

    if (!jisonToken && antlrToken) {
      result.differences.push({
        index: i,
        issue: 'ANTLR_EXTRA_TOKEN',
        antlrToken: antlrToken,
        context: getTokenContext(input, antlrToken),
      });
      result.match = false;
      continue;
    }

    if (jisonToken && !antlrToken) {
      result.differences.push({
        index: i,
        issue: 'JISON_EXTRA_TOKEN',
        jisonToken: jisonToken,
        context: getTokenContext(input, jisonToken),
      });
      result.match = false;
      continue;
    }

    if (jisonToken && antlrToken) {
      const issues = [];

      // Compare token types
      if (jisonToken.type !== antlrToken.type) {
        issues.push('TYPE_MISMATCH');
        result.analysis.tokenMismatches++;
      }

      // Compare token values
      if (jisonToken.value !== antlrToken.value) {
        issues.push('VALUE_MISMATCH');
        result.analysis.valueMismatches++;
      }

      // Compare positions (with some tolerance for different counting methods)
      if (
        Math.abs(jisonToken.line - antlrToken.line) > 0 ||
        Math.abs(jisonToken.column - antlrToken.column) > 1
      ) {
        issues.push('POSITION_MISMATCH');
        result.analysis.positionMismatches++;
      }

      if (issues.length > 0) {
        result.differences.push({
          index: i,
          issues: issues,
          jisonToken: jisonToken,
          antlrToken: antlrToken,
          context: getTokenContext(input, jisonToken),
        });
        result.match = false;
      }
    }
  }

  return result;
}

/**
 * Get context around a token for debugging
 * @param {string} input - Original input
 * @param {Object} token - Token object
 * @returns {string} Context string
 */
export function getTokenContext(input, token) {
  if (!token || typeof token.line !== 'number') return '';

  const lines = input.split('\n');
  const lineIndex = token.line - 1;

  if (lineIndex < 0 || lineIndex >= lines.length) return '';

  const line = lines[lineIndex];
  const column = token.column || 0;
  const start = Math.max(0, column - 10);
  const end = Math.min(line.length, column + 10);

  return `Line ${token.line}: "${line.substring(start, end)}" (at column ${column})`;
}

/**
 * Generate detailed comparison report
 * @param {Object} comparison - Comparison result
 * @param {string} input - Original input
 * @returns {string} Formatted report
 */
export function generateComparisonReport(comparison, input) {
  let report = '\n=== LEXER COMPARISON REPORT ===\n';
  report += `Input: "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}"\n`;
  report += `Jison Tokens: ${comparison.totalJisonTokens}\n`;
  report += `ANTLR Tokens: ${comparison.totalAntlrTokens}\n`;
  report += `Match: ${comparison.match ? 'YES' : 'NO'}\n`;

  if (!comparison.match) {
    report += `\nISSUES FOUND: ${comparison.differences.length}\n`;
    report += `- Token mismatches: ${comparison.analysis.tokenMismatches}\n`;
    report += `- Value mismatches: ${comparison.analysis.valueMismatches}\n`;
    report += `- Position mismatches: ${comparison.analysis.positionMismatches}\n`;

    if (comparison.analysis.lengthMismatch) {
      report += `- Length mismatch: Jison=${comparison.totalJisonTokens}, ANTLR=${comparison.totalAntlrTokens}\n`;
    }

    report += '\nDETAILED DIFFERENCES:\n';
    comparison.differences.slice(0, 10).forEach((diff, idx) => {
      report += `\n${idx + 1}. Index ${diff.index}: ${diff.issues ? diff.issues.join(', ') : diff.issue}\n`;
      if (diff.jisonToken) {
        report += `   Jison:  ${diff.jisonToken.type} = "${diff.jisonToken.value}"\n`;
      }
      if (diff.antlrToken) {
        report += `   ANTLR:  ${diff.antlrToken.type} = "${diff.antlrToken.value}"\n`;
      }
      if (diff.context) {
        report += `   Context: ${diff.context}\n`;
      }
    });

    if (comparison.differences.length > 10) {
      report += `\n... and ${comparison.differences.length - 10} more differences\n`;
    }
  }

  report += '\n=== END REPORT ===\n';
  return report;
}

/**
 * Validate a single input string with both lexers
 * @param {string} input - Input to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateInput(input) {
  try {
    const jisonTokens = await tokenizeWithJison(input);
    const antlrTokens = await tokenizeWithANTLR(input);
    const comparison = compareTokenStreams(jisonTokens, antlrTokens, input);

    return {
      success: true,
      input: input,
      jisonTokens: jisonTokens,
      antlrTokens: antlrTokens,
      comparison: comparison,
      report: comparison.match ? null : generateComparisonReport(comparison, input),
    };
  } catch (error) {
    return {
      success: false,
      input: input,
      error: error.message,
      jisonTokens: null,
      antlrTokens: null,
      comparison: null,
      report: null,
    };
  }
}

/**
 * Validate multiple inputs with both lexers
 * @param {Array<string>} inputs - Array of inputs to validate
 * @returns {Promise<Object>} Batch validation result
 */
export async function validateInputs(inputs) {
  const results = [];
  let totalTests = inputs.length;
  let passedTests = 0;
  let failedTests = 0;
  let errorTests = 0;

  for (const input of inputs) {
    const result = await validateInput(input);
    results.push(result);

    if (!result.success) {
      errorTests++;
    } else if (result.comparison.match) {
      passedTests++;
    } else {
      failedTests++;
    }
  }

  return {
    totalTests,
    passedTests,
    failedTests,
    errorTests,
    results,
    summary: {
      passRate: ((passedTests / totalTests) * 100).toFixed(2),
      failRate: ((failedTests / totalTests) * 100).toFixed(2),
      errorRate: ((errorTests / totalTests) * 100).toFixed(2),
    },
  };
}
