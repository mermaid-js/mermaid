// Import local ANTLR parser
import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { db } from './usecaseDb.js';

// Import local ANTLR parser implementation
import antlrParser from './parser/antlr/antlr-parser.js';

/**
 * Parse usecase diagram using local ANTLR parser
 */
const parseUsecaseWithLocalAntlr = (input: string) => {
  // Set the database instance
  antlrParser.yy = db;

  // Parse and return the populated database
  return antlrParser.parse(input);
};

export const parser: ParserDefinition = {
  parse: (input: string): void => {
    log.debug('Parsing usecase diagram with local ANTLR parser:', input);

    try {
      // Use local ANTLR parser
      parseUsecaseWithLocalAntlr(input);
      log.debug('ANTLR parsing completed successfully');
    } catch (error) {
      log.error('Error parsing usecase diagram:', error);

      // Check if it's a UsecaseParseError from our ANTLR parser
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'UsecaseParseError'
      ) {
        // Re-throw the detailed error for better error reporting
        throw error;
      }

      // For other errors, wrap them in a generic error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const wrappedError = new Error(`Failed to parse usecase diagram: ${errorMessage}`);

      // Add hash property for consistency with other diagram types
      (wrappedError as any).hash = {
        text: input.split('\n')[0] || '',
        token: 'unknown',
        line: '1',
        loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
        expected: ['valid usecase syntax'],
      };

      throw wrappedError;
    }
  },
};
