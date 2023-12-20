// @ts-ignore: Jison doesn't  support type.
import { parser } from './matrixchart.jison';
import type { Mock } from 'vitest';
import { vi } from 'vitest';

const parserFnConstructor = (str: string) => {
  return () => {
    parser.parse(str);
  };
};

const mockDB: Record<string, Mock<any, any>> = {
  setOrientation: vi.fn(),
  setDiagramTitle: vi.fn(),
  setXAxisTitle: vi.fn(),
  setXAxisRangeData: vi.fn(),
  setXAxisBand: vi.fn(),
  setYAxisTitle: vi.fn(),
  setYAxisRangeData: vi.fn(),
  setLineData: vi.fn(),
  setBarData: vi.fn(),
};

function clearMocks() {
  for (const key in mockDB) {
    mockDB[key].mockRestore();
  }
}

describe('Testing matrixchart jison file', () => {
  beforeEach(() => {
    parser.yy = mockDB;
    clearMocks();
  });

  it('should throw error if matrixchart-beta text is not there', () => {
    const str = 'matrixchart-beta-1';
    expect(parserFnConstructor(str)).toThrow();
  });

  it('should not throw error if only matrixchart is there', () => {
    const str = 'matrixchart-beta';
    expect(parserFnConstructor(str)).not.toThrow();
  });

  it('parse title of the chart within "', () => {
    const str = 'matrixchart-beta \n title "This is a title"';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setDiagramTitle).toHaveBeenCalledWith('This is a title');
  });
  it('parse title of the chart without "', () => {
    const str = 'matrixchart-beta \n title oneLinertitle';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setDiagramTitle).toHaveBeenCalledWith('oneLinertitle');
  });

  it('parse chart orientation', () => {
    const str = 'matrixchart-beta vertical';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setOrientation).toHaveBeenCalledWith('vertical');
  });

  it('parse chart orientation with spaces', () => {
    let str = 'matrixchart-beta        horizontal        ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setOrientation).toHaveBeenCalledWith('horizontal');

    str = 'matrixchart-beta abc';
    expect(parserFnConstructor(str)).toThrow();
  });

  it('parse x-axis', () => {
    const str = 'matrixchart-beta \nx-axis xAxisName\n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({
      text: 'xAxisName',
      type: 'text',
    });
  });

  it('parse x-axis with axis name without "', () => {
    const str = 'matrixchart-beta \nx-axis        xAxisName     \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({
      text: 'xAxisName',
      type: 'text',
    });
  });

  it('parse x-axis with axis name with "', () => {
    const str = 'matrixchart-beta \n    x-axis "xAxisName has space"\n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({
      text: 'xAxisName has space',
      type: 'text',
    });
  });

  it('parse x-axis with axis name with " with spaces', () => {
    const str = 'matrixchart-beta \n   x-axis    "  xAxisName has space   "         \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({
      text: '  xAxisName has space   ',
      type: 'text',
    });
  });

  it('parse x-axis with axis name and range data', () => {
    const str = 'matrixchart-beta \nx-axis xAxisName    45.5   -->   33   \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({
      text: 'xAxisName',
      type: 'text',
    });
    expect(mockDB.setXAxisRangeData).toHaveBeenCalledWith(45.5, 33);
  });
  it('parse x-axis throw error for invalid range data', () => {
    const str = 'matrixchart-beta \nx-axis xAxisName    aaa   -->   33   \n';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse x-axis with axis name and range data with only decimal part', () => {
    const str = 'matrixchart-beta \nx-axis xAxisName    45.5   -->   .34   \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({
      text: 'xAxisName',
      type: 'text',
    });
    expect(mockDB.setXAxisRangeData).toHaveBeenCalledWith(45.5, 0.34);
  });

  it('parse x-axis without axisname and range data', () => {
    const str = 'matrixchart-beta \nx-axis   45.5   -->   1.34   \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({
      text: '',
      type: 'text',
    });
    expect(mockDB.setXAxisRangeData).toHaveBeenCalledWith(45.5, 1.34);
  });

  it('parse x-axis with axis name and category data', () => {
    const str = 'matrixchart-beta \nx-axis xAxisName    [  "cat1"  ,   cat2a  ]   \n   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({
      text: 'xAxisName',
      type: 'text',
    });
    expect(mockDB.setXAxisBand).toHaveBeenCalledWith([
      {
        text: 'cat1',
        type: 'text',
      },
      { text: 'cat2a', type: 'text' },
    ]);
  });

  it('parse x-axis without axisname and category data', () => {
    const str = 'matrixchart-beta \nx-axis    [  "cat1"  ,   cat2a  ]   \n   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({
      text: '',
      type: 'text',
    });
    expect(mockDB.setXAxisBand).toHaveBeenCalledWith([
      {
        text: 'cat1',
        type: 'text',
      },
      { text: 'cat2a', type: 'text' },
    ]);
  });

  it('parse x-axis throw error if unbalanced bracket', () => {
    let str = 'matrixchart-beta \nx-axis xAxisName    [  "cat1"  [   cat2a  ]   \n   ';
    expect(parserFnConstructor(str)).toThrow();
    str = 'matrixchart-beta \nx-axis xAxisName    [  "cat1"  ,   cat2a ] ]   \n   ';
    expect(parserFnConstructor(str)).toThrow();
  });

  it('parse x-axis complete variant 1', () => {
    const str = `matrixchart-beta \n x-axis "this is x axis" [category1, "category 2", category3]\n`;
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({ text: 'this is x axis', type: 'text' });
    expect(mockDB.setXAxisBand).toHaveBeenCalledWith([
      { text: 'category1', type: 'text' },
      { text: 'category 2', type: 'text' },
      { text: 'category3', type: 'text' },
    ]);
  });

  it('parse x-axis complete variant 2', () => {
    const str =
      'matrixchart-beta \nx-axis xAxisName    [  "cat1  with space"  ,   cat2 , cat3]   \n   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({ text: 'xAxisName', type: 'text' });
    expect(mockDB.setXAxisBand).toHaveBeenCalledWith([
      { text: 'cat1  with space', type: 'text' },
      { text: 'cat2', type: 'text' },
      { text: 'cat3', type: 'text' },
    ]);
  });

  it('parse x-axis complete variant 3', () => {
    const str =
      'matrixchart-beta \nx-axis xAxisName    [  "cat1  with space"  ,   cat2 asdf , cat3]   \n   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({ text: 'xAxisName', type: 'text' });
    expect(mockDB.setXAxisBand).toHaveBeenCalledWith([
      { text: 'cat1  with space', type: 'text' },
      { text: 'cat2asdf', type: 'text' },
      { text: 'cat3', type: 'text' },
    ]);
  });

  it('parse y-axis with axis name', () => {
    const str = 'matrixchart-beta \ny-axis yAxisName\n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yAxisName', type: 'text' });
  });
  it('parse y-axis with axis name with spaces', () => {
    const str = 'matrixchart-beta \ny-axis        yAxisName     \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yAxisName', type: 'text' });
  });
  it('parse y-axis with axis name with "', () => {
    const str = 'matrixchart-beta \n    y-axis "yAxisName has space"\n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({
      text: 'yAxisName has space',
      type: 'text',
    });
  });
  it('parse y-axis with axis name with " and spaces', () => {
    const str = 'matrixchart-beta \n   y-axis    "  yAxisName has space   "         \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({
      text: '  yAxisName has space   ',
      type: 'text',
    });
  });
  it('parse y-axis with axis name with range data', () => {
    const str = 'matrixchart-beta \ny-axis yAxisName    45.5   -->   33   \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yAxisName', type: 'text' });
    expect(mockDB.setYAxisRangeData).toHaveBeenCalledWith(45.5, 33);
  });
  it('parse y-axis without axisname with range data', () => {
    const str = 'matrixchart-beta \ny-axis    45.5   -->   33   \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: '', type: 'text' });
    expect(mockDB.setYAxisRangeData).toHaveBeenCalledWith(45.5, 33);
  });
  it('parse y-axis with axis name with range data with only decimal part', () => {
    const str = 'matrixchart-beta \ny-axis yAxisName    45.5   -->   .33   \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yAxisName', type: 'text' });
    expect(mockDB.setYAxisRangeData).toHaveBeenCalledWith(45.5, 0.33);
  });
  it('parse y-axis throw error for invalid number in range data', () => {
    const str = 'matrixchart-beta \ny-axis yAxisName    45.5   -->   abc   \n';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse y-axis throws error if range data is passed', () => {
    const str = 'matrixchart-beta \ny-axis yAxisName    [ 45.3,   33 ]   \n';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse both axis at once', () => {
    const str = 'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({ text: 'xAxisName', type: 'text' });
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yAxisName', type: 'text' });
  });
  it('parse line Data', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n line lineTitle [23, 45, 56.6]';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setLineData).toHaveBeenCalledWith(
      { text: 'lineTitle', type: 'text' },
      [23, 45, 56.6]
    );
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({ text: 'xAxisName', type: 'text' });
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yAxisName', type: 'text' });
  });
  it('parse line Data with spaces and +,- symbols', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n line "lineTitle with space"   [  +23 , -45  , 56.6 ]   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yAxisName', type: 'text' });
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({ text: 'xAxisName', type: 'text' });
    expect(mockDB.setLineData).toHaveBeenCalledWith(
      { text: 'lineTitle with space', type: 'text' },
      [23, -45, 56.6]
    );
  });
  it('parse line Data without title', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n line [  +23 , -45  , 56.6 , .33]   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yAxisName', type: 'text' });
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({ text: 'xAxisName', type: 'text' });
    expect(mockDB.setLineData).toHaveBeenCalledWith(
      { text: '', type: 'text' },
      [23, -45, 56.6, 0.33]
    );
  });
  it('parse line Data throws error unbalanced brackets', () => {
    let str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n line "lineTitle with space"   [  +23 [ -45  , 56.6 ]   ';
    expect(parserFnConstructor(str)).toThrow();
    str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n line "lineTitle with space"   [  +23 , -45  ] 56.6 ]   ';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse line Data throws error if data is not provided', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n line "lineTitle with space"   ';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse line Data throws error if data is empty', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n line "lineTitle with space"  [ ] ';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse line Data throws error if , is not in proper', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n line "lineTitle with space"   [  +23 ,  , -45  , 56.6 ]   ';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse line Data throws error if not number', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n line "lineTitle with space"   [  +23 , -4aa5  , 56.6 ]   ';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse bar Data', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar barTitle [23, 45, 56.6, .22]';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yAxisName', type: 'text' });
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({ text: 'xAxisName', type: 'text' });
    expect(mockDB.setBarData).toHaveBeenCalledWith(
      { text: 'barTitle', type: 'text' },
      [23, 45, 56.6, 0.22]
    );
  });
  it('parse bar Data spaces and +,- symbol', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar "barTitle with space"   [  +23 , -45  , 56.6 ]   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yAxisName', type: 'text' });
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({ text: 'xAxisName', type: 'text' });
    expect(mockDB.setBarData).toHaveBeenCalledWith(
      { text: 'barTitle with space', type: 'text' },
      [23, -45, 56.6]
    );
  });
  it('parse bar Data without plot title', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar   [  +23 , -45  , 56.6 ]   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yAxisName', type: 'text' });
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({ text: 'xAxisName', type: 'text' });
    expect(mockDB.setBarData).toHaveBeenCalledWith({ text: '', type: 'text' }, [23, -45, 56.6]);
  });
  it('parse bar should throw for unbalanced brackets', () => {
    let str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar "barTitle with space"   [  +23 [ -45  , 56.6 ]   ';
    expect(parserFnConstructor(str)).toThrow();
    str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar "barTitle with space"   [  +23 , -45  ] 56.6 ]   ';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse bar should throw error if data is not provided', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar "barTitle with space"    ';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse bar should throw error if data is empty', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar "barTitle with space"   [   ]   ';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse bar should throw error if comma is not proper', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar "barTitle with space"   [  +23 , , -45  , 56.6 ]   ';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse bar should throw error if number is not passed', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar "barTitle with space"   [  +23 , -4aa5  , 56.6 ]   ';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse multiple bar and line variant 1', () => {
    const str =
      'matrixchart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar barTitle1 [23, 45, 56.6] \n line lineTitle1 [11, 45.5, 67, 23] \n bar barTitle2 [13, 42, 56.89] \n line lineTitle2 [45, 99, 012]';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yAxisName', type: 'text' });
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({ text: 'xAxisName', type: 'text' });
    expect(mockDB.setBarData).toHaveBeenCalledWith(
      { text: 'barTitle1', type: 'text' },
      [23, 45, 56.6]
    );
    expect(mockDB.setBarData).toHaveBeenCalledWith(
      { text: 'barTitle2', type: 'text' },
      [13, 42, 56.89]
    );
    expect(mockDB.setLineData).toHaveBeenCalledWith(
      { text: 'lineTitle1', type: 'text' },
      [11, 45.5, 67, 23]
    );
    expect(mockDB.setLineData).toHaveBeenCalledWith(
      { text: 'lineTitle2', type: 'text' },
      [45, 99, 12]
    );
  });
  it('parse multiple bar and line variant 2', () => {
    const str = `
    matrixchart-beta horizontal
    title Basic matrixchart
    x-axis "this is x axis" [category1, "category 2", category3]
    y-axis yaxisText 10 --> 150
 bar barTitle1 [23, 45, 56.6]
 line lineTitle1 [11, 45.5, 67, 23]
 bar barTitle2 [13, 42, 56.89]
    line lineTitle2 [45, 99, 012]`;
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith({ text: 'yaxisText', type: 'text' });
    expect(mockDB.setYAxisRangeData).toHaveBeenCalledWith(10, 150);
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith({ text: 'this is x axis', type: 'text' });
    expect(mockDB.setXAxisBand).toHaveBeenCalledWith([
      { text: 'category1', type: 'text' },
      { text: 'category 2', type: 'text' },
      { text: 'category3', type: 'text' },
    ]);
    expect(mockDB.setBarData).toHaveBeenCalledWith(
      { text: 'barTitle1', type: 'text' },
      [23, 45, 56.6]
    );
    expect(mockDB.setBarData).toHaveBeenCalledWith(
      { text: 'barTitle2', type: 'text' },
      [13, 42, 56.89]
    );
    expect(mockDB.setLineData).toHaveBeenCalledWith(
      { text: 'lineTitle1', type: 'text' },
      [11, 45.5, 67, 23]
    );
    expect(mockDB.setLineData).toHaveBeenCalledWith(
      { text: 'lineTitle2', type: 'text' },
      [45, 99, 12]
    );
  });
});
