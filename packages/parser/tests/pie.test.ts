import type { LangiumParser, ParseResult } from 'langium';
import { describe, expect, it } from 'vitest';

import type { PieServices } from '../src/language/index.js';
import { Pie, createPieServices } from '../src/language/index.js';

const services: PieServices = createPieServices().Pie;
const parser: LangiumParser = services.parser.LangiumParser;
export function createPieTestServices(): {
  services: PieServices;
  parse: (input: string) => ParseResult<Pie>;
} {
  const parse = (input: string) => {
    return parser.parse<Pie>(input);
  };

  return { services, parse };
}

describe('pie', () => {
  const { parse } = createPieTestServices();

  it.each([
    `pie`,
    `  pie  `,
    `\tpie\t`,
    `
    \tpie
    `,
  ])('should handle regular pie', (context: string) => {
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Pie);
  });

  it.each([
    `pie showData`,
    `  pie  showData  `,
    `\tpie\tshowData\t`,
    `
    pie\tshowData
    `,
  ])('should handle regular showData', (context: string) => {
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Pie);
    expect(value.showData).toBeTruthy();
  });

  it.each([
    `pie title sample title`,
    `  pie  title sample title  `,
    `\tpie\ttitle sample title\t`,
    `pie
    \ttitle sample title
    `,
  ])('should handle regular pie + title in same line', (context: string) => {
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Pie);
    expect(value.title).toBe('sample title');
  });

  it.each([
    `pie
    title sample title`,
    `pie
    title sample title
    `,
    `pie
    title sample title`,
    `pie
    title sample title
    `,
  ])('should handle regular pie + title in different line', (context: string) => {
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Pie);
    expect(value.title).toBe('sample title');
  });

  it.each([
    `pie showData title sample title`,
    `pie showData title sample title
    `,
  ])('should handle regular pie + showData + title', (context: string) => {
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Pie);
    expect(value.showData).toBeTruthy();
    expect(value.title).toBe('sample title');
  });

  it.each([
    `pie showData
    title sample title`,
    `pie showData
    title sample title
    `,
    `pie showData
    title sample title`,
    `pie showData
    title sample title
    `,
  ])('should handle regular showData + title in different line', (context: string) => {
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Pie);
    expect(value.showData).toBeTruthy();
    expect(value.title).toBe('sample title');
  });

  describe('sections', () => {
    describe('normal', () => {
      it.each([
        `pie
        "GitHub":100
        "GitLab":50`,
        `pie
        "GitHub"   :   100
        "GitLab"   :   50`,
        `pie
        "GitHub"\t:\t100
        "GitLab"\t:\t50`,
        `pie
        \t"GitHub" \t : \t 100
        \t"GitLab" \t : \t  50
        `,
      ])('should handle regular secions', (context: string) => {
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(Pie);

        const section0 = value.sections[0];
        expect(section0?.label).toBe('GitHub');
        expect(section0?.value).toBe(100);

        const section1 = value.sections[1];
        expect(section1?.label).toBe('GitLab');
        expect(section1?.value).toBe(50);
      });

      it('should handle sections with showData', () => {
        const context = `pie showData
        "GitHub": 100
        "GitLab": 50`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(Pie);
        expect(value.showData).toBeTruthy();

        const section0 = value.sections[0];
        expect(section0?.label).toBe('GitHub');
        expect(section0?.value).toBe(100);

        const section1 = value.sections[1];
        expect(section1?.label).toBe('GitLab');
        expect(section1?.value).toBe(50);
      });

      it('should handle sections with title', () => {
        const context = `pie title sample wow
        "GitHub": 100
        "GitLab": 50`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(Pie);
        expect(value.title).toBe('sample wow');

        const section0 = value.sections[0];
        expect(section0?.label).toBe('GitHub');
        expect(section0?.value).toBe(100);

        const section1 = value.sections[1];
        expect(section1?.label).toBe('GitLab');
        expect(section1?.value).toBe(50);
      });

      it('should handle sections with accTitle', () => {
        const context = `pie accTitle: sample wow
        "GitHub": 100
        "GitLab": 50`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(Pie);
        expect(value.accTitle).toBe('sample wow');

        const section0 = value.sections[0];
        expect(section0?.label).toBe('GitHub');
        expect(section0?.value).toBe(100);

        const section1 = value.sections[1];
        expect(section1?.label).toBe('GitLab');
        expect(section1?.value).toBe(50);
      });

      it('should handle sections with single line accDescr', () => {
        const context = `pie accDescr: sample wow
        "GitHub": 100
        "GitLab": 50`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(Pie);
        expect(value.accDescr).toBe('sample wow');

        const section0 = value.sections[0];
        expect(section0?.label).toBe('GitHub');
        expect(section0?.value).toBe(100);

        const section1 = value.sections[1];
        expect(section1?.label).toBe('GitLab');
        expect(section1?.value).toBe(50);
      });

      it('should handle sections with multi line accDescr', () => {
        const context = `pie accDescr {
            sample wow
        }
        "GitHub": 100
        "GitLab": 50`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(Pie);
        expect(value.accDescr).toBe('sample wow');

        const section0 = value.sections[0];
        expect(section0?.label).toBe('GitHub');
        expect(section0?.value).toBe(100);

        const section1 = value.sections[1];
        expect(section1?.label).toBe('GitLab');
        expect(section1?.value).toBe(50);
      });
    });

    describe('duplicate', () => {
      it('should handle duplicate sections', () => {
        const context = `pie
        "GitHub": 100
        "GitHub": 50`;
        const result = parse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(Pie);

        const section0 = value.sections[0];
        expect(section0?.label).toBe('GitHub');
        expect(section0?.value).toBe(100);

        const section1 = value.sections[1];
        expect(section1?.label).toBe('GitHub');
        expect(section1?.value).toBe(50);
      });
    });
  });
});