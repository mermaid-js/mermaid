import { describe, expect, it } from 'vitest';
import type { LangiumParser, ParseResult } from 'langium';

import type { InfoServices } from '../src/language/index.js';
import { Info, createInfoServices } from '../src/language/index.js';

const services: InfoServices = createInfoServices().Info;
const parser: LangiumParser = services.parser.LangiumParser;
export function createInfoTestServices(): {
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
    const { parserErrors, lexerErrors, value } = parse(context);
    expect(parserErrors).toHaveLength(0);
    expect(lexerErrors).toHaveLength(0);

    expect(value.$type).toBe(Info);
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
    const { parserErrors, lexerErrors, value } = parse(context);
    expect(parserErrors).toHaveLength(0);
    expect(lexerErrors).toHaveLength(0);

    expect(value.$type).toBe(Info);
  });
});
