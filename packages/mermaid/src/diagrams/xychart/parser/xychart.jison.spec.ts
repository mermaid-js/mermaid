// @ts-ignore: TODO Fix ts errors
import { parser } from './xychart.jison';
import { Mock, vi } from 'vitest';

const parserFnConstructor = (str: string) => {
  return () => {
    parser.parse(str);
  };
};

const mockDB: Record<string, Mock<any, any>> = {
  parseDirective: vi.fn(),
  setOrientation: vi.fn(),
  setXAxisTitle: vi.fn(),
  setXAxisRangeData: vi.fn(),
  addXAxisBand: vi.fn(),
  setYAxisTitle: vi.fn(),
  setYAxisRangeData: vi.fn(),
  addYAxisBand: vi.fn(),
  addLineData: vi.fn(),
  addBarData: vi.fn(),
};

function clearMocks() {
  for (const key in mockDB) {
    mockDB[key].mockRestore();
  }
}

describe('Testing xychart jison file', () => {
  beforeEach(() => {
    parser.yy = mockDB;
    clearMocks();
  });

  it('should throw error if xychart-beta text is not there', () => {
    const str = 'xychart-beta-1';
    expect(parserFnConstructor(str)).toThrow();
  });

  it('should not throw error if only xychart is there', () => {
    const str = 'xychart-beta';
    expect(parserFnConstructor(str)).not.toThrow();
  });

  it('should be able to parse directive', () => {
    const str =
      '%%{init: {"xychart": {"chartWidth": 600, "chartHeight": 600} } }%%  \n xychart-beta';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.parseDirective.mock.calls[0]).toEqual(['%%{', 'open_directive']);
    expect(mockDB.parseDirective.mock.calls[1]).toEqual(['init', 'type_directive']);
    expect(mockDB.parseDirective.mock.calls[2]).toEqual([
      '{"xychart": {"chartWidth": 600, "chartHeight": 600} }',
      'arg_directive',
    ]);
    expect(mockDB.parseDirective.mock.calls[3]).toEqual(['}%%', 'close_directive', 'xychart']);
  });

  it('parse chart orientation', () => {
    let str = 'xychart-beta vertical';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setOrientation).toHaveBeenCalledWith('vertical');

    clearMocks();

    str = 'xychart-beta        horizontal        ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setOrientation).toHaveBeenCalledWith('horizontal');

    str = 'xychart-beta abc';
    expect(parserFnConstructor(str)).toThrow();
  });

  it('parse x-axis', () => {
    let str = 'xychart-beta \nx-axis xAxisName\n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith('xAxisName');

    clearMocks();

    str = 'xychart-beta \nx-axis        xAxisName     \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith('xAxisName');

    clearMocks();

    str = 'xychart-beta \n    x-axis "xAxisName has space"\n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith('xAxisName has space');

    clearMocks();

    str = 'xychart-beta \n   x-axis    "  xAxisName has space   "         \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith('xAxisName has space');

    clearMocks();
    str = 'xychart-beta \nx-axis xAxisName    45.5   -->   33   \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith('xAxisName');
    expect(mockDB.setXAxisRangeData).toHaveBeenCalledWith(45.5, 33);

    clearMocks();

    str = 'xychart-beta \nx-axis xAxisName    [  "cat1"  ,   cat2  ]   \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith('xAxisName');
    expect(mockDB.addXAxisBand).toHaveBeenCalledTimes(2);
    expect(mockDB.addXAxisBand).toHaveBeenNthCalledWith(1, 'cat2');
    expect(mockDB.addXAxisBand).toHaveBeenNthCalledWith(2, 'cat1');
  });
  it('parse y-axis', () => {
    let str = 'xychart-beta \ny-axis yAxisName\n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith('yAxisName');

    clearMocks();

    str = 'xychart-beta \ny-axis        yAxisName     \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith('yAxisName');

    clearMocks();

    str = 'xychart-beta \n    y-axis "yAxisName has space"\n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith('yAxisName has space');

    clearMocks();

    str = 'xychart-beta \n   y-axis    "  yAxisName has space   "         \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith('yAxisName has space');

    clearMocks();
    str = 'xychart-beta \ny-axis yAxisName    45.5   -->   33   \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith('yAxisName');
    expect(mockDB.setYAxisRangeData).toHaveBeenCalledWith(45.5, 33);
  });
  it('parse line Data', () => {
    let str = 'xychart-beta\nx-axis xAxisName\ny-axis yAxisName\n line lineTitle [23, 45, 56.6]';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith('yAxisName');
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith('xAxisName');
    expect(mockDB.addLineData).toHaveBeenCalledWith('lineTitle', [23, 45, 56.6]);

    clearMocks();

    str =
      'xychart-beta\nx-axis xAxisName\ny-axis yAxisName\n line "lineTitle with space"   [  +23 , -45  , 56.6 ]   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith('yAxisName');
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith('xAxisName');
    expect(mockDB.addLineData).toHaveBeenCalledWith('lineTitle with space', [23, -45, 56.6]);

    clearMocks();
    str =
      'xychart-beta\nx-axis xAxisName\ny-axis yAxisName\n line "lineTitle with space"   [  +23 , -4aa5  , 56.6 ]   ';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse bar Data', () => {
    let str = 'xychart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar barTitle [23, 45, 56.6]';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith('yAxisName');
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith('xAxisName');
    expect(mockDB.addBarData).toHaveBeenCalledWith('barTitle', [23, 45, 56.6]);

    clearMocks();

    str =
      'xychart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar "barTitle with space"   [  +23 , -45  , 56.6 ]   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith('yAxisName');
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith('xAxisName');
    expect(mockDB.addBarData).toHaveBeenCalledWith('barTitle with space', [23, -45, 56.6]);
    clearMocks();

    str =
      'xychart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar "barTitle with space"   [  +23 , -4aa5  , 56.6 ]   ';
    expect(parserFnConstructor(str)).toThrow();
  });
  it('parse multiple bar and line', () => {
    let str =
      'xychart-beta\nx-axis xAxisName\ny-axis yAxisName\n bar barTitle1 [23, 45, 56.6] \n line lineTitle1 [11, 45.5, 67, 23] \n bar barTitle2 [13, 42, 56.89] \n line lineTitle2 [45, 99, 012]';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisTitle).toHaveBeenCalledWith('yAxisName');
    expect(mockDB.setXAxisTitle).toHaveBeenCalledWith('xAxisName');
    expect(mockDB.addBarData).toHaveBeenCalledWith('barTitle1', [23, 45, 56.6]);
    expect(mockDB.addBarData).toHaveBeenCalledWith('barTitle2', [13, 42, 56.89]);
    expect(mockDB.addLineData).toHaveBeenCalledWith('lineTitle1', [11, 45.5, 67, 23]);
    expect(mockDB.addLineData).toHaveBeenCalledWith('lineTitle2', [45, 99, 12]);
  });
});
