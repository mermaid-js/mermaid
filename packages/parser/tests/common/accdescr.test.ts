import { describe, expect, it } from 'vitest';

import { Mermaid } from '../../src/language/index.js';
import { createTestServices } from '../test-utils.js';

describe('accDescr', () => {
  const { parse } = createTestServices<Mermaid>();

  describe('single line', () => {
    it.each([
      `pie accDescr:`,
      `pie   accDescr  :   `,
      `pie\taccDescr\t:\t`,
      `pie

      accDescr\t:

      `,
    ])('should handle empty accDescr', async (string_: string) => {
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.accDescr).toBeUndefined();
    });

    it.each([
      `pie accDescr:sample single line description`,
      `pie   accDescr  :  sample single line description  `,
      `pie\taccDescr\t:\tsample single line description\t`,
      `pie

      accDescr\t: sample single line description

      `,
    ])('should handle regular accDescr', async (string_: string) => {
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.accDescr).toBe('sample single line description');
    });

    it('should handle accDescr with title', async () => {
      const string_ = `pie accDescr: sample description + title test`;
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBeUndefined();
      expect(value.accDescr).toBe('sample description + title test');
    });

    it('should handle accDescr with accTitle', async () => {
      const string_ = `pie accDescr: sample description + accTitle: test`;
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.accDescr).toBe('sample description + accTitle: test');
      expect(value.accTitle).toBeUndefined();
    });
  });

  describe('multi line', () => {
    it.each([
      `pie accDescr{}`,
      `pie   accDescr  {    }   `,
      `pie\taccDescr\t{\t}\t`,
      `pie

      accDescr

      {

      }

      `,
    ])('should handle empty accDescr', async (string_: string) => {
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.accDescr).toBeUndefined();
    });

    it.each([
      `pie accDescr{sample multi line description
      newline}`,
      `pie accDescr {
      sample multi line description
      newline
      }`,
      `pie\taccDescr\t{\tsample multi line description
      newline\t}\t`,
      `pie

      accDescr

      {

      \tsample multi line description
      newline

      }

      `,
    ])('should handle regular accDescr', async (string_: string) => {
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.accDescr).toBe('sample multi line description\nnewline');
    });

    it('should handle regular accDescr with title', async () => {
      const string_ = `pie accDescr {
          sample description +
          title test
      }`;
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBeUndefined();
      expect(value.accDescr).toBe('sample description +\ntitle test');
    });

    it('should handle regular accDescr with accTitle', async () => {
      const string_ = `pie accDescr {
          sample description +
          accTitle: test
      }`;
      const { parseResult: result } = await parse(string_);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.accDescr).toBe('sample description +\naccTitle: test');
      expect(value.accTitle).toBeUndefined();
    });
  });

  describe('duplicate', () => {
    describe('inside', () => {
      it('should handle single line inside single line accDescr', async () => {
        const string_ = `pie accDescr: accDescr: test`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.accDescr).toBe('accDescr: test');
      });

      it('should handle multi line inside single line accDescr', async () => {
        const string_ = `pie accDescr: accDescr {test}`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.accDescr).toBe('accDescr {test}');
      });

      it('should handle single line inside multi line accDescr', async () => {
        const string_ = `pie accDescr {
            accDescr: test
        }`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.accDescr).toBe('accDescr: test');
      });
    });

    describe('after', () => {
      it('should handle single line after single line accDescr', async () => {
        const string_ = `pie accDescr: sample accessibility
        accDescr: test accessibility`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.accDescr).toBe('test accessibility');
      });

      it('should handle single line after multi line accDescr', async () => {
        const string_ = `pie accDescr {
            sample accessibility
        }
        accDescr:`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.accDescr).toBeUndefined();
      });

      it('should handle multi line after single line accDescr', async () => {
        const string_ = `pie accDescr: sample accessibility
        accDescr {}`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.accDescr).toBeUndefined();
      });

      it('should handle multi line after multi line accDescr', async () => {
        const string_ = `pie accDescr {
            sample accessibility
        }
        accDescr {

        }`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.accDescr).toBeUndefined();
      });
    });
  });
});
