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
}

// Export for compatibility with existing code
export const parser = new ANTLRSequenceParser();
export default parser;
