/**
 * ANTLR-based Sequence Diagram Parser
 *
 * This is a proper ANTLR implementation using antlr-ng generated parser code.
 * It provides the same interface as the Jison parser for 100% compatibility.
 *
 * Follows the same structure as the flowchart ANTLR parser with both listener and visitor pattern support.
 */

import { CharStream, CommonTokenStream, ParseTreeWalker } from 'antlr4ng';
import { SequenceLexer } from './generated/SequenceLexer.js';
import { SequenceParser } from './generated/SequenceParser.js';
import { SequenceListener } from './SequenceListener.js';
import { SequenceVisitor } from './SequenceVisitor.js';
import { SequenceCodeGenerator } from './SequenceCodeGenerator.js';
import { TokenStreamRewriter } from 'antlr4ng';

/**
 * Main ANTLR parser class that provides the same interface as the Jison parser
 */
export class ANTLRSequenceParser {
  yy: any;

  constructor() {
    this.yy = {};
  }

  parse(input: string): any {
    const startTime = performance.now();

    // Count approximate complexity for performance decisions
    const messageCount = (input.match(/->|-->/g) ?? []).length;
    const participantCount = (input.match(/participant|actor/g) ?? []).length;

    // Only log for complex diagrams or when debugging
    const isComplexDiagram = messageCount > 50 || input.length > 1000;
    const getEnvVar = (name: string): string | undefined => {
      try {
        if (typeof process !== 'undefined' && process.env) {
          return process.env[name];
        }
      } catch (_e) {
        // process is not defined in browser, continue to browser checks
      }

      // In browser, check for global variables
      if (typeof window !== 'undefined' && (window as any).MERMAID_CONFIG) {
        return (window as any).MERMAID_CONFIG[name];
      }
      return undefined;
    };
    const shouldLog = isComplexDiagram || getEnvVar('ANTLR_DEBUG') === 'true';

    if (shouldLog) {
      // eslint-disable-next-line no-console
      console.log('🎯 ANTLR Sequence Parser: Starting parse');
      // eslint-disable-next-line no-console
      console.log(`📝 Input length: ${input.length} characters`);
      // eslint-disable-next-line no-console
      console.log(
        `📊 Estimated complexity: ~${messageCount} messages, ~${participantCount} participants`
      );
    }

    try {
      // Reset database state
      const resetStart = performance.now();
      if (shouldLog) {
        // eslint-disable-next-line no-console
        console.log('🔄 ANTLR Sequence Parser: Resetting database state');
      }
      if (this.yy.clear) {
        this.yy.clear();
      }
      const resetTime = performance.now() - resetStart;

      // Create input stream and lexer
      const lexerSetupStart = performance.now();
      const inputStream = CharStream.fromString(input);
      const lexer = new SequenceLexer(inputStream);
      const tokenStream = new CommonTokenStream(lexer);
      const lexerSetupTime = performance.now() - lexerSetupStart;

      // Create parser
      const parserSetupStart = performance.now();
      const parser = new SequenceParser(tokenStream);
      const parserSetupTime = performance.now() - parserSetupStart;

      // Generate parse tree
      const parseTreeStart = performance.now();
      if (shouldLog) {
        // eslint-disable-next-line no-console
        console.log('🌳 ANTLR Sequence Parser: Starting parse tree generation');
      }
      const tree = parser.start();
      const parseTreeTime = performance.now() - parseTreeStart;
      if (shouldLog) {
        // eslint-disable-next-line no-console
        console.log(`⏱️ Parse tree generation took: ${parseTreeTime.toFixed(2)}ms`);
        // eslint-disable-next-line no-console
        console.log('✅ ANTLR Sequence Parser: Parse tree generated successfully');
      }

      // Check if we should use Visitor or Listener pattern
      // Default to Visitor pattern (true) unless explicitly set to false
      const useVisitorPattern = getEnvVar('USE_ANTLR_VISITOR') !== 'false';

      const traversalStart = performance.now();
      if (useVisitorPattern) {
        if (shouldLog) {
          // eslint-disable-next-line no-console
          console.log('🎯 ANTLR Sequence Parser: Creating visitor');
        }
        const visitor = new SequenceVisitor(this.yy);
        if (shouldLog) {
          // eslint-disable-next-line no-console
          console.log('🚶 ANTLR Sequence Parser: Visiting parse tree');
        }
        try {
          visitor.visit(tree);
          if (shouldLog) {
            // eslint-disable-next-line no-console
            console.log('✅ ANTLR Sequence Parser: Visitor completed successfully');
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('❌ ANTLR Sequence Parser: Visitor failed:', error.message);
          // eslint-disable-next-line no-console
          console.error('❌ ANTLR Sequence Parser: Visitor stack:', error.stack);
          throw error;
        }
      } else {
        if (shouldLog) {
          // eslint-disable-next-line no-console
          console.log('👂 ANTLR Sequence Parser: Creating listener');
        }
        const listener = new SequenceListener(this.yy);
        if (shouldLog) {
          // eslint-disable-next-line no-console
          console.log('🚶 ANTLR Sequence Parser: Walking parse tree');
        }
        try {
          ParseTreeWalker.DEFAULT.walk(listener, tree);
          if (shouldLog) {
            // eslint-disable-next-line no-console
            console.log('✅ ANTLR Sequence Parser: Listener completed successfully');
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('❌ ANTLR Sequence Parser: Listener failed:', error.message);
          // eslint-disable-next-line no-console
          console.error('❌ ANTLR Sequence Parser: Listener stack:', error.stack);
          throw error;
        }
      }
      const traversalTime = performance.now() - traversalStart;

      const totalTime = performance.now() - startTime;

      // Only show performance breakdown for complex diagrams or debug mode
      if (shouldLog) {
        // eslint-disable-next-line no-console
        console.log(`⏱️ Tree traversal took: ${traversalTime.toFixed(2)}ms`);
        // eslint-disable-next-line no-console
        console.log(
          `⏱️ Total parse time: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`
        );

        // Performance breakdown
        // eslint-disable-next-line no-console
        console.log('📊 Performance breakdown:');
        // eslint-disable-next-line no-console
        console.log(
          `  - Database reset: ${resetTime.toFixed(2)}ms (${((resetTime / totalTime) * 100).toFixed(1)}%)`
        );
        // eslint-disable-next-line no-console
        console.log(
          `  - Lexer setup: ${lexerSetupTime.toFixed(2)}ms (${((lexerSetupTime / totalTime) * 100).toFixed(1)}%)`
        );
        // eslint-disable-next-line no-console
        console.log(
          `  - Parser setup: ${parserSetupTime.toFixed(2)}ms (${((parserSetupTime / totalTime) * 100).toFixed(1)}%)`
        );
        // eslint-disable-next-line no-console
        console.log(
          `  - Parse tree: ${parseTreeTime.toFixed(2)}ms (${((parseTreeTime / totalTime) * 100).toFixed(1)}%)`
        );
        // eslint-disable-next-line no-console
        console.log(
          `  - Tree traversal: ${traversalTime.toFixed(2)}ms (${((traversalTime / totalTime) * 100).toFixed(1)}%)`
        );
        // eslint-disable-next-line no-console
        console.log('✅ ANTLR Sequence Parser: Parse completed successfully');
      }
      // Store the parse tree for AST-to-code regeneration
      this.yy._parseTree = tree;

      // Build and store the AST during initial parsing
      const astBuildStart = performance.now();
      if (shouldLog) {
        // eslint-disable-next-line no-console
        console.log('🌳 ANTLR Sequence Parser: Building AST from parse tree');
      }

      try {
        // Store the original input and token stream for formatting preservation
        this.yy._originalInput = input;
        this.yy._tokenStream = tokenStream;
        this.yy._tokenRewriter = new TokenStreamRewriter(tokenStream);
        this.yy._tokenMap = new Map(); // Map statement indices to token positions

        const generator = new SequenceCodeGenerator();
        const result = generator.generateCode(tree);

        // Store the AST in the parser state
        this.yy._ast = result.ast;
        this.yy._generatedCode = result.code;
        this.yy._generatedLines = result.lines;

        // Store original AST for change detection (only during initial parsing)
        this.yy._originalAST = this.createSafeASTCopy(result.ast);

        const astBuildTime = performance.now() - astBuildStart;
        if (shouldLog) {
          // eslint-disable-next-line no-console
          console.log(`⏱️ AST building took: ${astBuildTime.toFixed(2)}ms`);
          // eslint-disable-next-line no-console
          console.log(`🌳 AST built with ${result.ast.statements.length} statements`);
          // eslint-disable-next-line no-console
          console.log('✅ ANTLR Sequence Parser: AST built successfully');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ ANTLR Sequence Parser: AST building failed:', error.message);
        // Don't throw - AST building is optional, parsing should still succeed
      }

      return this.yy;
    } catch (error) {
      const totalTime = performance.now() - startTime;
      // eslint-disable-next-line no-console
      console.log(`❌ ANTLR sequence parsing error after ${totalTime.toFixed(2)}ms:`, error);
      // eslint-disable-next-line no-console
      console.log('📝 Input that caused error (first 500 chars):', input.substring(0, 500));
      throw error;
    }
  }

  // Provide the same interface as Jison parser
  setYY(yy: any) {
    this.yy = yy;
  }

  /**
   * Get the AST that was built during parsing
   * This provides immediate access to structured data without regeneration
   */
  getAST(): any | null {
    return this.yy._ast || null;
  }

  /**
   * Get the generated code that was built during parsing
   */
  getGeneratedCode(): string | null {
    return this.yy._generatedCode || null;
  }

  /**
   * Get the generated lines that were built during parsing
   */
  getGeneratedLines(): string[] | null {
    return this.yy._generatedLines || null;
  }

  /**
   * Regenerate code preserving original formatting using smart formatting preservation
   * This is the "hybrid" approach that maintains whitespace and indentation
   */
  regenerateCodeWithFormatting(): string | null {
    if (!this.yy._originalInput) {
      console.warn('⚠️ Original input not available - falling back to AST regeneration');
      const astResult = this.generateCodeFromAST();
      return astResult ? astResult.code : null;
    }

    try {
      // Check if AST has been modified since initial parsing
      const currentAST = this.yy._ast;
      const hasASTChanges = this.detectASTChanges(currentAST);

      if (hasASTChanges) {
        console.log(
          '🔄 AST changes detected, applying selective updates with formatting preservation'
        );
        return this.applyASTChangesWithFormatting(currentAST);
      } else {
        console.log(
          '✅ No AST changes detected, returning original input with preserved formatting'
        );
        return this.yy._originalInput;
      }
    } catch (error) {
      console.error('❌ Error regenerating code with formatting:', error);
      // Fallback to AST regeneration
      const astResult = this.generateCodeFromAST();
      return astResult ? astResult.code : null;
    }
  }

  /**
   * Detect if the AST has been modified since initial parsing
   * Uses safe comparison that avoids circular reference issues
   */
  private detectASTChanges(currentAST: any): boolean {
    if (!this.yy._originalAST) {
      console.warn('⚠️ No original AST stored for comparison - assuming changes detected');
      return true; // If no original AST, assume changes to trigger regeneration
    }

    // Compare safe representations to detect changes
    const originalSafe = this.createSafeASTCopy(this.yy._originalAST);
    const currentSafe = this.createSafeASTCopy(currentAST);

    try {
      const originalJSON = JSON.stringify(originalSafe);
      const currentJSON = JSON.stringify(currentSafe);
      return originalJSON !== currentJSON;
    } catch (error) {
      console.warn('⚠️ AST comparison failed, assuming changes detected:', error);
      return true; // Assume changes if comparison fails
    }
  }

  /**
   * Create a safe copy of AST that can be JSON.stringify'd
   * Removes circular references and focuses on the data we care about
   */
  private createSafeASTCopy(ast: any): any {
    if (!ast || !ast.statements) {
      return { statements: [] };
    }

    return {
      statements: ast.statements.map((stmt: any) => ({
        type: stmt.type,
        originalIndex: stmt.originalIndex,
        // Handle both direct properties and data object structure
        data: stmt.data
          ? {
              from: stmt.data.from,
              to: stmt.data.to,
              message: stmt.data.message,
              arrow: stmt.data.arrow,
              participant: stmt.data.participant,
              id: stmt.data.id,
              alias: stmt.data.alias,
              position: stmt.data.position,
            }
          : undefined,
        // Legacy direct properties (fallback)
        from: stmt.from,
        to: stmt.to,
        message: stmt.message,
        arrow: stmt.arrow,
      })),
    };
  }

  /**
   * Apply AST changes while preserving original formatting using TokenStreamRewriter
   * This is where the real hybrid magic happens!
   */
  private applyASTChangesWithFormatting(currentAST: any): string {
    if (!this.yy._tokenRewriter || !this.yy._originalAST) {
      console.log('🚧 TokenStreamRewriter not available, falling back to AST regeneration');
      const astResult = this.generateCodeFromModifiedAST(currentAST);
      return astResult ? astResult.code : this.yy._originalInput;
    }

    try {
      console.log('🎯 Using TokenStreamRewriter for surgical edits...');

      // Find specific changes between original and current AST
      const changes = this.detectSpecificChanges(this.yy._originalAST, currentAST);

      if (changes.length === 0) {
        console.log('✅ No specific changes detected, returning original input');
        return this.yy._originalInput;
      }

      console.log(`🔧 Applying ${changes.length} surgical change(s)...`);

      // Apply each change using surgical string replacement
      changes.forEach((change, index) => {
        if (change.type === 'add') {
          console.log(
            `  ${index + 1}. ${change.type}: Added "${change.statement?.type}" statement`
          );
        } else {
          console.log(
            `  ${index + 1}. ${change.type}: "${change.oldValue}" → "${change.newValue}"`
          );
        }
        this.applyTokenChange(change);
      });

      // Return the surgically modified original input
      console.log('✅ Surgical edits applied successfully');
      console.log('📝 Modified text:', this.yy._originalInput);

      return this.yy._originalInput;
    } catch (error) {
      console.warn('⚠️ TokenStreamRewriter failed, falling back to AST regeneration:', error);
      const astResult = this.generateCodeFromModifiedAST(currentAST);
      return astResult ? astResult.code : this.yy._originalInput;
    }
  }

  /**
   * Detect specific changes between original and current AST
   * Returns an array of change objects that can be applied surgically
   */
  private detectSpecificChanges(originalAST: any, currentAST: any): any[] {
    const changes: any[] = [];

    if (!originalAST?.statements || !currentAST?.statements) {
      return changes;
    }

    // Compare statements by originalIndex to detect changes
    const originalMap = new Map();
    originalAST.statements.forEach((stmt: any) => {
      originalMap.set(stmt.originalIndex, stmt);
    });

    currentAST.statements.forEach((currentStmt: any) => {
      const originalStmt = originalMap.get(currentStmt.originalIndex);
      if (!originalStmt) {
        // New statement added
        changes.push({
          type: 'add',
          statementIndex: currentStmt.originalIndex,
          statement: currentStmt,
        });
        return;
      }

      // Check for message changes in existing statements
      if (currentStmt.type === 'message' && originalStmt.type === 'message') {
        const currentData = currentStmt.data || currentStmt;
        const originalData = originalStmt.data || originalStmt;

        if (currentData.message !== originalData.message) {
          changes.push({
            type: 'message_change',
            statementIndex: currentStmt.originalIndex,
            oldValue: originalData.message,
            newValue: currentData.message,
            statement: currentStmt,
            originalStatement: originalStmt,
          });
        }
      }
    });

    return changes;
  }

  /**
   * Apply a specific change using string-based replacement
   * This performs surgical edits preserving original formatting
   */
  private applyTokenChange(change: any): void {
    if (!this.yy._originalInput) {
      throw new Error('Original input not available for surgical edits');
    }

    try {
      if (change.type === 'message_change') {
        // Find the message location in the original input
        const messageTokens = this.findMessageTokensForStatement(change.statementIndex);

        if (messageTokens && messageTokens.length > 0) {
          const token = messageTokens[0];

          console.log(
            `🔧 Replacing message at line ${token.lineIndex}, pos ${token.messageStart}-${token.messageEnd}: "${token.originalText}" → "${change.newValue}"`
          );

          // Perform string-based replacement preserving formatting
          const lines = this.yy._originalInput.split('\n');
          const targetLine = lines[token.lineIndex];

          // Replace only the message part, preserving everything else
          const newLine =
            targetLine.substring(0, token.messageStart) +
            change.newValue +
            targetLine.substring(token.messageEnd);

          lines[token.lineIndex] = newLine;

          // Update the original input with the surgical change
          this.yy._originalInput = lines.join('\n');

          console.log(`✅ Surgical edit applied successfully`);
        } else {
          console.warn(`⚠️ Could not find message tokens for statement ${change.statementIndex}`);
          throw new Error('Message tokens not found');
        }
      } else if (change.type === 'add') {
        // For additions (like participants), surgical editing is complex
        // Fall back to full AST regeneration for now
        console.log(`🔄 Addition detected, falling back to full AST regeneration`);
        throw new Error('Addition requires full AST regeneration');
      } else {
        console.warn(`⚠️ Unsupported change type: ${change.type}`);
        throw new Error(`Unsupported change type: ${change.type}`);
      }
    } catch (error) {
      console.error('❌ Error applying surgical change:', error);
      throw error;
    }
  }

  /**
   * Find the message tokens for a specific statement in the parse tree
   * This maps AST statements back to their original tokens
   */
  private findMessageTokensForStatement(statementIndex: number): any[] | null {
    // For now, use a simpler approach: find the message text in the original input
    // and create pseudo-tokens for replacement

    if (!this.yy._originalInput || !this.yy._originalAST) {
      return null;
    }

    try {
      // Find the original statement
      const originalStmt = this.yy._originalAST.statements.find(
        (stmt: any) => stmt.originalIndex === statementIndex
      );

      if (!originalStmt || originalStmt.type !== 'message') {
        return null;
      }

      const originalData = originalStmt.data || originalStmt;
      const originalMessage = originalData.message;

      if (!originalMessage) {
        return null;
      }

      // Find the message text in the original input
      const lines = this.yy._originalInput.split('\n');
      let lineIndex = -1;
      let messageStart = -1;
      let messageEnd = -1;

      // Look for the message in each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const messageIndex = line.indexOf(originalMessage);

        if (messageIndex !== -1) {
          // Check if this looks like a sequence diagram message line
          const beforeMessage = line.substring(0, messageIndex);
          if (beforeMessage.includes('>>') || beforeMessage.includes('->')) {
            lineIndex = i;
            messageStart = messageIndex;
            messageEnd = messageIndex + originalMessage.length;
            break;
          }
        }
      }

      if (lineIndex === -1) {
        console.log(`🔍 Could not find message "${originalMessage}" in original input`);
        return null;
      }

      // Create pseudo-tokens for the message text
      return [
        {
          lineIndex,
          messageStart,
          messageEnd,
          originalText: originalMessage,
        },
      ];
    } catch (error) {
      console.error('❌ Error finding message tokens:', error);
      return null;
    }
  }

  /**
   * Generate code directly from a modified AST structure
   * This bypasses the parse tree and works directly with AST data
   */
  private generateCodeFromModifiedAST(
    ast: any
  ): { code: string; lines: string[]; ast: any } | null {
    if (!ast || !ast.statements) {
      console.warn('⚠️ No AST statements available for code generation');
      return null;
    }

    try {
      // Generate code directly from AST statements
      const lines: string[] = ['sequenceDiagram'];

      // Sort statements by originalIndex to maintain proper order
      const sortedStatements = [...ast.statements].sort((a, b) => {
        const aIndex = a.originalIndex ?? 999;
        const bIndex = b.originalIndex ?? 999;
        return aIndex - bIndex;
      });

      console.log('🔍 Debug: Processing statements for code generation:');
      console.log('📊 Total statements:', ast.statements.length);
      sortedStatements.forEach((stmt, index) => {
        console.log(
          `  ${index + 1}. Type: ${stmt.type}, OriginalIndex: ${stmt.originalIndex}, Data:`,
          stmt.data || 'N/A'
        );
      });

      // Process each statement in the AST
      sortedStatements.forEach((stmt: any) => {
        if (stmt.type === 'message') {
          const data = stmt.data || stmt; // Handle both data object and direct properties
          const from = data.from || '';
          const to = data.to || '';
          const message = data.message || '';
          const arrow = data.arrow || '->>';

          // Generate the message line
          const messageLine = `${from}${arrow}${to}: ${message}`;
          lines.push(messageLine);
        } else if (stmt.type === 'participant') {
          const data = stmt.data || stmt;
          const id = data.id || data.participant || '';
          const alias = data.alias || '';

          // Generate participant line with optional alias
          if (alias) {
            lines.push(`participant ${id} as "${alias}"`);
          } else {
            lines.push(`participant ${id}`);
          }
        }
        // Add more statement types as needed
      });

      const code = lines.join('\n');

      console.log('✅ Code generated from modified AST:');
      console.log('📝 Generated code:', code);
      console.log('📋 Generated lines:', lines);
      console.log('🌳 AST statements:', ast.statements.length);

      return {
        code,
        lines,
        ast,
      };
    } catch (error) {
      console.error('❌ Error generating code from modified AST:', error);
      return null;
    }
  }

  /**
   * Generate code from the stored parse tree
   * This enables AST-to-code regeneration for UI editing scenarios
   * Now also returns the structured AST for hybrid editing
   */
  generateCodeFromAST(): { code: string; lines: string[]; ast: any } | null {
    if (!this.yy._parseTree) {
      console.warn('⚠️ No parse tree available for code generation');
      return null;
    }

    try {
      const generator = new SequenceCodeGenerator();
      const result = generator.generateCode(this.yy._parseTree);

      console.log('✅ Code generated from AST:');
      console.log('📝 Generated code:', result.code);
      console.log('📋 Generated lines:', result.lines);
      console.log('🌳 AST statements:', result.ast.statements.length);

      return {
        code: result.code,
        lines: result.lines,
        ast: result.ast,
      };
    } catch (error) {
      console.error('❌ Error generating code from AST:', error);
      return null;
    }
  }
}

// Export for compatibility with existing code
export const parser = new ANTLRSequenceParser();

/**
 * Helper function to create ANTLR parser components for hybrid editor
 */
export function createSequenceParser(input: string): {
  parser: SequenceParser;
  tokenStream: CommonTokenStream;
} {
  console.log('🔧 Creating ANTLR sequence parser components');

  // Create lexer
  const inputStream = CharStream.fromString(input);
  const lexer = new SequenceLexer(inputStream);

  // Create token stream
  const tokenStream = new CommonTokenStream(lexer);

  // Create parser
  const parser = new SequenceParser(tokenStream);

  // Configure error handling - remove default error listeners for cleaner output
  parser.removeErrorListeners();

  return { parser, tokenStream };
}
export default parser;
