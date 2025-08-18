/**
 * Lark Parser Integration for Flowchart Diagrams
 *
 * This module integrates the Lark-inspired parser with the Mermaid flowchart system.
 */

import { FlowDB } from '../flowDb.js';
import { LarkFlowParser } from './LarkFlowParser.js';

/**
 * Lark parser integration class for compatibility with Mermaid
 */
class LarkFlowParserIntegration {
  private _yy: FlowDB;
  public parser: {
    yy: FlowDB;
    parse: (input: string) => void;
  };
  private larkParser: LarkFlowParser;

  constructor() {
    this._yy = new FlowDB();
    this.larkParser = new LarkFlowParser(this._yy);
    this.parser = {
      yy: this._yy,
      parse: this.parse.bind(this),
    };
  }

  /**
   * Get the yy database instance
   */
  get yy(): FlowDB {
    return this._yy;
  }

  /**
   * Set the yy database instance and update internal parser
   */
  set yy(db: FlowDB) {
    this._yy = db;
    this.larkParser = new LarkFlowParser(db); // Create new parser with new database
    this.parser.yy = db;
  }

  /**
   * Parse flowchart input using Lark-inspired parser
   */
  parse(input: string): void {
    try {
      // Validate input
      if (input === null || input === undefined) {
        throw new Error('Input cannot be null or undefined');
      }

      if (typeof input !== 'string') {
        throw new Error(`Expected string input, got ${typeof input}`);
      }

      // Clear and initialize database
      this.yy.clear();
      this.yy.setGen('gen-2');

      // Parse using Lark parser
      this.larkParser.parse(input);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Lark parser error: ${errorMessage}`);
    }
  }

  /**
   * Clear the database
   */
  clear(): void {
    this.yy.clear();
  }
}

// Create and export the parser instance
const flowParserLark = new LarkFlowParserIntegration();

export default flowParserLark;
