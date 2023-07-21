import { describe, expect, it } from 'vitest';

import { createPieTestServices } from '../test-utils.js';

describe('title', () => {
  const { parse } = createPieTestServices();

  describe('normal', () => {
    it.each([
      `pie title`,
      `pie   title   `,
      `pie\ttitle\t`,
      `pie

      title\t

      `,
    ])('should handle empty title', (context: string) => {
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('');
    });

    it.each([
      `pie title sample`,
      `pie   title   sample  `,
      `pie\ttitle\tsample\t`,
      `pie

      title\t sample

      `,
    ])('should handle regular title', (context: string) => {
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample');
    });

    it('should handle title with accTitle', () => {
      const context = `pie title sample + accTitle: test`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample + accTitle: test');
      expect(value.accTitle).toBeUndefined();
    });

    it('should handle title with single line accDescr', () => {
      const context = `pie title sample + accDescr: test`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample + accDescr: test');
      expect(value.accDescr).toBeUndefined();
    });

    it('should handle title with multi line accDescr', () => {
      const context = `pie title sample + accDescr {test}`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample + accDescr {test}');
      expect(value.accDescr).toBeUndefined();
    });
  });

  describe('duplicate', () => {
    describe('inside', () => {
      it('should handle non-empty title inside title', () => {
        const context = `pie title title test`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('title test');
      });

      it('should handle empty title inside title', () => {
        const context = `pie title test title`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('test title');
      });
    });

    describe('after', () => {
      it('should handle regular title after empty title', () => {
        const context = `pie title
        title sample`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('sample');
      });

      it('should handle empty title after regular title', () => {
        const context = `pie title sample
        title`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('');
      });

      it('should handle regular title after regular title', () => {
        const context = `pie title test
        title sample`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('sample');
      });
    });
  });
});
