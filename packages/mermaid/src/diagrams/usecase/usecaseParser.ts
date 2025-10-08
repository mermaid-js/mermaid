// Import ANTLR parser from the parser package
import { parse } from '@mermaid-js/parser';
import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import type {
  UsecaseDB,
  Actor,
  UseCase,
  SystemBoundary,
  Relationship,
  ArrowType,
} from './usecaseTypes.js';
import { db } from './usecaseDb.js';

// ANTLR parser result interface
interface UsecaseParseResult {
  actors: { id: string; name: string; metadata?: Record<string, string> }[];
  useCases: { id: string; name: string; nodeId?: string; systemBoundary?: string }[];
  systemBoundaries: { id: string; name: string; useCases: string[]; type?: 'package' | 'rect' }[];
  relationships: {
    id: string;
    from: string;
    to: string;
    type: 'association' | 'include' | 'extend';
    arrowType: number;
    label?: string;
  }[];
  direction?: string;
  accDescr?: string;
  accTitle?: string;
  title?: string;
}

/**
 * Parse usecase diagram using ANTLR parser
 */
const parseUsecaseWithAntlr = async (input: string): Promise<UsecaseParseResult> => {
  // Use the ANTLR parser from @mermaid-js/parser
  const result = (await parse('usecase', input)) as UsecaseParseResult;
  return result;
};

/**
 * Populate the database with parsed ANTLR results
 */
const populateDb = (ast: UsecaseParseResult, db: UsecaseDB) => {
  // Clear existing data
  db.clear();

  // Add actors (ANTLR result already has id, name, and metadata)
  ast.actors.forEach((actorData) => {
    const actor: Actor = {
      id: actorData.id,
      name: actorData.name,
      metadata: actorData.metadata,
    };
    db.addActor(actor);
  });

  // Add use cases (ANTLR result already has id, name, nodeId, and systemBoundary)
  ast.useCases.forEach((useCaseData) => {
    const useCase: UseCase = {
      id: useCaseData.id,
      name: useCaseData.name,
      nodeId: useCaseData.nodeId,
      systemBoundary: useCaseData.systemBoundary,
    };
    db.addUseCase(useCase);
  });

  // Add system boundaries
  if (ast.systemBoundaries) {
    ast.systemBoundaries.forEach((boundaryData) => {
      const systemBoundary: SystemBoundary = {
        id: boundaryData.id,
        name: boundaryData.name,
        useCases: boundaryData.useCases,
        type: boundaryData.type || 'rect', // default to 'rect' if not specified
      };
      db.addSystemBoundary(systemBoundary);
    });
  }

  // Add relationships (ANTLR result already has proper structure)
  ast.relationships.forEach((relationshipData) => {
    const relationship: Relationship = {
      id: relationshipData.id,
      from: relationshipData.from,
      to: relationshipData.to,
      type: relationshipData.type,
      arrowType: relationshipData.arrowType as ArrowType,
      label: relationshipData.label,
    };
    db.addRelationship(relationship);
  });

  // Set direction if provided
  if (ast.direction) {
    db.setDirection(ast.direction as any);
  }

  log.debug('Populated usecase database:', {
    actors: ast.actors.length,
    useCases: ast.useCases.length,
    relationships: ast.relationships.length,
    direction: ast.direction,
  });
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    log.debug('Parsing usecase diagram with ANTLR:', input);

    try {
      // Use our ANTLR parser
      const ast: UsecaseParseResult = await parseUsecaseWithAntlr(input);
      log.debug('ANTLR parsing result:', ast);

      // Populate common database fields
      populateCommonDb(ast as any, db);

      // Populate the database with validation
      populateDb(ast, db);

      log.debug('Usecase diagram parsing completed successfully');
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
