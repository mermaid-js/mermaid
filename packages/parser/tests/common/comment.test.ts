import { describe, expect, it } from 'vitest';

import { Mermaid } from '../../src/language/index.js';
import { createTestServices } from '../test-utils.js';

describe('comments', () => {
  const { parse } = createTestServices<Mermaid>();

  describe('pie', () => {
    describe('single line', () => {
      it('should handle empty comment', () => {
        const context = `pie %%`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });

      it('should handle regular comment', () => {
        const context = `pie %% comment`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });
    });

    describe('multi line', () => {
      it('should handle empty comment', () => {
        const context = `pie %%**%%`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });

      it('should handle regular comment', () => {
        const context = `pie %%*
        multi line comment
        *%%`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });
    });
  });

  describe('timeline', () => {
    describe('single line', () => {
      it('should handle empty comment', () => {
        const context = `timeline %%`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });

      it('should handle regular comment', () => {
        const context = `timeline %% comment`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });
    });

    describe('multi line', () => {
      it('should handle empty comment', () => {
        const context = `timeline %%**%%`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });

      it('should handle regular comment', () => {
        const context = `timeline %%*
        multi line comment
        *%%`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });
    });
  });
});
