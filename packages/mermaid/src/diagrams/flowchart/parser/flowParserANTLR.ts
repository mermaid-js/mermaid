/**
 * ANTLR Flowchart Parser Integration
 *
 * This module provides a drop-in replacement for the Jison flowchart parser
 * using ANTLR4. It maintains full compatibility with the existing Mermaid
 * flowchart system while providing better error handling and maintainability.
 */

import { ANTLRFlowParser } from './ANTLRFlowParser.js';
import { FlowDB } from '../flowDb.js';
import { log } from '../../../logger.js';

/**
 * ANTLR-based flowchart parser with Jison-compatible interface
 */
class FlowParserANTLR {
  private antlrParser: ANTLRFlowParser;

  constructor() {
    this.antlrParser = new ANTLRFlowParser();
  }

  /**
   * Get the parser's yy object (FlowDB instance)
   * This maintains compatibility with the existing Jison parser interface
   */
  get yy(): FlowDB {
    return this.antlrParser.yy;
  }

  /**
   * Set the parser's yy object
   * This maintains compatibility with the existing Jison parser interface
   */
  set yy(db: FlowDB) {
    this.antlrParser.yy = db;
  }

  /**
   * Parse flowchart input
   *
   * @param input - Flowchart definition string
   * @returns Parse result (undefined for compatibility with Jison)
   */
  parse(input: string): any {
    try {
      log.debug('FlowParserANTLR: Parsing input with ANTLR parser');

      // Clean up input - remove trailing whitespace after closing braces
      const cleanInput = input.replace(/}\s*\n/g, '}\n');

      // Use ANTLR parser
      const result = this.antlrParser.parse(cleanInput);

      log.debug('FlowParserANTLR: Parse completed successfully');
      return result;
    } catch (error) {
      log.error('FlowParserANTLR: Parse failed:', error);
      throw error;
    }
  }

  /**
   * Get parser object for compatibility with existing code
   */
  get parser() {
    return {
      yy: this.yy,
      parse: this.parse.bind(this),
    };
  }
}

// Create the parser instance
const flowParserANTLR = new FlowParserANTLR();

// Export with the same interface as the Jison parser
export default {
  parser: flowParserANTLR.parser,
  parse: (input: string) => {
    // Apply the same input preprocessing as the original Jison parser
    const cleanInput = input.replace(/}\s*\n/g, '}\n');
    return flowParserANTLR.parse(cleanInput);
  },
};
