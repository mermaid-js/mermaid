import { curatedDiagrams } from './curated.js';
import { diagramPatterns } from './detectors.js';
import { allSyntaxMetadata } from './generated/all.js';
import type { DiagramLanguageData, DiagramSyntax, SyntaxToken } from './types.js';

// Grammar ids that differ from the detector id editors use.
const DETECTOR_IDS: Record<string, string> = { flow: 'flowchart', quadrant: 'quadrantChart' };

// Diagrams without a grammar in mermaid (external plugins) keep curated tokens.
const EXTERNAL_TOKENS: Record<string, SyntaxToken[]> = {
  zenuml: [
    'title',
    'actor',
    'participant',
    '@Actor',
    '@Boundary',
    '@Control',
    '@Database',
    '@Entity',
    '@Queue',
    '@Starter',
    'par',
    'if',
    'else',
    'opt',
    'loop',
    'return',
    'async',
    'await',
  ].map((text) => ({ contexts: [], kind: 'keyword', text, token: text })),
};

const detectorById = new Map(diagramPatterns.map(({ diagramId, pattern }) => [diagramId, pattern]));
const curatedById = new Map(curatedDiagrams.map((diagram) => [diagram.id, diagram]));

const merge = (syntax: DiagramSyntax): DiagramLanguageData => {
  const id = DETECTOR_IDS[syntax.grammarId] ?? syntax.grammarId;
  const curated = curatedById.get(id);
  return {
    detector: detectorById.get(id),
    docsUrl: curated?.docsUrl,
    engine: syntax.engine,
    extractIdentifiers: curated?.extractIdentifiers,
    grammarId: syntax.grammarId,
    id,
    snippets: curated?.snippets ?? [],
    suppressAfterColon: curated?.suppressAfterColon ?? false,
    title: curated?.title ?? syntax.grammarId,
    tokens: syntax.tokens,
  };
};

const generated = allSyntaxMetadata.map(merge);
const generatedIds = new Set(generated.map((diagram) => diagram.id));

// Curated diagrams whose grammar is not part of mermaid core (e.g. external plugins).
const external = curatedDiagrams
  .filter((diagram) => !generatedIds.has(diagram.id))
  .map((diagram) => ({
    ...diagram,
    detector: detectorById.get(diagram.id),
    engine: 'jison' as const,
    grammarId: diagram.id,
    tokens: EXTERNAL_TOKENS[diagram.id] ?? [],
  }));

/** Editor-ready language data for every diagram mermaid knows about. */
export const diagramLanguageData: readonly DiagramLanguageData[] = [...generated, ...external];

const byId = new Map(diagramLanguageData.map((diagram) => [diagram.id, diagram]));

/** Language data for a detector id, e.g. `flowchart`. */
export const getDiagramData = (id: string | undefined): DiagramLanguageData | undefined =>
  id === undefined ? undefined : byId.get(id);

/** All language data, or the entries matching the given detector ids. */
export const getDiagramLanguageData = (ids?: readonly string[]): DiagramLanguageData[] =>
  ids === undefined
    ? [...diagramLanguageData]
    : diagramLanguageData.filter((diagram) => ids.includes(diagram.id));
