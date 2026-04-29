import { describe, it, expect } from 'vitest';
import { railroadPeg } from './pegDetector.js';

describe('PEG Detector', () => {
  it('should have correct id', () => {
    expect(railroadPeg.id).toBe('railroadPeg');
  });

  it('should detect railroad-peg keyword', () => {
    expect(railroadPeg.detector('railroad-peg\nrule <- "test" ;')).toBe(true);
  });

  it('should detect with leading whitespace', () => {
    expect(railroadPeg.detector('  railroad-peg\nrule <- "test" ;')).toBe(true);
  });

  it('should detect case-insensitively', () => {
    expect(railroadPeg.detector('RAILROAD-PEG\nrule <- "test" ;')).toBe(true);
  });

  it('should not detect other diagram types', () => {
    expect(railroadPeg.detector('railroad-diagram\nrule = terminal("a") ;')).toBe(false);
    expect(railroadPeg.detector('flowchart TD\nA --> B')).toBe(false);
  });

  it('should load the diagram', async () => {
    const result = await railroadPeg.loader();
    expect(result.id).toBe('railroadPeg');
    expect(result.diagram).toBeDefined();
    expect(result.diagram.parser).toBeDefined();
    expect(result.diagram.db).toBeDefined();
    expect(result.diagram.renderer).toBeDefined();
  });
});
