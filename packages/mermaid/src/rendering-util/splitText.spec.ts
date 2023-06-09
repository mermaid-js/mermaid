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
  it.each([
    // empty string
    { str: '', width: 1, split: [''] },
    // Width >= Individual words
    { str: 'hello world', width: 5, split: ['hello', 'world'] },
    { str: 'hello world', width: 7, split: ['hello', 'world'] },
    // width > full line
    { str: 'hello world', width: 20, split: ['hello world'] },
    // width < individual word
    { str: 'hello world', width: 3, split: ['hel', 'lo', 'wor', 'ld'] },
    { str: 'hello 12 world', width: 4, split: ['hell', 'o 12', 'worl', 'd'] },
    { str: '🏳️‍⚧️🏳️‍🌈👩🏾‍❤️‍👨🏻', width: 1, split: ['🏳️‍⚧️', '🏳️‍🌈', '👩🏾‍❤️‍👨🏻'] },
    { str: 'Flag 🏳️‍⚧️ this 🏳️‍🌈', width: 6, split: ['Flag 🏳️‍⚧️', 'this 🏳️‍🌈'] },
  ])(
    'should split $str into lines of $width characters',
    ({ str, split, width }: { str: string; width: number; split: string[] }) => {
      const checkFn: CheckFitFunction = (text: string) => {
        return splitTextToChars(text).length <= width;
      };
      expect(splitLineToFitWidth(str, checkFn)).toEqual(split);
    }
  );
});
