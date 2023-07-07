import { splitTextToChars, splitLineToFitWidth, splitLineToWords } from './splitText.js';
import { describe, it, expect, vi } from 'vitest';
import type { CheckFitFunction, MarkdownLine, MarkdownWordType } from './types.js';

describe('when Intl.Segmenter is available', () => {
  describe('splitText', () => {
    it.each([
      { str: '', split: [] },
      { str: '🏳️‍⚧️🏳️‍🌈👩🏾‍❤️‍👨🏻', split: ['🏳️‍⚧️', '🏳️‍🌈', '👩🏾‍❤️‍👨🏻'] },
      { str: 'ok', split: ['o', 'k'] },
      { str: 'abc', split: ['a', 'b', 'c'] },
    ])('should split $str into graphemes', ({ str, split }: { str: string; split: string[] }) => {
      expect(splitTextToChars(str)).toEqual(split);
    });
  });

  describe('split lines', () => {
    it('should create valid checkFit function', () => {
      const checkFit5 = createCheckFn(5);
      expect(checkFit5([{ content: 'hello', type: 'normal' }])).toBe(true);
      expect(
        checkFit5([
          { content: 'hello', type: 'normal' },
          { content: 'world', type: 'normal' },
        ])
      ).toBe(false);
      const checkFit1 = createCheckFn(1);
      expect(checkFit1([{ content: 'A', type: 'normal' }])).toBe(true);
      expect(checkFit1([{ content: '🏳️‍⚧️', type: 'normal' }])).toBe(true);
      expect(checkFit1([{ content: '🏳️‍⚧️🏳️‍⚧️', type: 'normal' }])).toBe(false);
    });

    it.each([
      // empty string
      { str: 'hello world', width: 7, split: ['hello', 'world'] },
      // width > full line
      { str: 'hello world', width: 20, split: ['hello world'] },
      // width < individual word
      { str: 'hello world', width: 3, split: ['hel', 'lo', 'wor', 'ld'] },
      { str: 'hello 12 world', width: 4, split: ['hell', 'o 12', 'worl', 'd'] },
      { str: 'hello  1 2 world', width: 4, split: ['hell', 'o  1', '2', 'worl', 'd'] },
      { str: 'hello  1 2 world', width: 6, split: ['hello', '  1 2', 'world'] },
      // width = 0, impossible, so split into individual characters
      { str: '🏳️‍⚧️🏳️‍🌈👩🏾‍❤️‍👨🏻', width: 0, split: ['🏳️‍⚧️', '🏳️‍🌈', '👩🏾‍❤️‍👨🏻'] },
      { str: '🏳️‍⚧️🏳️‍🌈👩🏾‍❤️‍👨🏻', width: 1, split: ['🏳️‍⚧️', '🏳️‍🌈', '👩🏾‍❤️‍👨🏻'] },
      { str: '🏳️‍⚧️🏳️‍🌈👩🏾‍❤️‍👨🏻', width: 2, split: ['🏳️‍⚧️🏳️‍🌈', '👩🏾‍❤️‍👨🏻'] },
      { str: '🏳️‍⚧️🏳️‍🌈👩🏾‍❤️‍👨🏻', width: 3, split: ['🏳️‍⚧️🏳️‍🌈👩🏾‍❤️‍👨🏻'] },
      { str: '中文中', width: 1, split: ['中', '文', '中'] },
      { str: '中文中', width: 2, split: ['中文', '中'] },
      { str: '中文中', width: 3, split: ['中文中'] },
      { str: 'Flag 🏳️‍⚧️ this 🏳️‍🌈', width: 6, split: ['Flag 🏳️‍⚧️', 'this 🏳️‍🌈'] },
    ])(
      'should split $str into lines of $width characters',
      ({ str, split, width }: { str: string; width: number; split: string[] }) => {
        const checkFn = createCheckFn(width);
        const line: MarkdownLine = getLineFromString(str);
        expect(splitLineToFitWidth(line, checkFn)).toEqual(
          split.map((str) => getLineFromString(str))
        );
      }
    );
  });
});

describe('when Intl.segmenter is not available', () => {
  beforeAll(() => {
    vi.stubGlobal('Intl', { Segmenter: undefined });
  });
  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    { str: '', split: [] },
    {
      str: '🏳️‍⚧️🏳️‍🌈👩🏾‍❤️‍👨🏻',
      split: [...'🏳️‍⚧️🏳️‍🌈👩🏾‍❤️‍👨🏻'],
    },
    { str: 'ok', split: ['o', 'k'] },
    { str: 'abc', split: ['a', 'b', 'c'] },
  ])('should split $str into characters', ({ str, split }: { str: string; split: string[] }) => {
    expect(splitTextToChars(str)).toEqual(split);
  });

  it.each([
    // empty string
    { str: 'hello world', width: 7, split: ['hello', 'world'] },
    // width > full line
    { str: 'hello world', width: 20, split: ['hello world'] },
    // width < individual word
    { str: 'hello world', width: 3, split: ['hel', 'lo', 'wor', 'ld'] },
    { str: 'hello 12 world', width: 4, split: ['hell', 'o 12', 'worl', 'd'] },
    { str: 'hello  1 2 world', width: 4, split: ['hell', 'o  1', '2', 'worl', 'd'] },
    { str: 'hello  1 2 world', width: 6, split: ['hello', ' 1 2', 'world'] },
    // width = 0, impossible, so split into individual characters
    { str: 'abc', width: 0, split: ['a', 'b', 'c'] },
    { str: '🏳️‍⚧️🏳️‍🌈👩🏾‍❤️‍👨🏻', width: 1, split: [...'🏳️‍⚧️🏳️‍🌈👩🏾‍❤️‍👨🏻'] },
    { str: '中文中', width: 1, split: ['中', '文', '中'] },
    { str: '中文中', width: 2, split: ['中文', '中'] },
    { str: '中文中', width: 3, split: ['中文中'] },
  ])(
    'should split $str into lines of $width characters',
    ({ str, split, width }: { str: string; width: number; split: string[] }) => {
      const checkFn = createCheckFn(width);
      const line: MarkdownLine = getLineFromString(str);
      expect(splitLineToFitWidth(line, checkFn)).toEqual(
        split.map((str) => getLineFromString(str))
      );
    }
  );
});

it('should handle strings with newlines', () => {
  const checkFn: CheckFitFunction = createCheckFn(6);
  const str = `Flag
  🏳️‍⚧️ this 🏳️‍🌈`;
  expect(() =>
    splitLineToFitWidth(getLineFromString(str), checkFn)
  ).toThrowErrorMatchingInlineSnapshot(
    '"splitLineToFitWidth does not support newlines in the line"'
  );
});

const getLineFromString = (str: string, type: MarkdownWordType = 'normal'): MarkdownLine => {
  return splitLineToWords(str).map((content) => ({
    content,
    type,
  }));
};

/**
 * Creates a checkFunction for a given width
 * @param width - width of characters to fit in a line
 * @returns checkFunction
 */
const createCheckFn = (width: number): CheckFitFunction => {
  return (text: MarkdownLine) => {
    // Join all words into a single string
    const joinedContent = text.map((w) => w.content).join('');
    const characters = splitTextToChars(joinedContent);
    return characters.length <= width;
  };
};
