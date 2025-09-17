/**
 * ANTLR-based Flowchart Parser
 *
 * This is a proper ANTLR implementation using antlr-ng generated parser code.
 * It provides the same interface as the Jison parser for 100% compatibility.
 *
 * Goal: Achieve 99.7% pass rate (944/947 tests) to match Jison parser performance
 */

import { CharStream, CommonTokenStream, ParseTreeWalker } from 'antlr4ng';
import { FlowLexer } from './generated/FlowLexer.js';
import { FlowParser } from './generated/FlowParser.js';
import { FlowchartListener } from './FlowchartListener.js';
import { FlowchartVisitor } from './FlowchartVisitor.js';

/**
 * Main ANTLR parser class that provides the same interface as the Jison parser
 */
export class ANTLRFlowParser {
  yy: any;

  constructor() {
    this.yy = {};
  }

  parse(input: string): any {
    const startTime = performance.now();

    // Count approximate complexity for performance decisions (optimized regex)
    const edgeCount = (input.match(/-->/g) ?? []).length;
    // Use simpler, faster regex for node counting
    const nodeCount = new Set(input.match(/\w+(?=\s*(?:-->|;|[\[({]))/g) ?? []).size;

    // Only log for complex diagrams or when debugging
    const isComplexDiagram = edgeCount > 100 || input.length > 1000;
    const getEnvVar = (name: string): string | undefined => {
      try {
        if (typeof process !== 'undefined' && process.env) {
          return process.env[name];
        }
      } catch (e) {
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
      console.log('🎯 ANTLR Parser: Starting parse');
      console.log(`📝 Input length: ${input.length} characters`);
      console.log(`📊 Estimated complexity: ~${edgeCount} edges, ~${nodeCount} nodes`);
    }

    try {
      // Reset database state
      const resetStart = performance.now();
      if (shouldLog) console.log('🔄 ANTLR Parser: Resetting database state');
      if (this.yy.clear) {
        this.yy.clear();
      }
      const resetTime = performance.now() - resetStart;

      // Create input stream and lexer (fast operations, minimal logging)
      const lexerSetupStart = performance.now();
      const inputStream = CharStream.fromString(input);
      const lexer = new FlowLexer(inputStream);
      const tokenStream = new CommonTokenStream(lexer);
      const lexerSetupTime = performance.now() - lexerSetupStart;

      // Create parser (fast operation)
      const parserSetupStart = performance.now();
      const parser = new FlowParser(tokenStream);
      const parserSetupTime = performance.now() - parserSetupStart;

      // Generate parse tree (this is the bottleneck)
      const parseTreeStart = performance.now();
      if (shouldLog) console.log('🌳 ANTLR Parser: Starting parse tree generation');
      const tree = parser.start();
      const parseTreeTime = performance.now() - parseTreeStart;
      if (shouldLog) {
        console.log(`⏱️ Parse tree generation took: ${parseTreeTime.toFixed(2)}ms`);
        console.log('✅ ANTLR Parser: Parse tree generated successfully');
      }

      // Check if we should use Visitor or Listener pattern
      // Default to Visitor pattern (true) unless explicitly set to false
      const useVisitorPattern = getEnvVar('USE_ANTLR_VISITOR') !== 'false';

      const traversalStart = performance.now();
      if (useVisitorPattern) {
        if (shouldLog) console.log('🎯 ANTLR Parser: Creating visitor');
        const visitor = new FlowchartVisitor(this.yy);
        if (shouldLog) console.log('🚶 ANTLR Parser: Visiting parse tree');
        try {
          visitor.visit(tree);
          if (shouldLog) console.log('✅ ANTLR Parser: Visitor completed successfully');
        } catch (error) {
          console.error('❌ ANTLR Parser: Visitor failed:', error.message);
          console.error('❌ ANTLR Parser: Visitor stack:', error.stack);
          throw error;
        }
      } else {
        if (shouldLog) console.log('👂 ANTLR Parser: Creating listener');
        const listener = new FlowchartListener(this.yy);
        if (shouldLog) console.log('🚶 ANTLR Parser: Walking parse tree');
        try {
          ParseTreeWalker.DEFAULT.walk(listener, tree);
          if (shouldLog) console.log('✅ ANTLR Parser: Listener completed successfully');
        } catch (error) {
          console.error('❌ ANTLR Parser: Listener failed:', error.message);
          console.error('❌ ANTLR Parser: Listener stack:', error.stack);
          throw error;
        }
      }
      const traversalTime = performance.now() - traversalStart;

      const totalTime = performance.now() - startTime;

      // Only show performance breakdown for complex diagrams or debug mode
      if (shouldLog) {
        console.log(`⏱️ Tree traversal took: ${traversalTime.toFixed(2)}ms`);
        console.log(
          `⏱️ Total parse time: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`
        );

        // Performance breakdown
        console.log('📊 Performance breakdown:');
        console.log(
          `  - Database reset: ${resetTime.toFixed(2)}ms (${((resetTime / totalTime) * 100).toFixed(1)}%)`
        );
        console.log(
          `  - Lexer setup: ${lexerSetupTime.toFixed(2)}ms (${((lexerSetupTime / totalTime) * 100).toFixed(1)}%)`
        );
        console.log(
          `  - Parser setup: ${parserSetupTime.toFixed(2)}ms (${((parserSetupTime / totalTime) * 100).toFixed(1)}%)`
        );
        console.log(
          `  - Parse tree: ${parseTreeTime.toFixed(2)}ms (${((parseTreeTime / totalTime) * 100).toFixed(1)}%)`
        );
        console.log(
          `  - Tree traversal: ${traversalTime.toFixed(2)}ms (${((traversalTime / totalTime) * 100).toFixed(1)}%)`
        );
        console.log('✅ ANTLR Parser: Parse completed successfully');
      }
      return this.yy;
    } catch (error) {
      const totalTime = performance.now() - startTime;
      console.log(`❌ ANTLR parsing error after ${totalTime.toFixed(2)}ms:`, error);
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
export const parser = new ANTLRFlowParser();
