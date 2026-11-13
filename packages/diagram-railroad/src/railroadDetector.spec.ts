import { describe, it, expect } from 'vitest';
import { railroad } from './railroadDetector.js';

describe('Railroad Detector', () => {
  it('should have correct id', () => {
    expect(railroad.id).toBe('railroad');
  });

  describe('detector', () => {
    it('should detect railroad-beta keyword', () => {
      const text = 'railroad-beta\nrule = "test" ;';
      expect(railroad.detector(text)).toBe(true);
    });

    it('should detect railroad-beta with leading whitespace', () => {
      const text = '  railroad-beta\nrule = "test" ;';
      expect(railroad.detector(text)).toBe(true);
    });

    it('should detect railroad-beta case-insensitively', () => {
      const text = 'RAILROAD-BETA\nrule = "test" ;';
      expect(railroad.detector(text)).toBe(true);
    });

    it('should detect Railroad-Beta mixed case', () => {
      const text = 'Railroad-Beta\nrule = "test" ;';
      expect(railroad.detector(text)).toBe(true);
    });

    it('should not detect non-railroad diagrams', () => {
      const text = 'flowchart TD\nA --> B';
      expect(railroad.detector(text)).toBe(false);
    });

    it('should not detect railroad-beta in middle of text', () => {
      const text = 'some text railroad-beta\nrule = "test" ;';
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

    it('should detect railroad-beta with newlines before it', () => {
      const text = '\n\nrailroad-beta\nrule = "test" ;';
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
