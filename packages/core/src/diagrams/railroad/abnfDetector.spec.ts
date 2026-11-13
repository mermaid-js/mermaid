import { describe, it, expect } from 'vitest';
import { railroadAbnf } from './abnfDetector.js';

describe('ABNF Detector', () => {
  it('should have correct id', () => {
    expect(railroadAbnf.id).toBe('railroadAbnf');
  });

  it('should detect railroad-abnf-beta keyword', () => {
    expect(railroadAbnf.detector('railroad-abnf-beta\nrule = "test" ;')).toBe(true);
  });

  it('should detect with leading whitespace', () => {
    expect(railroadAbnf.detector('  railroad-abnf-beta\nrule = "test" ;')).toBe(true);
  });

  it('should detect case-insensitively', () => {
    expect(railroadAbnf.detector('RAILROAD-ABNF-BETA\nrule = "test" ;')).toBe(true);
  });

  it('should not detect other diagram types', () => {
    expect(railroadAbnf.detector('railroad-beta\nrule = terminal("a") ;')).toBe(false);
    expect(railroadAbnf.detector('flowchart TD\nA --> B')).toBe(false);
  });

  it('should load the diagram', async () => {
    const result = await railroadAbnf.loader();
    expect(result.id).toBe('railroadAbnf');
    expect(result.diagram).toBeDefined();
    expect(result.diagram.parser).toBeDefined();
    expect(result.diagram.db).toBeDefined();
    expect(result.diagram.renderer).toBeDefined();
  });
});
