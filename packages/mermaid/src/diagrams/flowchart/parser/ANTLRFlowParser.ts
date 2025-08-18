/**
 * ANTLR Parser Integration Layer for Flowchart
 *
 * This module provides the integration layer between ANTLR parser and the existing
 * Mermaid flowchart system, maintaining compatibility with the Jison parser interface.
 */

import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { FlowLexer } from './generated/src/diagrams/flowchart/parser/FlowLexer';
import { FlowParser } from './generated/src/diagrams/flowchart/parser/FlowParser';
import { FlowVisitor } from './FlowVisitor';
import { FlowDB } from '../flowDb';
import { log } from '../../../logger';

/**
 * ANTLR-based flowchart parser that maintains compatibility with Jison parser interface
 */
export class ANTLRFlowParser {
  private db: FlowDB;

  constructor() {
    this.db = new FlowDB();
  }

  /**
   * Get the parser's yy object (FlowDB instance) for compatibility with Jison interface
   */
  get yy(): FlowDB {
    return this.db;
  }

  /**
   * Set the parser's yy object for compatibility with Jison interface
   */
  set yy(db: FlowDB) {
    this.db = db;
  }

  /**
   * Parse flowchart input using ANTLR parser
   *
   * @param input - Flowchart definition string
   * @returns Parse result (for compatibility, returns undefined like Jison)
   */
  parse(input: string): any {
    try {
      log.debug('ANTLRFlowParser: Starting parse of input:', input.substring(0, 100) + '...');

      // Create ANTLR input stream
      const inputStream = new ANTLRInputStream(input);

      // Create lexer
      const lexer = new FlowLexer(inputStream);

      // Create token stream
      const tokenStream = new CommonTokenStream(lexer);

      // Create parser
      const parser = new FlowParser(tokenStream);

      // Configure error handling
      parser.removeErrorListeners(); // Remove default console error listener
      parser.addErrorListener({
        syntaxError: (recognizer, offendingSymbol, line, charPositionInLine, msg, e) => {
          const error = `Parse error at line ${line}, column ${charPositionInLine}: ${msg}`;
          log.error('ANTLRFlowParser:', error);
          throw new Error(error);
        },
      });

      // Parse starting from the 'start' rule
      const parseTree = parser.start();

      log.debug('ANTLRFlowParser: Parse tree created successfully');

      // Create visitor with FlowDB instance
      const visitor = new FlowVisitor(this.db);

      // Visit the parse tree to execute semantic actions
      const result = visitor.visit(parseTree);

      log.debug('ANTLRFlowParser: Semantic analysis completed');
      log.debug('ANTLRFlowParser: Vertices:', this.db.getVertices().size);
      log.debug('ANTLRFlowParser: Edges:', this.db.getEdges().length);

      // Return undefined for compatibility with Jison parser interface
      return undefined;
    } catch (error) {
      log.error('ANTLRFlowParser: Parse failed:', error);
      throw error;
    }
  }

  /**
   * Get parser instance for compatibility
   */
  get parser() {
    return {
      yy: this.db,
      parse: this.parse.bind(this),
    };
  }
}

/**
 * Create a new ANTLR parser instance
 */
export function createANTLRFlowParser(): ANTLRFlowParser {
  return new ANTLRFlowParser();
}

/**
 * Default export for compatibility with existing imports
 */
const antlrFlowParser = createANTLRFlowParser();
export default antlrFlowParser;
