import { describe, expect, it } from 'vitest';

import { Mermaid } from '../../src/language/index.js';
import { createTestServices } from '../test-utils.js';

describe('comments', () => {
  const { parse } = createTestServices<Mermaid>();

  describe('single line', () => {
    it('should handle empty comment', async () => {
      const string_ = `pie %%`;
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);
    });

    it('should handle regular comment', async () => {
      const string_ = `pie %% comment`;
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);
    });
  });

  describe('multi line', () => {
    it('should handle empty comment', async () => {
      const string_ = `pie %%**%%`;
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);
    });

    it('should handle regular comment', async () => {
      const string_ = `pie %%*
      multi line comment
      *%%`;
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);
    });
  });
});
