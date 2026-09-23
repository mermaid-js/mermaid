import { allSyntaxMetadata } from './generated/all.js';
import type { DiagramSyntax } from './types.js';

export { declarations } from './declarations.js';
export { diagramLanguageData, getDiagramData, getDiagramLanguageData } from './diagrams.js';
export { detectDiagramType, diagramPatterns } from './detectors.js';
export type {
  DiagramDeclaration,
  DiagramLanguageData,
  DiagramSyntax,
  SyntaxIdentifier,
  SyntaxSnippet,
  SyntaxToken,
  SyntaxTokenKind,
} from './types.js';

/**
 * Raw syntax metadata extracted from mermaid's grammars. Experimental: the shape and contents
 * may change in minor releases, so pin a version and expect breaking changes.
 *
 * Import a single diagram from `@mermaid-js/syntax-metadata/diagrams/<grammarId>` when you only
 * need one; this entry point carries every diagram.
 *
 * @param grammarId - optional grammar id to filter by, e.g. `sequenceDiagram`.
 */
export const getSyntaxMetadata = (grammarId?: string): DiagramSyntax[] =>
  grammarId === undefined
    ? allSyntaxMetadata
    : allSyntaxMetadata.filter((diagram) => diagram.grammarId === grammarId);
