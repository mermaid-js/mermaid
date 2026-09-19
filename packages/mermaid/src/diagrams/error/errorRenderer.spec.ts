import { describe, expect, it } from 'vitest';
import type { Diagram } from '../../Diagram.js';
import { jsdomIt } from '../../tests/util.js';
import { draw, wrapErrorMessage } from './errorRenderer.js';

const errorTexts = (): string[] =>
  Array.from(document.querySelectorAll('.error-text')).map((element) => element.textContent ?? '');

describe('wrapErrorMessage', () => {
  it('returns no lines for an empty message', () => {
    expect(wrapErrorMessage('')).toEqual([]);
    expect(wrapErrorMessage('   ')).toEqual([]);
  });

  it('keeps a short message on a single line', () => {
    const message = 'Edge limit exceeded. 501 edges found, but the limit is 500.';
    expect(wrapErrorMessage(message)).toEqual([message]);
  });

  it('normalizes whitespace and wraps at word boundaries', () => {
    const message = `a${' '.repeat(40)}${'b'.repeat(40)} c${'d'.repeat(39)}`;
    expect(wrapErrorMessage(message)).toEqual([`a ${'b'.repeat(40)}`, `c${'d'.repeat(39)}`]);
  });

  it('hard-wraps words that are longer than a line', () => {
    expect(wrapErrorMessage('x'.repeat(160))).toEqual([
      'x'.repeat(75),
      'x'.repeat(75),
      'x'.repeat(10),
    ]);
  });

  it('caps the message at four lines with an ellipsis', () => {
    const word = 'w'.repeat(70);
    const message = [word, word, word, word, word, word].join(' ');
    const lines = wrapErrorMessage(message);
    expect(lines).toHaveLength(4);
    expect(lines[3]).toBe(`${word}...`);
  });
});

describe('errorRenderer', () => {
  jsdomIt('draws the plain error graphic when there is no message', ({ svg }) => {
    draw('', 'svg', '11.12.0');

    expect(svg.node()?.getAttribute('viewBox')).toBe('0 0 2412 512');
    expect(errorTexts()).toEqual(['Syntax error in text', 'mermaid version 11.12.0']);
  });

  jsdomIt('draws the error message below the headline', ({ svg }) => {
    const message = 'Edge limit exceeded. 501 edges found, but the limit is 500.';
    const diag = { db: { getErrorMessage: () => message } };
    draw('', 'svg', '11.12.0', diag as unknown as Diagram);

    expect(svg.node()?.getAttribute('viewBox')).toBe('0 0 2412 556');
    const texts = errorTexts();
    expect(texts[0]).toBe('Syntax error in text');
    expect(texts[1]).toBe('mermaid version 11.12.0');
    expect(texts[2]).toBe(message);
  });

  jsdomIt('draws each wrapped line separately', ({ svg }) => {
    const message = ['one', 'two', 'three', 'four', 'five'].join(' ');
    const diag = { db: { getErrorMessage: () => `${'m'.repeat(75)} ${message}` } };
    draw('', 'svg', '11.12.0', diag as unknown as Diagram);

    const texts = errorTexts();
    expect(texts.slice(2)).toEqual(['m'.repeat(75), 'one two three four five']);
    expect(svg.node()?.getAttribute('viewBox')).toBe('0 0 2412 612');
  });
});
