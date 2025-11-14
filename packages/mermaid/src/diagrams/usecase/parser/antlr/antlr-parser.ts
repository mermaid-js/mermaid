/**
 * ANTLR-based Usecase Diagram Parser
 *
 * This is a proper ANTLR implementation using antlr-ng generated parser code.
 * It provides the same interface as the existing parser for 100% compatibility.
 *
 * Follows the same structure as flowchart and sequence ANTLR parsers with both
 * listener and visitor pattern support.
 */

import { CharStream, CommonTokenStream, ParseTreeWalker } from 'antlr4ng';
import { UsecaseLexer } from './generated/UsecaseLexer.js';
import { UsecaseParser } from './generated/UsecaseParser.js';
import { UsecaseListener } from './UsecaseListener.js';
import { UsecaseVisitor } from './UsecaseVisitor.js';
import { UsecaseErrorListener } from './UsecaseErrorListener.js';
import type { UsecaseDB } from '../../usecaseTypes.js';
import { log } from '../../../../logger.js';

/**
 * Main ANTLR parser class that provides the same interface as the existing parser
 */
export class ANTLRUsecaseParser {
  yy: UsecaseDB | null;

  constructor() {
    this.yy = null;
  }

  /**
   * Parse usecase diagram input using ANTLR
   *
   * @param input - The usecase diagram text to parse
   * @returns The database instance populated with parsed data
   */
  parse(input: string): UsecaseDB {
    if (!this.yy) {
      throw new Error('Usecase ANTLR parser missing yy (database).');
    }

    const startTime = performance.now();

    // Get environment variable helper
    const getEnvVar = (name: string): string | undefined => {
      try {
        if (typeof process !== 'undefined' && process.env) {
          return process.env[name];
        }
      } catch (_e) {
        // process is not defined in browser
      }

      // Browser fallback
      if (typeof window !== 'undefined' && (window as any).MERMAID_CONFIG) {
        return (window as any).MERMAID_CONFIG[name];
      }
      return undefined;
    };

    const shouldLog = getEnvVar('ANTLR_DEBUG') === 'true';

    if (shouldLog) {
      log.debug('🎯 ANTLR Usecase Parser: Starting parse');
      log.debug(`📝 Input length: ${input.length} characters`);
    }

    try {
      // Reset database state
      if (this.yy.clear) {
        this.yy.clear();
      }

      // Create input stream and lexer
      const inputStream = CharStream.fromString(input);
      const lexer = new UsecaseLexer(inputStream);

      // Add custom error listener to lexer
      const lexerErrorListener = new UsecaseErrorListener();
      lexer.removeErrorListeners();
      lexer.addErrorListener(lexerErrorListener);

      const tokenStream = new CommonTokenStream(lexer);

      // Create parser
      const parser = new UsecaseParser(tokenStream);

      // Add custom error listener to parser
      const parserErrorListener = new UsecaseErrorListener();
      parser.removeErrorListeners();
      parser.addErrorListener(parserErrorListener);

      // Generate parse tree
      if (shouldLog) {
        log.debug('🌳 ANTLR Usecase Parser: Starting parse tree generation');
      }
      const tree = parser.start();

      // Check for syntax errors
      if (lexerErrorListener.hasErrors()) {
        throw lexerErrorListener.createDetailedError();
      }
      if (parserErrorListener.hasErrors()) {
        throw parserErrorListener.createDetailedError();
      }

      if (shouldLog) {
        log.debug('✅ ANTLR Usecase Parser: Parse tree generated successfully');
      }

      // Check if we should use Visitor or Listener pattern
      // Default to Visitor pattern (true) unless explicitly set to false
      const useVisitorPattern = getEnvVar('USE_ANTLR_VISITOR') !== 'false';

      if (shouldLog) {
        log.debug('🔧 Usecase Parser: Pattern =', useVisitorPattern ? 'Visitor' : 'Listener');
      }

      if (useVisitorPattern) {
        const visitor = new UsecaseVisitor(this.yy);
        try {
          visitor.visit(tree);
          if (shouldLog) {
            log.debug('✅ ANTLR Usecase Parser: Visitor completed successfully');
          }
        } catch (error) {
          log.error(
            '❌ ANTLR Usecase Parser: Visitor failed:',
            error instanceof Error ? error.message : String(error)
          );
          log.error(
            '❌ ANTLR Usecase Parser: Visitor stack:',
            error instanceof Error ? error.stack : undefined
          );
          throw error;
        }
      } else {
        const listener = new UsecaseListener(this.yy);
        try {
          ParseTreeWalker.DEFAULT.walk(listener, tree);
          if (shouldLog) {
            log.debug('✅ ANTLR Usecase Parser: Listener completed successfully');
          }
        } catch (error) {
          log.error(
            '❌ ANTLR Usecase Parser: Listener failed:',
            error instanceof Error ? error.message : String(error)
          );
          log.error(
            '❌ ANTLR Usecase Parser: Listener stack:',
            error instanceof Error ? error.stack : undefined
          );
          throw error;
        }
      }

      const totalTime = performance.now() - startTime;

      if (shouldLog) {
        log.debug(`⏱️ Total parse time: ${totalTime.toFixed(2)}ms`);
        log.debug('✅ ANTLR Usecase Parser: Parse completed successfully');
      }

      return this.yy;
    } catch (error) {
      const totalTime = performance.now() - startTime;
      log.error(`❌ ANTLR usecase parsing error after ${totalTime.toFixed(2)}ms:`, error);
      log.error('📝 Input that caused error (first 500 chars):', input.substring(0, 500));
      throw error;
    }
  }

  // Provide the same interface as existing parser
  setYY(yy: UsecaseDB) {
    this.yy = yy;
  }
}

// Export for compatibility with existing code
export const parser = new ANTLRUsecaseParser();

export default parser;
