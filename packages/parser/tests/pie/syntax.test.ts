import { describe, expect, it } from 'vitest';

import { PieChart } from '../../src/language/index.js';
import { createTestServices } from '../test-utils.js';

describe('pie chart', () => {
  const { parse } = createTestServices<PieChart>();

  it.each([
    `pie`,
    `  pie  `,
    `\tpie\t`,
    `

        \tpie

        `,
  ])('should handle regular pie', async (string_: string) => {
    const { parseResult: result } = await parse(string_);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(PieChart);
  });

  it.each([
    `pie showData`,
    `  pie  showData  `,
    `\tpie\tshowData\t`,
    `

        pie\tshowData

        `,
  ])('should handle regular showData', async (string_: string) => {
    const { parseResult: result } = await parse(string_);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(PieChart);
    expect(value.showData).toBeTruthy();
  });

  it.each([
    `pie title sample title`,
    `  pie  title sample title  `,
    `\tpie\ttitle sample title\t`,
    `pie

        \ttitle sample title

        `,
  ])('should handle regular pie + title in same line', async (string_: string) => {
    const { parseResult: result } = await parse(string_);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(PieChart);
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
  ])('should handle regular pie + title in different line', async (string_: string) => {
    const { parseResult: result } = await parse(string_);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(PieChart);
    expect(value.title).toBe('sample title');
  });

  it.each([
    `pie showData title sample title`,
    `pie showData title sample title
        `,
  ])('should handle regular pie + showData + title', async (string_: string) => {
    const { parseResult: result } = await parse(string_);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(PieChart);
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
  ])('should handle regular showData + title in different line', async (string_: string) => {
    const { parseResult: result } = await parse(string_);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(PieChart);
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
      ])('should handle regular secions', async (string_: string) => {
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(PieChart);

        const section0 = value.sections[0];
        expect(section0?.label).toBe('GitHub');
        expect(section0?.value).toBe(100);

        const section1 = value.sections[1];
        expect(section1?.label).toBe('GitLab');
        expect(section1?.value).toBe(50);
      });

      it('should handle sections with showData', async () => {
        const string_ = `pie showData
                "GitHub": 100
                "GitLab": 50`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(PieChart);
        expect(value.showData).toBeTruthy();

        const section0 = value.sections[0];
        expect(section0?.label).toBe('GitHub');
        expect(section0?.value).toBe(100);

        const section1 = value.sections[1];
        expect(section1?.label).toBe('GitLab');
        expect(section1?.value).toBe(50);
      });

      it('should handle sections with title', async () => {
        const string_ = `pie title sample wow
                "GitHub": 100
                "GitLab": 50`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(PieChart);
        expect(value.title).toBe('sample wow');

        const section0 = value.sections[0];
        expect(section0?.label).toBe('GitHub');
        expect(section0?.value).toBe(100);

        const section1 = value.sections[1];
        expect(section1?.label).toBe('GitLab');
        expect(section1?.value).toBe(50);
      });

      it('should handle sections with accTitle', async () => {
        const string_ = `pie accTitle: sample wow
                "GitHub": 100
                "GitLab": 50`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(PieChart);
        expect(value.accTitle).toBe('sample wow');

        const section0 = value.sections[0];
        expect(section0?.label).toBe('GitHub');
        expect(section0?.value).toBe(100);

        const section1 = value.sections[1];
        expect(section1?.label).toBe('GitLab');
        expect(section1?.value).toBe(50);
      });

      it('should handle sections with single line accDescr', async () => {
        const string_ = `pie accDescr: sample wow
                "GitHub": 100
                "GitLab": 50`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(PieChart);
        expect(value.accDescr).toBe('sample wow');

        const section0 = value.sections[0];
        expect(section0?.label).toBe('GitHub');
        expect(section0?.value).toBe(100);

        const section1 = value.sections[1];
        expect(section1?.label).toBe('GitLab');
        expect(section1?.value).toBe(50);
      });

      it('should handle sections with multi line accDescr', async () => {
        const string_ = `pie accDescr {
                    sample wow
                }
                "GitHub": 100
                "GitLab": 50`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(PieChart);
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
      it('should handle duplicate sections', async () => {
        const string_ = `pie
                "GitHub": 100
                "GitHub": 50`;
        const { parseResult: result } = await parse(string_);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);

        const value = result.value;
        expect(value.$type).toBe(PieChart);

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
