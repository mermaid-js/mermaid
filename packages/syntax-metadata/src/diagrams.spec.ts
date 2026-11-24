import { describe, expect, it } from 'vitest';
import {
  declarations,
  detectDiagramType,
  diagramLanguageData,
  diagramPatterns,
  getDiagramData,
  getSyntaxMetadata,
} from './index.js';

describe('syntax metadata', () => {
  it('extracts tokens for jison and langium diagrams', () => {
    const metadata = getSyntaxMetadata();
    expect(metadata.length).toBeGreaterThan(0);
    expect(metadata.some((diagram) => diagram.engine === 'jison')).toBe(true);
    expect(metadata.some((diagram) => diagram.engine === 'langium')).toBe(true);
    for (const diagram of metadata.filter((entry) => entry.engine === 'jison')) {
      expect(diagram.tokens.length, diagram.grammarId).toBeGreaterThan(0);
    }
  });

  it('uses real newlines and tabs in snippets', () => {
    const insertTexts = [
      ...diagramLanguageData.flatMap((diagram) => diagram.snippets.map((spec) => spec.insertText)),
      ...declarations.map((spec) => spec.insertText),
    ];
    expect(insertTexts.length).toBeGreaterThan(0);
    for (const insertText of insertTexts) {
      expect(insertText).not.toContain(String.raw`\n`);
      expect(insertText).not.toContain(String.raw`\t`);
    }
  });

  it('starts every declaration with its label', () => {
    for (const declaration of declarations) {
      expect(declaration.insertText.startsWith(declaration.label)).toBe(true);
    }
  });
});

describe('diagramLanguageData', () => {
  it('resolves every detector to language data', () => {
    for (const { diagramId } of diagramPatterns) {
      expect(getDiagramData(diagramId), diagramId).toBeDefined();
    }
  });

  it('detects the diagram type on the first meaningful line', () => {
    expect(detectDiagramType('flowchart TD\n\tA --> B')).toBe('flowchart');
    expect(detectDiagramType('%%{init: {"theme": "dark"}}%%\nsequenceDiagram')).toBe(
      'sequenceDiagram'
    );
    expect(detectDiagramType('hello world')).toBeUndefined();
  });

  it('carries tokens, snippets and docs for editors', () => {
    const flowchart = getDiagramData('flowchart');
    expect(flowchart?.tokens.some((token) => token.text === '-->')).toBe(true);
    expect(flowchart?.snippets.some((snippet) => snippet.label === 'subgraph')).toBe(true);
    expect(flowchart?.docsUrl).toContain('mermaid.js.org/syntax/flowchart.html');
    expect(flowchart?.detector?.test('flowchart TD')).toBe(true);
  });

  it('marks a kind on every token', () => {
    for (const diagram of diagramLanguageData) {
      for (const token of diagram.tokens) {
        expect(['keyword', 'operator', 'punctuation']).toContain(token.kind);
      }
    }
  });
});
