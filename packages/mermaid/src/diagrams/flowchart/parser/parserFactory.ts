/**
 * Parser Factory for Flowchart Diagrams
 *
 * This module provides a factory pattern for selecting and instantiating
 * different flowchart parsers based on configuration.
 */

import { getConfig } from '../../../config.js';
import { log } from '../../../logger.js';
import type { FlowchartDiagramConfig } from '../../../config.type.js';
import { FlowDB } from '../flowDb.js';

// Parser imports
import flowParserJison from './flow.js';

// Dynamic imports for optional parsers
let flowParserANTLR: any = null;
let flowParserLark: any = null;

/**
 * Parser interface that all parsers must implement
 */
export interface FlowchartParser {
  parser: {
    yy: any;
    parse: (input: string) => void;
  };
  yy: any;
  parse: (input: string) => void;
}

/**
 * Parser type enumeration
 */
export type ParserType = 'jison' | 'antlr' | 'lark';

/**
 * Parser factory class
 */
export class FlowchartParserFactory {
  private static instance: FlowchartParserFactory;
  private parsers: Map<ParserType, FlowchartParser | null> = new Map();
  private loadingPromises: Map<ParserType, Promise<FlowchartParser>> = new Map();

  private constructor() {
    // Initialize with Jison parser (always available)
    // Store the full JISON object, not just the parser property
    this.parsers.set('jison', flowParserJison);
    this.parsers.set('antlr', null);
    this.parsers.set('lark', null);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FlowchartParserFactory {
    if (!FlowchartParserFactory.instance) {
      FlowchartParserFactory.instance = new FlowchartParserFactory();
    }
    return FlowchartParserFactory.instance;
  }

  /**
   * Load ANTLR parser dynamically
   */
  private async loadANTLRParser(): Promise<FlowchartParser> {
    if (this.parsers.get('antlr')) {
      return this.parsers.get('antlr')!;
    }

    if (this.loadingPromises.has('antlr')) {
      return this.loadingPromises.get('antlr')!;
    }

    const loadPromise = (async () => {
      try {
        log.info('Loading ANTLR parser...');
        const antlrModule = await import('./flowParserANTLR.js');
        flowParserANTLR = antlrModule.default;
        this.parsers.set('antlr', flowParserANTLR);
        log.info('ANTLR parser loaded successfully');
        return flowParserANTLR;
      } catch (error) {
        log.error('Failed to load ANTLR parser:', error);
        log.warn('Falling back to Jison parser');
        return this.parsers.get('jison')!;
      }
    })();

    this.loadingPromises.set('antlr', loadPromise);
    return loadPromise;
  }

  /**
   * Load Lark parser dynamically
   */
  private async loadLarkParser(): Promise<FlowchartParser> {
    if (this.parsers.get('lark')) {
      return this.parsers.get('lark')!;
    }

    if (this.loadingPromises.has('lark')) {
      return this.loadingPromises.get('lark')!;
    }

    const loadPromise = (async () => {
      try {
        console.log('🔍 FACTORY: Loading Lark parser...');
        log.info('Loading Lark parser...');
        const larkModule = await import('./flowParserLark.js');
        console.log('🔍 FACTORY: Lark module loaded:', larkModule);
        flowParserLark = larkModule.default;
        console.log('🔍 FACTORY: Lark parser instance:', flowParserLark);
        this.parsers.set('lark', flowParserLark);
        log.info('Lark parser loaded successfully');
        return flowParserLark;
      } catch (error) {
        console.error('🔍 FACTORY: Failed to load Lark parser:', error);
        log.error('Failed to load Lark parser:', error);
        log.warn('Falling back to Jison parser');
        return this.parsers.get('jison')!;
      }
    })();

    this.loadingPromises.set('lark', loadPromise);
    return loadPromise;
  }

  /**
   * Create a standardized parser interface with consistent database methods
   */
  private createParserInterface(parser: any): FlowchartParser {
    // Check if parser is null or undefined
    if (!parser) {
      throw new Error('Parser is null or undefined');
    }

    // For Lark parser, use its existing database; for others, create a fresh one
    let db: any;
    if (
      parser.yy &&
      parser.constructor &&
      parser.constructor.name === 'LarkFlowParserIntegration'
    ) {
      // Lark parser - use existing database but clear it
      db = parser.yy;
      db.clear();
      db.setGen('gen-2');
    } else {
      // JISON/ANTLR parsers - create fresh database
      db = new FlowDB();

      // For JISON parser, set yy on the parser property
      if (parser.parser) {
        parser.parser.yy = db;
      } else {
        // For ANTLR/LARK parsers, set yy directly
        parser.yy = db;
      }
    }

    // FlowDB already has all the required methods, no need to add them

    return {
      parse: (input: string) => {
        try {
          // For JISON parser, call parser.parser.parse()
          if (parser.parser && typeof parser.parser.parse === 'function') {
            return parser.parser.parse(input);
          }
          // For ANTLR/LARK parsers, call parser.parse()
          else if (typeof parser.parse === 'function') {
            return parser.parse(input);
          } else {
            throw new Error('Parser does not have a parse method');
          }
        } catch (error) {
          console.error(`Parser error:`, error);
          throw error;
        }
      },
      parser: {
        yy: db,
        parse: (input: string) => {
          try {
            // For JISON parser, call parser.parser.parse()
            if (parser.parser && typeof parser.parser.parse === 'function') {
              return parser.parser.parse(input);
            }
            // For ANTLR/LARK parsers, call parser.parse()
            else if (typeof parser.parse === 'function') {
              return parser.parse(input);
            } else {
              throw new Error('Parser does not have a parse method');
            }
          } catch (error) {
            console.error(`Parser error:`, error);
            throw error;
          }
        },
      },
      yy: db,
    };
  }

  /**
   * Get parser based on configuration
   */
  public async getParser(parserType?: ParserType): Promise<FlowchartParser> {
    // Get parser type from config if not specified
    if (!parserType) {
      const config = getConfig();
      const flowchartConfig = config.flowchart as FlowchartDiagramConfig;
      parserType = flowchartConfig?.parser || 'jison';
    }

    console.log(`🔍 FACTORY: Requesting ${parserType} parser`);
    log.debug(`Requesting ${parserType} parser`);

    let parser: FlowchartParser;
    switch (parserType) {
      case 'antlr':
        parser = await this.loadANTLRParser();
        break;

      case 'lark':
        parser = await this.loadLarkParser();
        break;

      case 'jison':
      default:
        parser = this.parsers.get('jison')!;
        if (!parser) {
          throw new Error('JISON parser not available');
        }
        break;
    }

    // Return parser with standardized interface
    return this.createParserInterface(parser);
  }

  /**
   * Check if a parser is available (loaded or can be loaded)
   */
  public isParserAvailable(parserType: ParserType): boolean {
    switch (parserType) {
      case 'jison':
        return true; // Always available
      case 'antlr':
      case 'lark':
        return true; // Can be dynamically loaded
      default:
        return false;
    }
  }

  /**
   * Get list of available parsers
   */
  public getAvailableParsers(): ParserType[] {
    return ['jison', 'antlr', 'lark'];
  }

  /**
   * Preload all parsers (useful for testing or when all parsers are needed)
   */
  public async preloadAllParsers(): Promise<void> {
    log.info('Preloading all flowchart parsers...');

    const loadPromises = [this.loadANTLRParser(), this.loadLarkParser()];

    try {
      await Promise.all(loadPromises);
      log.info('All flowchart parsers preloaded successfully');
    } catch (error) {
      log.warn('Some parsers failed to preload, but fallbacks are available');
    }
  }

  /**
   * Reset factory (useful for testing)
   */
  public reset(): void {
    this.parsers.clear();
    this.loadingPromises.clear();
    this.parsers.set('jison', flowParserJison);
    this.parsers.set('antlr', null);
    this.parsers.set('lark', null);
  }
}

/**
 * Convenience function to get a parser instance
 */
export async function getFlowchartParser(parserType?: ParserType): Promise<FlowchartParser> {
  const factory = FlowchartParserFactory.getInstance();
  return factory.getParser(parserType);
}

/**
 * Convenience function to preload all parsers
 */
export async function preloadAllFlowchartParsers(): Promise<void> {
  const factory = FlowchartParserFactory.getInstance();
  return factory.preloadAllParsers();
}

/**
 * Get available parser types
 */
export function getAvailableFlowchartParsers(): ParserType[] {
  const factory = FlowchartParserFactory.getInstance();
  return factory.getAvailableParsers();
}

// Export singleton instance for direct access
export const flowchartParserFactory = FlowchartParserFactory.getInstance();
