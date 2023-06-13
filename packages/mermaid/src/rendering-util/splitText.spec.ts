import { splitTextToChars, splitLineToFitWidth, type CheckFitFunction } from './splitText.js';
import { describe, it, expect } from 'vitest';

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
  const createCheckFn = (width: number): CheckFitFunction => {
    return (text: string) => {
      return splitTextToChars(text).length <= width;
    };
  };

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
      expect(splitLineToFitWidth(str, checkFn)).toEqual(split);
    }
  );

  it('should handle strings with newlines', () => {
    const checkFn: CheckFitFunction = createCheckFn(6);
    const str = `Flag
  🏳️‍⚧️ this 🏳️‍🌈`;
    expect(() => splitLineToFitWidth(str, checkFn)).toThrowErrorMatchingInlineSnapshot(
      '"splitLineToFitWidth does not support newlines in the line"'
    );
  });
});
