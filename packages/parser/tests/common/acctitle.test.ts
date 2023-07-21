import { describe, expect, it } from 'vitest';

import { createPieTestServices } from '../test-utils.js';

describe('accTitle', () => {
  const { parse } = createPieTestServices();

  describe('normal', () => {
    it.each([
      `pie accTitle:`,
      `pie   accTitle  :   `,
      `pie\taccTitle\t:\t`,
      `pie

      accTitle\t:

      `,
    ])('should handle empty accTitle', (context: string) => {
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.accTitle).toBe('');
    });

    it.each([
      `pie accTitle: sample accessibility`,
      `pie   accTitle  : sample accessibility  `,
      `pie\taccTitle\t:\tsample accessibility\t`,
      `pie

      accTitle\t: sample accessibility

      `,
    ])('should handle regular accTitle', (context: string) => {
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.accTitle).toBe('sample accessibility');
    });

    it('should handle accTitle with title', () => {
      const context = `pie accTitle: sample accessibility + title test`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBeUndefined();
      expect(value.accTitle).toBe('sample accessibility + title test');
    });

    it('should handle accTitle with single line accDescr', () => {
      const context = `pie accTitle: sample description + accDescr: test`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.accDescr).toBeUndefined();
      expect(value.accTitle).toBe('sample description + accDescr: test');
    });

    it('should handle accTitle with multi line accDescr', () => {
      const context = `pie accTitle: sample description + accDescr {test}`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.accDescr).toBeUndefined();
      expect(value.accTitle).toBe('sample description + accDescr {test}');
    });
  });

  describe('duplicate', () => {
    describe('inside', () => {
      it('should handle accTitle inside accTitle', () => {
        const context = `pie accTitle: accTitle: test`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.accTitle).toBe('accTitle: test');
      });
    });

    describe('after', () => {
      it('should handle regular accTitle after empty accTitle', () => {
        const context = `pie accTitle:
        accTitle: sample accessibility`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.accTitle).toBe('sample accessibility');
      });

      it('should handle empty accTitle after regular accTitle', () => {
        const context = `pie accTitle: sample accessibility
        accTitle:`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.accTitle).toBe('');
      });

      it('should handle regular accTitle after regular accTitle', () => {
        const context = `pie accTitle: test accessibility
        accTitle: sample accessibility`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.accTitle).toBe('sample accessibility');
      });
    });
  });
});
