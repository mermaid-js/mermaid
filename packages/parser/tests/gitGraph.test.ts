import { describe, expect, it } from 'vitest';
import { GitGraph } from '../src/language/index.js';
import { gitGraphParse as parse } from './test-util.js';

describe('gitGraph', () => {
  describe('Basic Parsing', () => {
    it('should handle empty gitGraph', () => {
      const result = parse(`gitGraph`);
      expect(result.value.$type).toBe(GitGraph);
      expect(result.value.statements).toHaveLength(0);
    });

    it('should handle gitGraph with one statement', () => {
      const result = parse(`gitGraph\n  A`);
      expect(result.value.$type).toBe(GitGraph);
    });
  });
});
