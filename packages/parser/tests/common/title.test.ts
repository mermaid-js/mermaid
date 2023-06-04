import { describe, expect, it } from 'vitest';

import { Mermaid } from '../../src/language/index.js';
import { createTestServices } from '../test-utils.js';

describe('title', () => {
  const { parse } = createTestServices<Mermaid>();

  describe('normal', () => {
    it.each([
      `pie title`,
      `pie   title   `,
      `pie\ttitle\t`,
      `pie

      title\t

      `,
    ])('should handle empty title', async (string_: string) => {
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBeUndefined();
    });

    it.each([
      `pie title sample`,
      `pie   title   sample  `,
      `pie\ttitle\tsample\t`,
      `pie

      title\t sample

      `,
    ])('should handle regular title', async (string_: string) => {
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample');
    });

    it('should handle title with accTitle', async () => {
      const string_ = `pie title sample + accTitle: test`;
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample + accTitle: test');
      expect(value.accTitle).toBeUndefined();
    });

    it('should handle title with single line accDescr', async () => {
      const string_ = `pie title sample + accDescr: test`;
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample + accDescr: test');
      expect(value.accDescr).toBeUndefined();
    });

    it('should handle title with multi line accDescr', async () => {
      const string_ = `pie title sample + accDescr {test}`;
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample + accDescr {test}');
      expect(value.accDescr).toBeUndefined();
    });
  });

  describe('duplicate', () => {
    describe('inside', () => {
      it('should handle non-empty title inside title', async () => {
        const string_ = `pie title title test`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('title test');
      });

      it('should handle empty title inside title', async () => {
        const string_ = `pie title test title`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('test title');
      });
    });

    describe('after', () => {
      it('should handle regular title after empty title', async () => {
        const string_ = `pie title
        title sample`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('sample');
      });

      it('should handle empty title after regular title', async () => {
        const string_ = `pie title sample
        title`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBeUndefined();
      });

      it('should handle regular title after regular title', async () => {
        const string_ = `pie title test
        title sample`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('sample');
      });
    });
  });
});
