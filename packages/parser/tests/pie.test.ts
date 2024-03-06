import { describe, expect, it } from 'vitest';

import { Pie } from '../src/language/index.js';
import { expectNoErrorsOrAlternatives, pieParse as parse } from './test-util.js';

describe('pie', () => {
  it.each([
    `pie`,
    `  pie  `,
    `\tpie\t`,
    `
    \tpie
    `,
  ])('should handle regular pie', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Pie);
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
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Pie);

    const { showData } = result.value;
    expect(showData).toBeTruthy();
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
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Pie);

    const { title } = result.value;
    expect(title).toBe('sample title');
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
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Pie);

    const { title } = result.value;
    expect(title).toBe('sample title');
  });

  it.each([
    `pie showData title sample title`,
    `pie showData title sample title
    `,
  ])('should handle regular pie + showData + title', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Pie);

    const { showData, title } = result.value;
    expect(showData).toBeTruthy();
    expect(title).toBe('sample title');
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
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Pie);

    const { showData, title } = result.value;
    expect(showData).toBeTruthy();
    expect(title).toBe('sample title');
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
      ])('should handle regular sections', (context: string) => {
        const result = parse(context);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Pie);

        const { sections } = result.value;
        expect(sections[0].label).toBe('GitHub');
        expect(sections[0].value).toBe(100);

        expect(sections[1].label).toBe('GitLab');
        expect(sections[1].value).toBe(50);
      });

      it('should handle sections with showData', () => {
        const context = `pie showData
        "GitHub": 100
        "GitLab": 50`;
        const result = parse(context);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Pie);

        const { showData, sections } = result.value;
        expect(showData).toBeTruthy();

        expect(sections[0].label).toBe('GitHub');
        expect(sections[0].value).toBe(100);

        expect(sections[1].label).toBe('GitLab');
        expect(sections[1].value).toBe(50);
      });

      it('should handle sections with title', () => {
        const context = `pie title sample wow
        "GitHub": 100
        "GitLab": 50`;
        const result = parse(context);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Pie);

        const { title, sections } = result.value;
        expect(title).toBe('sample wow');

        expect(sections[0].label).toBe('GitHub');
        expect(sections[0].value).toBe(100);

        expect(sections[1].label).toBe('GitLab');
        expect(sections[1].value).toBe(50);
      });

      it('should handle sections with accTitle', () => {
        const context = `pie accTitle: sample wow
        "GitHub": 100
        "GitLab": 50`;
        const result = parse(context);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Pie);

        const { accTitle, sections } = result.value;
        expect(accTitle).toBe('sample wow');

        expect(sections[0].label).toBe('GitHub');
        expect(sections[0].value).toBe(100);

        expect(sections[1].label).toBe('GitLab');
        expect(sections[1].value).toBe(50);
      });

      it('should handle sections with single line accDescr', () => {
        const context = `pie accDescr: sample wow
        "GitHub": 100
        "GitLab": 50`;
        const result = parse(context);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Pie);

        const { accDescr, sections } = result.value;
        expect(accDescr).toBe('sample wow');

        expect(sections[0].label).toBe('GitHub');
        expect(sections[0].value).toBe(100);

        expect(sections[1].label).toBe('GitLab');
        expect(sections[1].value).toBe(50);
      });

      it('should handle sections with multi line accDescr', () => {
        const context = `pie accDescr {
            sample wow
        }
        "GitHub": 100
        "GitLab": 50`;
        const result = parse(context);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Pie);

        const { accDescr, sections } = result.value;
        expect(accDescr).toBe('sample wow');

        expect(sections[0].label).toBe('GitHub');
        expect(sections[0].value).toBe(100);

        expect(sections[1].label).toBe('GitLab');
        expect(sections[1].value).toBe(50);
      });
    });
  });
});
