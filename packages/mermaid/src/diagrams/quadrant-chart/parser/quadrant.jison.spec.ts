// @ts-ignore: TODO Fix ts errors
import { parser } from './quadrant.jison';
import { Mock, vi } from 'vitest';

const parserFnConstructor = (str: string) => {
  return () => {
    parser.parse(str);
  };
};

const mockDB: Record<string, Mock<any, any>> = {
  setQuadrant1Text: vi.fn(),
  setQuadrant2Text: vi.fn(),
  setQuadrant3Text: vi.fn(),
  setQuadrant4Text: vi.fn(),
  setXAxisLeftText: vi.fn(),
  setXAxisRightText: vi.fn(),
  setYAxisTopText: vi.fn(),
  setYAxisBottomText: vi.fn(),
  setDiagramTitle: vi.fn(),
  parseDirective: vi.fn(),
  addPoint: vi.fn(),
};

function clearMocks() {
  for (const key in mockDB) {
    mockDB[key].mockRestore();
  }
}

describe('Testing quadrantChart jison file', () => {
  beforeEach(() => {
    parser.yy = mockDB;
    clearMocks();
  });

  it('should throw error if quadrantChart text is not there', () => {
    const str = 'quadrant-1 do';
    expect(parserFnConstructor(str)).toThrow();
  });

  it('should not throw error if only quadrantChart is there', () => {
    const str = 'quadrantChart';
    expect(parserFnConstructor(str)).not.toThrow();
  });

  it('should be able to parse directive', () => {
    const str =
      '%%{init: {"quadrantChart": {"chartWidth": 600, "chartHeight": 600} } }%%  \n quadrantChart';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.parseDirective.mock.calls[0]).toEqual(['%%{', 'open_directive']);
    expect(mockDB.parseDirective.mock.calls[1]).toEqual(['init', 'type_directive']);
    expect(mockDB.parseDirective.mock.calls[2]).toEqual([
      '{"quadrantChart": {"chartWidth": 600, "chartHeight": 600} }',
      'arg_directive',
    ]);
    expect(mockDB.parseDirective.mock.calls[3]).toEqual([
      '}%%',
      'close_directive',
      'quadrantChart',
    ]);
  });

  it('should be able to parse xAxis text', () => {
    let str = 'quadrantChart\nx-axis urgent --> not urgent';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisLeftText).toHaveBeenCalledWith({ text: 'urgent', type: 'text' });
    expect(mockDB.setXAxisRightText).toHaveBeenCalledWith({ text: 'not urgent', type: 'text' });

    clearMocks();
    str = 'quadrantChart\n       x-AxIs         Urgent     -->        Not Urgent    \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisLeftText).toHaveBeenCalledWith({ text: 'Urgent', type: 'text' });
    expect(mockDB.setXAxisRightText).toHaveBeenCalledWith({ text: 'Not Urgent    ', type: 'text' });

    clearMocks();
    str =
      'quadrantChart\n       x-AxIs         "Urgent(* +=[❤"     -->        "Not Urgent (* +=[❤"\n    ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisLeftText).toHaveBeenCalledWith({ text: 'Urgent(* +=[❤', type: 'text' });
    expect(mockDB.setXAxisRightText).toHaveBeenCalledWith({
      text: 'Not Urgent (* +=[❤',
      type: 'text',
    });

    clearMocks();
    str = 'quadrantChart\n       x-AxIs         "Urgent(* +=[❤"';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisLeftText).toHaveBeenCalledWith({ text: 'Urgent(* +=[❤', type: 'text' });
    expect(mockDB.setXAxisRightText).not.toHaveBeenCalled();

    clearMocks();
    str = 'quadrantChart\n       x-AxIs         "Urgent(* +=[❤"  --> ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setXAxisLeftText).toHaveBeenCalledWith({
      text: 'Urgent(* +=[❤ ⟶ ',
      type: 'text',
    });
    expect(mockDB.setXAxisRightText).not.toHaveBeenCalled();
  });

  it('should be able to parse yAxis text', () => {
    let str = 'quadrantChart\ny-axis urgent --> not urgent';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisBottomText).toHaveBeenCalledWith({ text: 'urgent', type: 'text' });
    expect(mockDB.setYAxisTopText).toHaveBeenCalledWith({ text: 'not urgent', type: 'text' });

    clearMocks();
    str = 'quadrantChart\n       y-AxIs         Urgent     -->        Not Urgent    \n';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisBottomText).toHaveBeenCalledWith({ text: 'Urgent', type: 'text' });
    expect(mockDB.setYAxisTopText).toHaveBeenCalledWith({ text: 'Not Urgent    ', type: 'text' });

    clearMocks();
    str =
      'quadrantChart\n       Y-AxIs         "Urgent(* +=[❤"     -->        "Not Urgent (* +=[❤"\n    ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisBottomText).toHaveBeenCalledWith({ text: 'Urgent(* +=[❤', type: 'text' });
    expect(mockDB.setYAxisTopText).toHaveBeenCalledWith({
      text: 'Not Urgent (* +=[❤',
      type: 'text',
    });

    clearMocks();
    str = 'quadrantChart\n       y-AxIs         "Urgent(* +=[❤"';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisBottomText).toHaveBeenCalledWith({ text: 'Urgent(* +=[❤', type: 'text' });
    expect(mockDB.setYAxisTopText).not.toHaveBeenCalled();

    clearMocks();
    str = 'quadrantChart\n       y-AxIs         "Urgent(* +=[❤"  --> ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisBottomText).toHaveBeenCalledWith({
      text: 'Urgent(* +=[❤ ⟶ ',
      type: 'text',
    });
    expect(mockDB.setYAxisTopText).not.toHaveBeenCalled();
  });

  it('should be able to parse quadrant1 text', () => {
    let str = 'quadrantChart\nquadrant-1 Plan';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant1Text).toHaveBeenCalledWith({ text: 'Plan', type: 'text' });

    clearMocks();
    str = 'QuadRantChart   \n     QuaDrant-1 Plan    ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant1Text).toHaveBeenCalledWith({ text: 'Plan    ', type: 'text' });

    clearMocks();
    str = 'QuadRantChart   \n     QuaDrant-1 "Plan(* +=[❤"';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant1Text).toHaveBeenCalledWith({ text: 'Plan(* +=[❤', type: 'text' });
  });

  it('should be able to parse quadrant2 text', () => {
    let str = 'quadrantChart\nquadrant-2 do';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant2Text).toHaveBeenCalledWith({ text: 'do', type: 'text' });

    clearMocks();
    str = 'QuadRantChart   \n     QuaDrant-2 Do    ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant2Text).toHaveBeenCalledWith({ text: 'Do    ', type: 'text' });

    clearMocks();
    str = 'QuadRantChart   \n     QuaDrant-2 "Do(* +=[❤"';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant2Text).toHaveBeenCalledWith({ text: 'Do(* +=[❤', type: 'text' });
  });

  it('should be able to parse quadrant3 text', () => {
    let str = 'quadrantChart\nquadrant-3 deligate';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant3Text).toHaveBeenCalledWith({ text: 'deligate', type: 'text' });

    clearMocks();
    str = 'QuadRantChart   \n     QuaDrant-3 Deligate    ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant3Text).toHaveBeenCalledWith({ text: 'Deligate    ', type: 'text' });

    clearMocks();
    str = 'QuadRantChart   \n     QuaDrant-3 "Deligate(* +=[❤"';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant3Text).toHaveBeenCalledWith({ text: 'Deligate(* +=[❤', type: 'text' });
  });

  it('should be able to parse quadrant4 text', () => {
    let str = 'quadrantChart\nquadrant-4 delete';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant4Text).toHaveBeenCalledWith({ text: 'delete', type: 'text' });

    clearMocks();
    str = 'QuadRantChart   \n     QuaDrant-4 Delete    ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant4Text).toHaveBeenCalledWith({ text: 'Delete    ', type: 'text' });

    clearMocks();
    str = 'QuadRantChart   \n     QuaDrant-4 "Delete(* +=[❤"';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant4Text).toHaveBeenCalledWith({ text: 'Delete(* +=[❤', type: 'text' });
  });

  it('should be able to parse title', () => {
    let str = 'quadrantChart\ntitle this is title';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setDiagramTitle).toHaveBeenCalledWith('this is title');

    clearMocks();
    str = 'QuadRantChart   \n     TiTle this Is title    ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setDiagramTitle).toHaveBeenCalledWith('this Is title');

    clearMocks();
    str = 'QuadRantChart   \n     title "this is title (* +=[❤"';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setDiagramTitle).toHaveBeenCalledWith('"this is title (* +=[❤"');
  });

  it('should be able to parse points', () => {
    let str = 'quadrantChart\npoint1: [0.1, 0.4]';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.addPoint).toHaveBeenCalledWith({ text: 'point1', type: 'text' }, '0.1', '0.4');

    clearMocks();
    str = 'QuadRantChart   \n     Point1      : [0.1, 0.4]   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.addPoint).toHaveBeenCalledWith({ text: 'Point1', type: 'text' }, '0.1', '0.4');

    clearMocks();
    str = 'QuadRantChart   \n     "Point1 : (* +=[❤": [1, 0]   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'Point1 : (* +=[❤', type: 'text' },
      '1',
      '0'
    );

    clearMocks();
    str = 'QuadRantChart   \n     Point1 : [1.2, 0.4]   ';
    expect(parserFnConstructor(str)).toThrow();
  });

  it('should be able to parse the whole chart', () => {
    const str = `%%{init: {"quadrantChart": {"chartWidth": 600, "chartHeight": 600} } }%%
    quadrantChart
      title Analytics and Business Intelligence Platforms
      x-axis "Completeness of Vision ❤" --> "x-axis-2"
      y-axis Ability to Execute --> "y-axis-2"
      quadrant-1 Leaders
      quadrant-2 Challengers
      quadrant-3 Niche
      quadrant-4 Visionaries
      Microsoft: [0.75, 0.75]
      Salesforce: [0.55, 0.60]
      IBM: [0.51, 0.40]
      Incorta: [0.20, 0.30]`;

    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.parseDirective.mock.calls[0]).toEqual(['%%{', 'open_directive']);
    expect(mockDB.parseDirective.mock.calls[1]).toEqual(['init', 'type_directive']);
    expect(mockDB.parseDirective.mock.calls[2]).toEqual([
      '{"quadrantChart": {"chartWidth": 600, "chartHeight": 600} }',
      'arg_directive',
    ]);
    expect(mockDB.parseDirective.mock.calls[3]).toEqual([
      '}%%',
      'close_directive',
      'quadrantChart',
    ]);
    expect(mockDB.setXAxisLeftText).toHaveBeenCalledWith({
      text: 'Completeness of Vision ❤',
      type: 'text',
    });
    expect(mockDB.setXAxisRightText).toHaveBeenCalledWith({ text: 'x-axis-2', type: 'text' });
    expect(mockDB.setYAxisTopText).toHaveBeenCalledWith({ text: 'y-axis-2', type: 'text' });
    expect(mockDB.setYAxisBottomText).toHaveBeenCalledWith({
      text: 'Ability to Execute',
      type: 'text',
    });
    expect(mockDB.setQuadrant1Text).toHaveBeenCalledWith({ text: 'Leaders', type: 'text' });
    expect(mockDB.setQuadrant2Text).toHaveBeenCalledWith({ text: 'Challengers', type: 'text' });
    expect(mockDB.setQuadrant3Text).toHaveBeenCalledWith({ text: 'Niche', type: 'text' });
    expect(mockDB.setQuadrant4Text).toHaveBeenCalledWith({ text: 'Visionaries', type: 'text' });
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'Microsoft', type: 'text' },
      '0.75',
      '0.75'
    );
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'Salesforce', type: 'text' },
      '0.55',
      '0.60'
    );
    expect(mockDB.addPoint).toHaveBeenCalledWith({ text: 'IBM', type: 'text' }, '0.51', '0.40');
    expect(mockDB.addPoint).toHaveBeenCalledWith({ text: 'Incorta', type: 'text' }, '0.20', '0.30');
  });
});
