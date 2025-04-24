import { describe, expect, it } from 'vitest';

import { XY } from '../src/language/index.js';
import type { BandData, RangeData } from '../src/language/generated/ast.js';

import {
  expectErrorsOrAlternatives,
  expectNoErrorsOrAlternatives,
  xyParse as parse,
} from './test-util.js';

const XY_KEYWORDS = ['xychart-beta', 'xy-beta'];

describe('xy', () => {
  it.each(XY_KEYWORDS)('should throw error if a keyword is not there', (keyword: string) => {
    const str = `${keyword}-something`;
    expectErrorsOrAlternatives(parse(str));
  });

  it.each(XY_KEYWORDS)('should not throw error if only keyword is there', (keyword: string) => {
    const str = `${keyword}`;
    expectNoErrorsOrAlternatives(parse(str));
  });

  describe('should handle title, accDesc and accTitle', () => {
    it.each(XY_KEYWORDS)('should handle title within "', (keyword: string) => {
      const result = parse(`${keyword} \n title "This is a title"`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { title } = result.value;
      expect(title).toBeDefined();
      expect(title).toBe('This is a title');
    });

    it.each(XY_KEYWORDS)('should handle title without "', (keyword: string) => {
      const result = parse(`${keyword} title This is a title`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { title } = result.value;
      expect(title).toBeDefined();
      expect(title).toBe('This is a title');
    });

    it.each(XY_KEYWORDS)('should handle accDescr', (keyword: string) => {
      const result = parse(`${keyword} accDescr: This is an accessibility description`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { accDescr } = result.value;
      expect(accDescr).toBeDefined();
      expect(accDescr).toBe('This is an accessibility description');
    });

    it.each(XY_KEYWORDS)('should handle accTitle', (keyword: string) => {
      const result = parse(`${keyword} accTitle: This is an accessibility title`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { accTitle } = result.value;
      expect(accTitle).toBeDefined();
      expect(accTitle).toBe('This is an accessibility title');
    });

    it.each(XY_KEYWORDS)('should handle title + accDescr + accTitle', (keyword: string) => {
      const result = parse(
        `${keyword} title This is a title\n accDescr: This is an accessibility description\n accTitle: This is an accessibility title`
      );
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { title, accDescr, accTitle } = result.value;
      expect(title).toBeDefined();
      expect(title).toBe('This is a title');
      expect(accDescr).toBeDefined();
      expect(accDescr).toBe('This is an accessibility description');
      expect(accTitle).toBeDefined();
      expect(accTitle).toBe('This is an accessibility title');
    });
  });

  describe('should handle orientation', () => {
    const orientations = ['vertical', 'horizontal', '   vertical  ', '   horizontal  '];
    const invalidOrientations = ['abc', 'diagonal'];

    it.each(orientations)('should handle %s orientation', (orientation: string) => {
      const result = parse(`xy-beta ${orientation}`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { orientation: parsedOrientation } = result.value;
      expect(parsedOrientation).toBeDefined();
      expect(parsedOrientation).toBe(orientation.trim());
    });

    it.each(invalidOrientations)('should throw error for %s orientation', (orientation: string) => {
      const result = parse(`xy-beta ${orientation}`);
      expectErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { orientation: parsedOrientation } = result.value;
      expect(parsedOrientation).toBeUndefined();
    });
  });

  describe('should handle x-axis', () => {
    it('should handle x-axis with name', () => {
      const result = parse(`xy-beta\nx-axis axisName`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('axisName');
    });

    it('should handle x-axis with name with "', () => {
      const result = parse(`xy-beta\nx-axis "axisName with spaces"`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('axisName with spaces');
    });

    it('should handle x-axis with name and range data', () => {
      const result = parse(`xy-beta\nx-axis axisName 45.5 --> 33`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('axisName');
      expect(xAxis?.data?.$type).toBe('RangeData');
      const rangeData: RangeData = xAxis?.data as RangeData;
      expect(rangeData.start).toBe(45.5);
      expect(rangeData.end).toBe(33);
    });

    it('should throw error for invalid range data', () => {
      const result = parse(`xy-beta\nx-axis axisName aaa --> 33`);
      expectErrorsOrAlternatives(result);
    });

    it('should parse x-axis with name and range data with only decimal part', () => {
      const result = parse(`xy-beta\nx-axis axisName 45.5 --> .33`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('axisName');
      expect(xAxis?.data?.$type).toBe('RangeData');
      const rangeData: RangeData = xAxis?.data as RangeData;
      expect(rangeData.start).toBe(45.5);
      expect(rangeData.end).toBe(0.33);
    });

    it('should parse x-axis without name but with range data', () => {
      const result = parse(`xy-beta\nx-axis 45.5 --> 1.34`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.data?.$type).toBe('RangeData');
      const rangeData: RangeData = xAxis?.data as RangeData;
      expect(rangeData.start).toBe(45.5);
      expect(rangeData.end).toBe(1.34);
    });

    it('should parse x-axis range data with only decimal part', () => {
      const result = parse(`xy-beta\nx-axis -.45 --> +.34`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);
      const { xAxis } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.data?.$type).toBe('RangeData');
      const rangeData: RangeData = xAxis?.data as RangeData;
      expect(rangeData.start).toBe(-0.45);
      expect(rangeData.end).toBe(0.34);
    });

    it('should parse x-axis with name and category data', () => {
      const result = parse(`xy-beta\nx-axis axisName ["cat1", cat2a]`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('axisName');
      expect(xAxis?.data?.$type).toBe('BandData');
      const bandData: BandData = xAxis?.data as BandData;
      expect(bandData.labels[0]).toBe('cat1');
      expect(bandData.labels[1]).toBe('cat2a');
    });

    it('should parse x-axis without name but with category data', () => {
      const result = parse(`xy-beta\nx-axis ["cat1", cat2a]`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBeUndefined();
      expect(xAxis?.data?.$type).toBe('BandData');
      const bandData: BandData = xAxis?.data as BandData;
      expect(bandData.labels[0]).toBe('cat1');
      expect(bandData.labels[1]).toBe('cat2a');
    });

    it.each(['["cat1" [ cat2a]', '["cat1", cat2a]]'])(
      'should throw error for unbalanced brackets in %s axis',
      (unbalancedBracket) => {
        const result = parse(`xy-beta\nx-axis ${unbalancedBracket}`);
        expectErrorsOrAlternatives(result);
      }
    );

    it('should parse x-axis for variant 1', () => {
      const result = parse(`
                xy-beta
                x-axis "this is x-axis" [category1, "category 2", category3]
            `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);
      const { xAxis } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('this is x-axis');
      expect(xAxis?.data?.$type).toBe('BandData');
      const bandData: BandData = xAxis?.data as BandData;
      expect(bandData.labels[0]).toBe('category1');
      expect(bandData.labels[1]).toBe('category 2');
      expect(bandData.labels[2]).toBe('category3');
    });

    it('should parse x-axis for variant 2', () => {
      const result = parse(`
                xy-beta
                x-axis xAxisName [ "cat1  with space", cat2, cat3]
            `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);
      const { xAxis } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('xAxisName');
      expect(xAxis?.data?.$type).toBe('BandData');
      const bandData: BandData = xAxis?.data as BandData;
      expect(bandData.labels[0]).toBe('cat1  with space');
      expect(bandData.labels[1]).toBe('cat2');
      expect(bandData.labels[2]).toBe('cat3');
    });

    it('should parse x-axis for variant 3', () => {
      const result = parse(`
                xy-beta
                x-axis xAxisName [ "cat1  with space", cat2asdf, cat3]
            `); // TODO: 💥 Breaking changes: we don't support category with spaces without strings
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);
      const { xAxis } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('xAxisName');
      expect(xAxis?.data?.$type).toBe('BandData');
      const bandData: BandData = xAxis?.data as BandData;
      expect(bandData.labels[0]).toBe('cat1  with space');
      expect(bandData.labels[1]).toBe('cat2asdf');
      expect(bandData.labels[2]).toBe('cat3');
    });
  });

  describe('should handle y-axis', () => {
    it('should handle y-axis with name', () => {
      const result = parse(`xy-beta\ny-axis axisName`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { yAxis } = result.value;
      expect(yAxis).toBeDefined();
      expect(yAxis?.title).toBe('axisName');
    });

    it('should handle y-axis with name with "', () => {
      const result = parse(`xy-beta\ny-axis "axisName with spaces"`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { yAxis } = result.value;
      expect(yAxis).toBeDefined();
      expect(yAxis?.title).toBe('axisName with spaces');
    });

    it('should handle y-axis with name and range data', () => {
      const result = parse(`xy-beta\ny-axis axisName 45.5 --> 33`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { yAxis } = result.value;
      expect(yAxis).toBeDefined();
      expect(yAxis?.title).toBe('axisName');
      expect(yAxis?.data?.$type).toBe('RangeData');
      expect(yAxis?.data).toBeDefined();
      expect(yAxis?.data?.start).toBe(45.5);
      expect(yAxis?.data?.end).toBe(33);
    });

    it('should throw error for invalid range data', () => {
      const result = parse(`xy-beta\ny-axis axisName aaa --> 33`);
      expectErrorsOrAlternatives(result);
    });

    it('should parse y-axis with name and range data with only decimal part', () => {
      const result = parse(`xy-beta\ny-axis axisName 45.5 --> .33`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { yAxis } = result.value;
      expect(yAxis).toBeDefined();
      expect(yAxis?.title).toBe('axisName');
      expect(yAxis?.data?.$type).toBe('RangeData');
      expect(yAxis?.data).toBeDefined();
      expect(yAxis?.data?.start).toBe(45.5);
      expect(yAxis?.data?.end).toBe(0.33);
    });

    it('should parse y-axis without name but with range data', () => {
      const result = parse(`xy-beta\ny-axis 45.5 --> 1.34`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { yAxis } = result.value;
      expect(yAxis).toBeDefined();
      expect(yAxis?.data?.$type).toBe('RangeData');
      expect(yAxis?.data).toBeDefined();
      expect(yAxis?.data?.start).toBe(45.5);
      expect(yAxis?.data?.end).toBe(1.34);
    });
  });

  describe('should handle line data', () => {
    it.each(XY_KEYWORDS)('%s keyword with line data', (keyword: string) => {
      const result = parse(`
        ${keyword}
        x-axis xAxisName
        y-axis yAxisName
        line lineTitle [23, 45, 56.6]
        `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis, yAxis, line } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('xAxisName');
      expect(yAxis).toBeDefined();
      expect(yAxis?.title).toBe('yAxisName');
      expect(line).toBeDefined();
      expect(line[0]?.title).toBe('lineTitle');
      expect(line[0]?.data).toBeDefined();
      expect(line[0]?.data.values).toEqual([23, 45, 56.6]);
    });

    it.each(XY_KEYWORDS)(
      '%s keyword with line data with spaces and +,- symbols',
      (keyword: string) => {
        const result = parse(`
            ${keyword}
            x-axis xAxisName
            y-axis yAxisName
            line "lineTitle with space" [  +23 , -45  , 56.6 ]
        `);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(XY);

        const { xAxis, yAxis, line } = result.value;
        expect(xAxis).toBeDefined();
        expect(xAxis?.title).toBe('xAxisName');
        expect(yAxis).toBeDefined();
        expect(yAxis?.title).toBe('yAxisName');
        expect(line).toBeDefined();
        expect(line[0]?.title).toBe('lineTitle with space');
        expect(line[0]?.data).toBeDefined();
        expect(line[0]?.data.values).toEqual([23, -45, 56.6]);
      }
    );

    it.each(XY_KEYWORDS)('%s keyword with line data without title', (keyword: string) => {
      const result = parse(`
            ${keyword}
            x-axis xAxisName
            y-axis yAxisName
            line [  +23 , -45  , .33]
        `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis, yAxis, line } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('xAxisName');
      expect(yAxis).toBeDefined();
      expect(yAxis?.title).toBe('yAxisName');
      expect(line).toBeDefined();
      expect(line[0]?.title).toBeUndefined();
      expect(line[0]?.data).toBeDefined();
      expect(line[0]?.data.values).toEqual([23, -45, 0.33]);
    });

    it.each([
      'line "lineTitle with space" [  +23 [ -45  , 56.6 ]',
      'line "lineTitle with space" [  +23 , -45  ] 56.6 ]',
      'line "lineTitle with space"',
      'line "lineTitle with space" [  +23 , , -45  , 56.6 ]',
      'line "lineTitle with space" [  +23 , -4aa5  , 56.6 ]',
      'line lineTitle with space [  +23 , -45  , 56.6 ]',
    ])('should throw error for common errors in %s', (errorInLine: string) => {
      const result = parse(`
                xy-beta
                x-axis xAxisName
                y-axis yAxisName
                ${errorInLine}
            `);
      expectErrorsOrAlternatives(result);
    });
  });

  describe('should handle bar data', () => {
    it.each(XY_KEYWORDS)('%s keyword with bar data', (keyword: string) => {
      const result = parse(`
              ${keyword}
              x-axis xAxisName
              y-axis yAxisName
              bar barTitle [23, 45, 56.6]
          `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis, yAxis, bar } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('xAxisName');
      expect(yAxis).toBeDefined();
      expect(yAxis?.title).toBe('yAxisName');
      expect(bar).toBeDefined();
      expect(bar[0]?.title).toBe('barTitle');
      expect(bar[0]?.data).toBeDefined();
      expect(bar[0]?.data.values).toEqual([23, 45, 56.6]);
    });

    it.each(XY_KEYWORDS)(
      '%s keyword with bar data with spaces and +,- symbols',
      (keyword: string) => {
        const result = parse(`
              ${keyword}
              x-axis xAxisName
              y-axis yAxisName
              bar "barTitle with space" [  +23 , -45  , 56.6 ]
          `);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(XY);

        const { xAxis, yAxis, bar } = result.value;
        expect(xAxis).toBeDefined();
        expect(xAxis?.title).toBe('xAxisName');
        expect(yAxis).toBeDefined();
        expect(yAxis?.title).toBe('yAxisName');
        expect(bar).toBeDefined();
        expect(bar[0]?.title).toBe('barTitle with space');
        expect(bar[0]?.data).toBeDefined();
        expect(bar[0]?.data.values).toEqual([23, -45, 56.6]);
      }
    );

    it.each(XY_KEYWORDS)('%s keyword with bar data without title', (keyword: string) => {
      const result = parse(`
              ${keyword}
              x-axis xAxisName
              y-axis yAxisName
              bar [  +23 , -45  , .33]
          `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis, yAxis, bar } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('xAxisName');
      expect(yAxis).toBeDefined();
      expect(yAxis?.title).toBe('yAxisName');
      expect(bar).toBeDefined();
      expect(bar[0]?.title).toBeUndefined();
      expect(bar[0]?.data).toBeDefined();
      expect(bar[0]?.data.values).toEqual([23, -45, 0.33]);
    });

    it.each([
      'bar "barTitle with space" [  +23 [ -45  , 56.6 ]',
      'bar "barTitle with space" [  +23 , -45  ] 56.6 ]',
      'bar "barTitle with space"',
      'bar "barTitle with space" [  +23 , , -45  , 56.6 ]',
      'bar "barTitle with space" [  +23 , -4aa5  , 56.6 ]',
      'bar barTitle with space [  +23 , -45  , 56.6 ]',
    ])('should throw error for common errors in %s', (errorInBar: string) => {
      const result = parse(`
                  xy-beta
                  x-axis xAxisName
                  y-axis yAxisName
                  ${errorInBar}
              `);
      expectErrorsOrAlternatives(result);
    });
  });

  describe('should handle complete xy charts', () => {
    it('should parse both axis at once', () => {
      const result = parse(`
                xy-beta
                x-axis xAxisName
                y-axis yAxisName
            `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);
      const { xAxis, yAxis } = result.value;
      const xAxisName = xAxis?.title;
      const yAxisName = yAxis?.title;
      expect(xAxisName).toBeDefined();
      expect(xAxisName).toBe('xAxisName');
      expect(yAxisName).toBeDefined();
      expect(yAxisName).toBe('yAxisName');
    });

    it.each(XY_KEYWORDS)('%s keyword with bar and line data', (keyword: string) => {
      const result = parse(`
              ${keyword}
              x-axis xAxisName
              y-axis yAxisName
              bar barTitle [23, 45, 56.6]
              line lineTitle [11, 45.5, 67, 23]
              bar barTitle2 [13, 42, 56.89]
              line lineTitle2 [45, 99, 12]
          `); // TODO: 💥 Breaking changes: leading zeros are not supported
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis, yAxis, bar, line } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('xAxisName');
      expect(yAxis).toBeDefined();
      expect(yAxis?.title).toBe('yAxisName');
      expect(bar).toBeDefined();
      expect(bar[0]?.title).toBe('barTitle');
      expect(bar[0]?.data).toBeDefined();
      expect(bar[0]?.data.values).toEqual([23, 45, 56.6]);
      expect(line).toBeDefined();
      expect(line[0]?.title).toBe('lineTitle');
      expect(line[0]?.data).toBeDefined();
      expect(line[0]?.data.values).toEqual([11, 45.5, 67, 23]);
      expect(bar[1]?.title).toBe('barTitle2');
      expect(bar[1]?.data).toBeDefined();
      expect(bar[1]?.data.values).toEqual([13, 42, 56.89]);
      expect(line[1]?.title).toBe('lineTitle2');
      expect(line[1]?.data).toBeDefined();
      expect(line[1]?.data.values).toEqual([45, 99, 12]);
    });

    it.each(XY_KEYWORDS)('%s keyword with bar and line data (variant 2)', (keyword: string) => {
      const result = parse(`
              ${keyword} horizontal
              title Basic xychart
              x-axis "this is x-axis" [category1, "category 2", category3]
              y-axis yaxisText 10 --> 150
              bar barTitle1 [23, 45, 56.6]
              line lineTitle1 [11, 45.5, 67, 23]
              bar barTitle2 [13, 42, 56.89]
              line lineTitle2 [15, 99, 12]
          `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(XY);

      const { xAxis, yAxis, bar, line } = result.value;
      expect(xAxis).toBeDefined();
      expect(xAxis?.title).toBe('this is x-axis');
      expect(xAxis?.data?.$type).toBe('BandData');
      const bandData: BandData = xAxis?.data as BandData;
      expect(bandData.labels[0]).toBe('category1');
      expect(bandData.labels[1]).toBe('category 2');
      expect(bandData.labels[2]).toBe('category3');
      expect(yAxis).toBeDefined();
      expect(yAxis?.title).toBe('yaxisText');
      expect(yAxis?.data?.$type).toBe('RangeData');
      expect(yAxis?.data).toBeDefined();
      expect(yAxis?.data?.start).toBe(10);
      expect(yAxis?.data?.end).toBe(150);
      expect(bar).toBeDefined();
      expect(bar[0]?.title).toBe('barTitle1');
      expect(bar[0]?.data).toBeDefined();
      expect(bar[0]?.data.values).toEqual([23, 45, 56.6]);
      expect(line).toBeDefined();
      expect(line[0]?.title).toBe('lineTitle1');
      expect(line[0]?.data).toBeDefined();
      expect(line[0]?.data.values).toEqual([11, 45.5, 67, 23]);
      expect(bar[1]?.title).toBe('barTitle2');
      expect(bar[1]?.data).toBeDefined();
      expect(bar[1]?.data.values).toEqual([13, 42, 56.89]);
      expect(line[1]?.title).toBe('lineTitle2');
      expect(line[1]?.data).toBeDefined();
      expect(line[1]?.data.values).toEqual([15, 99, 12]);
    });
  });
});
