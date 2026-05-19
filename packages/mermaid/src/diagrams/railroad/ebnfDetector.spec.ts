import { describe, it, expect } from 'vitest';
import { railroadEbnf } from './ebnfDetector.js';

describe('EBNF Detector', () => {
  it('should have correct id', () => {
    expect(railroadEbnf.id).toBe('railroadEbnf');
  });

  it('should detect railroad-ebnf keyword', () => {
    expect(railroadEbnf.detector('railroad-ebnf\nrule = "test" ;')).toBe(true);
  });

  it('should detect with leading whitespace', () => {
    expect(railroadEbnf.detector('  railroad-ebnf\nrule = "test" ;')).toBe(true);
  });

  it('should detect case-insensitively', () => {
    expect(railroadEbnf.detector('RAILROAD-EBNF\nrule = "test" ;')).toBe(true);
  });

  it('should not detect other diagram types', () => {
    expect(railroadEbnf.detector('railroad-diagram\nrule = terminal("a") ;')).toBe(false);
    expect(railroadEbnf.detector('flowchart TD\nA --> B')).toBe(false);
  });

  it('should load the diagram', async () => {
    const result = await railroadEbnf.loader();
    expect(result.id).toBe('railroadEbnf');
    expect(result.diagram).toBeDefined();
    expect(result.diagram.parser).toBeDefined();
    expect(result.diagram.db).toBeDefined();
    expect(result.diagram.renderer).toBeDefined();
  });
});
