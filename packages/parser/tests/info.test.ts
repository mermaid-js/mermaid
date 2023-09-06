import type { LangiumParser, ParseResult } from 'langium';
import { describe, expect, it } from 'vitest';

import type { InfoServices } from '../src/language/index.js';
import { Info, createInfoServices } from '../src/language/index.js';
import { noErrorsOrAlternatives } from './test-util.js';

const services: InfoServices = createInfoServices().Info;
const parser: LangiumParser = services.parser.LangiumParser;
function createInfoTestServices(): {
  services: InfoServices;
  parse: (input: string) => ParseResult<Info>;
} {
  const parse = (input: string) => {
    return parser.parse<Info>(input);
  };

  return { services, parse };
}

describe('info', () => {
  const { parse } = createInfoTestServices();

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
    noErrorsOrAlternatives(result);

    expect(result.value.$type).toBe(Info);
  });

  it.each([
    `info showInfo`,
    `
    info showInfo`,
    `info
    showInfo
    `,
    `
    info
    showInfo
    `,
  ])('should handle showInfo', (context: string) => {
    const result = parse(context);
    noErrorsOrAlternatives(result);

    expect(result.value.$type).toBe(Info);
  });
});
