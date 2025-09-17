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
    console.log('🎯 ANTLR Parser: Starting parse');
    console.log('📝 Input:', input);

    try {
      // Reset database state
      console.log('🔄 ANTLR Parser: Resetting database state');
      if (this.yy.clear) {
        this.yy.clear();
      }

      // Create input stream
      console.log('📄 ANTLR Parser: Creating input stream');
      const inputStream = CharStream.fromString(input);

      // Create lexer
      console.log('🔤 ANTLR Parser: Creating lexer');
      const lexer = new FlowLexer(inputStream);

      // Create token stream
      console.log('🎫 ANTLR Parser: Creating token stream');
      const tokenStream = new CommonTokenStream(lexer);

      // Create parser
      console.log('⚙️ ANTLR Parser: Creating parser');
      const parser = new FlowParser(tokenStream);

      // Generate parse tree
      console.log('🌳 ANTLR Parser: Starting parse tree generation');
      const tree = parser.start();
      console.log('✅ ANTLR Parser: Parse tree generated successfully');

      // Check if we should use Visitor or Listener pattern
      // Default to Visitor pattern (true) unless explicitly set to false
      const useVisitorPattern = process.env.USE_ANTLR_VISITOR !== 'false';

      if (useVisitorPattern) {
        console.log('🎯 ANTLR Parser: Creating visitor');
        const visitor = new FlowchartVisitor(this.yy);
        console.log('🚶 ANTLR Parser: Visiting parse tree');
        visitor.visit(tree);
      } else {
        console.log('👂 ANTLR Parser: Creating listener');
        const listener = new FlowchartListener(this.yy);
        console.log('🚶 ANTLR Parser: Walking parse tree');
        ParseTreeWalker.DEFAULT.walk(listener, tree);
      }

      console.log('✅ ANTLR Parser: Parse completed successfully');
      return this.yy;
    } catch (error) {
      console.log('❌ ANTLR parsing error:', error);
      console.log('📝 Input that caused error:', input);
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
