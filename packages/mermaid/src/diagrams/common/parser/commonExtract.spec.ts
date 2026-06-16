import { convertString, extractAccDescr, extractAccTitle, extractTitle } from './commonExtract.js';

// Locks the shared value-conversion contract before more diagrams depend on it.
describe('commonExtract', () => {
  describe('convertString', () => {
    it('strips the outer double-quote pair', () => {
      expect(convertString('"abc"')).toBe('abc');
    });

    it('strips the outer single-quote pair', () => {
      expect(convertString("'abc'")).toBe('abc');
    });

    it('does NOT trim inner whitespace', () => {
      expect(convertString('"  spaced  "')).toBe('  spaced  ');
    });

    it('decodes backslash escapes', () => {
      expect(convertString('"a\\nb"')).toBe('a\nb');
      expect(convertString('"a\\tb"')).toBe('a\tb');
    });

    it('decodes an escaped quote and an escaped backslash', () => {
      expect(convertString('"a\\"b"')).toBe('a"b');
      expect(convertString('"a\\\\b"')).toBe('a\\b');
    });

    it('leaves prototype-pollution-looking labels intact', () => {
      expect(convertString('"__proto__"')).toBe('__proto__');
    });
  });

  describe('extractTitle', () => {
    it('extracts the text after the keyword', () => {
      expect(extractTitle('title Hello world')).toBe('Hello world');
    });

    it('collapses runs of spaces/tabs to a single space and trims', () => {
      expect(extractTitle('title   a   60/40   pie')).toBe('a 60/40 pie');
    });

    it('returns empty string for a bare keyword', () => {
      expect(extractTitle('title')).toBe('');
    });
  });

  describe('extractAccTitle', () => {
    it('extracts the value after the colon', () => {
      expect(extractAccTitle('accTitle: a neat acc title')).toBe('a neat acc title');
    });
  });

  describe('extractAccDescr', () => {
    it('handles the single-line `accDescr:` form', () => {
      expect(extractAccDescr('accDescr: a neat description')).toBe('a neat description');
    });

    it('handles the multi-line `accDescr { … }` form', () => {
      const image = 'accDescr {\n        a neat description\n        on multiple lines\n      }';
      expect(extractAccDescr(image)).toBe('a neat description\non multiple lines');
    });
  });
});
