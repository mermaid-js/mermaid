export type SyntaxTokenKind = 'keyword' | 'operator' | 'punctuation';

export interface SyntaxToken {
  /** The token is matched case-insensitively. */
  caseInsensitive?: boolean;
  /** Lexer states (jison) or parser rules (langium) where the token applies. */
  contexts: string[];
  kind: SyntaxTokenKind;
  /** The literal text a user types. */
  text: string;
  /** The token name from the grammar. */
  token: string;
}

export interface SyntaxSnippet {
  documentation?: string;
  /** Text inserted for the snippet (Monaco/LSP snippet syntax). */
  insertText: string;
  label: string;
}

export interface SyntaxIdentifier {
  detail?: string;
  name: string;
}

/** Raw per-grammar metadata generated from mermaid's grammars. */
export interface DiagramSyntax {
  engine: 'jison' | 'langium';
  /** Grammar id, e.g. `sequenceDiagram` or `architecture`. */
  grammarId: string;
  /** Path of the grammar this was extracted from. */
  source: string;
  tokens: SyntaxToken[];
}

export interface DiagramDeclaration extends SyntaxSnippet {
  /** Detector id of the diagram this declaration starts, e.g. `flowchart`. */
  diagramId: string;
}

/** Editor-ready language data: generated tokens plus curated snippets, docs and helpers. */
export interface DiagramLanguageData {
  /** Detects the diagram on the first meaningful line of a document. */
  detector?: RegExp;
  /** Syntax reference for the diagram. */
  docsUrl?: string;
  engine: 'jison' | 'langium';
  /** Extract the identifiers (nodes, participants, classes, ...) declared so far. */
  extractIdentifiers?: (text: string) => SyntaxIdentifier[];
  /** Id of the grammar the tokens were extracted from. */
  grammarId: string;
  /** Detector id used by editors, e.g. `flowchart`. */
  id: string;
  snippets: SyntaxSnippet[];
  /** True when everything after ':' on a line is free text (message, description, label). */
  suppressAfterColon: boolean;
  title: string;
  tokens: SyntaxToken[];
}
