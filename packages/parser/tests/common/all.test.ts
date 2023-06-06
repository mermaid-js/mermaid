import { describe, expect, it } from 'vitest';

import { Mermaid } from '../../src/language/index.js';
import { createTestServices } from '../test-utils.js';

describe('all', () => {
  const { parse } = createTestServices<Mermaid>();

  describe('title', () => {
    it('title then accTitle then single line accDescr', () => {
      const context = `pie
      title sample
      accTitle: test
      accDescr: wow`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample');
      expect(value.accDescr).toBe('wow');
      expect(value.accTitle).toBe('test');
    });

    it('title then accTitle then multi line accDescr', () => {
      const context = `pie
      title sample
      accTitle: test
      accDescr {
          wow
      }`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample');
      expect(value.accDescr).toBe('wow');
      expect(value.accTitle).toBe('test');
    });

    it('title then single line accDescr then accTitle', () => {
      const context = `pie
      title sample
      accDescr: wow
      accTitle: test`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample');
      expect(value.accDescr).toBe('wow');
      expect(value.accTitle).toBe('test');
    });

    it('title then multi line accDescr then accTitle', () => {
      const context = `pie
      title sample
      accDescr {
          wow
      }
      accTitle: test`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample');
      expect(value.accDescr).toBe('wow');
      expect(value.accTitle).toBe('test');
    });
  });

  describe('accTitle', () => {
    it('accTitle then title then single line accDescr', () => {
      const context = `pie
      accTitle: test
      title sample
      accDescr: wow`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample');
      expect(value.accDescr).toBe('wow');
      expect(value.accTitle).toBe('test');
    });

    it('accTitle then title then multi line accDescr', () => {
      const context = `pie
      accTitle: test
      title sample
      accDescr {
          wow
      }`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample');
      expect(value.accDescr).toBe('wow');
      expect(value.accTitle).toBe('test');
    });

    it('accTitle then single line accDescr then title', () => {
      const context = `pie
      accTitle: test
      accDescr: wow
      title sample`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample');
      expect(value.accDescr).toBe('wow');
      expect(value.accTitle).toBe('test');
    });

    it('accTitle then multi line accDescr then title', () => {
      const context = `pie
      accTitle: test
      accDescr {
          wow
      }
      title sample`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.title).toBe('sample');
      expect(value.accDescr).toBe('wow');
      expect(value.accTitle).toBe('test');
    });
  });

  describe('accDescr', () => {
    describe('single line', () => {
      it('accDescr then accTitle then title', () => {
        const context = `pie
        accDescr: wow
        accTitle: test
        title sample`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('sample');
        expect(value.accDescr).toBe('wow');
        expect(value.accTitle).toBe('test');
      });

      it('accDescr then title then accTitle', () => {
        const context = `pie
        accTitle: test
        accDescr: wow
        title sample`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('sample');
        expect(value.accDescr).toBe('wow');
        expect(value.accTitle).toBe('test');
      });
    });

    describe('multi line', () => {
      it('accDescr then accTitle then title', () => {
        const context = `pie
        accDescr {
            wow
        }
        accTitle: test
        title sample`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('sample');
        expect(value.accDescr).toBe('wow');
        expect(value.accTitle).toBe('test');
      });

      it('accDescr then title then accTitle', () => {
        const context = `pie
        accDescr {
            wow
        }
        title sample
        accTitle: test`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.title).toBe('sample');
        expect(value.accDescr).toBe('wow');
        expect(value.accTitle).toBe('test');
      });
    });
  });
});
