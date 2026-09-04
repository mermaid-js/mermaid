// @ts-expect-error Incorrect khroma types
import { luminance } from 'khroma';
import { describe, it, expect } from 'vitest';
import { readableOn } from './c4Colors.js';

const ratio = (one: string, other: string): number => {
  const [brighter, darker] = [luminance(one), luminance(other)].sort(
    (a: number, b: number) => b - a
  );
  return (brighter + 0.05) / (darker + 0.05);
};

// The shipped c4 palette, which is what the defaults actually put on screen.
const PALETTE = ['#08427B', '#686868', '#1168BD', '#999999', '#438DD5', '#B3B3B3', '#85BBF0'];

describe('readableOn', () => {
  it('leaves a colour alone when it already reads on the background', () => {
    // #08427B on white is about 10:1 - nothing to fix.
    expect(readableOn('#08427B', '#ffffff')).toBe('#08427B');
  });

  it('darkens a pale colour on a light background', () => {
    const readable = readableOn('#85BBF0', '#ffffff');

    expect(readable).not.toBe('#85BBF0');
    expect(luminance(readable)).toBeLessThan(luminance('#85BBF0'));
    expect(ratio(readable, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  // The bug this exists to prevent: shifting in a fixed direction darkens the colour
  // further into a dark background, which is how the outline look became unreadable
  // in the dark theme.
  it('lightens a dark colour on a dark background', () => {
    const readable = readableOn('#08427B', '#333333');

    expect(readable).not.toBe('#08427B');
    expect(luminance(readable)).toBeGreaterThan(luminance('#08427B'));
    expect(ratio(readable, '#333333')).toBeGreaterThanOrEqual(4.5);
  });

  it('reaches a readable contrast for every palette colour on every theme surface', () => {
    // The surfaces the shipped themes actually use for `background`.
    for (const surface of ['#ffffff', '#f4f4f4', '#333333']) {
      for (const color of PALETTE) {
        expect(ratio(readableOn(color, surface), surface)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  // A mid-grey background is the case that breaks choosing the direction by whether the
  // background is "dark": `#888888` counts as dark, so lightening is the obvious choice,
  // yet lightening can never clear the target against it while darkening reaches ~4.9:1.
  it('darkens against a mid-grey background, where lightening cannot reach the target', () => {
    const readable = readableOn('#08427B', '#888888');

    expect(luminance(readable)).toBeLessThan(luminance('#08427B'));
    expect(ratio(readable, '#888888')).toBeGreaterThanOrEqual(4.5);
  });

  // The invariant that pins the whole class of bug: whatever it returns is never harder
  // to read than what it was given.
  it('never returns a colour less readable than the original', () => {
    for (const surface of ['#ffffff', '#f4f4f4', '#333333', '#6f6f6f', '#888888', '#999999']) {
      for (const color of PALETTE) {
        expect(ratio(readableOn(color, surface), surface)).toBeGreaterThanOrEqual(
          ratio(color, surface)
        );
      }
    }
  });

  it('returns a value it cannot parse untouched', () => {
    // An unusable config value reaches CSS as-is and is dropped there, rather than
    // becoming NaN and painting nothing.
    expect(readableOn('not-a-color', '#ffffff')).toBe('not-a-color');
    expect(readableOn('#08427B', 'not-a-color')).toBe('#08427B');
  });
});
