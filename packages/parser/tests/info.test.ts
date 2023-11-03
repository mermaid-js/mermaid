import { describe, expect, it } from 'vitest';

import { Info } from '../src/language/index.js';
import { expectNoErrorsOrAlternatives, infoParse as parse } from './test-util.js';

describe('info', () => {
  it.each([
    `info`,
    `
    info`,
    `info
    `,
    `
    info
    `,
  ])('should handle empty info', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Info);
  });

  it.each([
    `info showInfo`,
    `info showInfo
    `,
    `
    info showInfo`,
    `info
    showInfo`,
    `info
    showInfo
    `,
    `
    info
    showInfo
    `,
    `
    info
    showInfo`,
    `
    info showInfo
    `,
  ])('should handle showInfo', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Info);
  });
});
