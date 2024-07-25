import { describe, expect, it } from 'vitest';
import { GitGraph } from '../src/language/index.js';
import { gitGraphParse as parse } from './test-util.js';

describe('gitGraph', () => {
  describe('Basic Parsing', () => {
    it('should handle empty gitGraph', () => {
      const result = parse(`gitGraph`);
      expect(result.value.$type).toBe(GitGraph);
      expect(result.value.statements).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);
      expect(result.parserErrors).toHaveLength(0);
    });

    it('should handle gitGraph with one statement', () => {
      const result = parse(`gitGraph\n  commit\n`);
      expect(result.value.$type).toBe(GitGraph);
      expect(result.lexerErrors).toHaveLength(0);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.value.statements).toHaveLength(1);
    });

    it('should handle gitGraph with multiple statements and use accTitle', () => {
      const result = parse(`gitGraph\n  commit\n  commit\n accTitle: title\n  commit\n`);
      expect(result.value.$type).toBe(GitGraph);
      expect(result.lexerErrors).toHaveLength(0);
      expect(result.parserErrors).toHaveLength(0);
    });
  });
});
