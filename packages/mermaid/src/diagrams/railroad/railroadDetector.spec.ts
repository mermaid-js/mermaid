import { describe, it, expect } from 'vitest';
import { railroad } from './railroadDetector.js';

describe('Railroad Detector', () => {
  it('should have correct id', () => {
    expect(railroad.id).toBe('railroad');
  });

  describe('detector', () => {
    it('should detect railroad-diagram keyword', () => {
      const text = 'railroad-diagram\nrule = "test" ;';
      expect(railroad.detector(text)).toBe(true);
    });

    it('should detect railroad-diagram with leading whitespace', () => {
      const text = '  railroad-diagram\nrule = "test" ;';
      expect(railroad.detector(text)).toBe(true);
    });

    it('should detect railroad-diagram case-insensitively', () => {
      const text = 'RAILROAD-DIAGRAM\nrule = "test" ;';
      expect(railroad.detector(text)).toBe(true);
    });

    it('should detect Railroad-Diagram mixed case', () => {
      const text = 'Railroad-Diagram\nrule = "test" ;';
      expect(railroad.detector(text)).toBe(true);
    });

    it('should not detect non-railroad diagrams', () => {
      const text = 'flowchart TD\nA --> B';
      expect(railroad.detector(text)).toBe(false);
    });

    it('should not detect railroad-diagram in middle of text', () => {
      const text = 'some text railroad-diagram\nrule = "test" ;';
      expect(railroad.detector(text)).toBe(false);
    });

    it('should handle empty string', () => {
      const text = '';
      expect(railroad.detector(text)).toBe(false);
    });

    it('should handle whitespace only', () => {
      const text = '   \n  \t  ';
      expect(railroad.detector(text)).toBe(false);
    });

    it('should detect railroad-diagram with newlines before it', () => {
      const text = '\n\nrailroad-diagram\nrule = "test" ;';
      expect(railroad.detector(text)).toBe(true);
    });
  });

  describe('loader', () => {
    it('should load the diagram', async () => {
      const result = await railroad.loader();
      expect(result.id).toBe('railroad');
      expect(result.diagram).toBeDefined();
    });

    it('should return diagram with parser', async () => {
      const result = await railroad.loader();
      expect(result.diagram.parser).toBeDefined();
    });

    it('should return diagram with db', async () => {
      const result = await railroad.loader();
      expect(result.diagram.db).toBeDefined();
    });

    it('should return diagram with renderer', async () => {
      const result = await railroad.loader();
      expect(result.diagram.renderer).toBeDefined();
    });
  });
});
