// @ts-ignore: JISON doesn't support types
import { parser } from './quadrant.jison';
import type { Mock } from 'vitest';
import { vi } from 'vitest';

const parserFnConstructor = (str: string) => {
  return () => {
    parser.parse(str);
  };
};

const mockDB: Record<string, Mock<any>> = {
  setQuadrant1Text: vi.fn(),
  setQuadrant2Text: vi.fn(),
  setQuadrant3Text: vi.fn(),
  setQuadrant4Text: vi.fn(),
  setXAxisLeftText: vi.fn(),
  setXAxisRightText: vi.fn(),
  setYAxisTopText: vi.fn(),
  setYAxisBottomText: vi.fn(),
  setDiagramTitle: vi.fn(),
  addPoint: vi.fn(),
  addClass: vi.fn(),
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
    expect(mockDB.setYAxisBottomText).toHaveBeenCalledWith({
      text: 'Urgent(* +=[❤',
      type: 'text',
    });
    expect(mockDB.setYAxisTopText).toHaveBeenCalledWith({
      text: 'Not Urgent (* +=[❤',
      type: 'text',
    });

    clearMocks();
    str = 'quadrantChart\n       y-AxIs         "Urgent(* +=[❤"';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setYAxisBottomText).toHaveBeenCalledWith({
      text: 'Urgent(* +=[❤',
      type: 'text',
    });
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
    let str = 'quadrantChart\nquadrant-3 delegate';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant3Text).toHaveBeenCalledWith({ text: 'delegate', type: 'text' });

    clearMocks();
    str = 'QuadRantChart   \n     QuaDrant-3 Delegate    ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant3Text).toHaveBeenCalledWith({ text: 'Delegate    ', type: 'text' });

    clearMocks();
    str = 'QuadRantChart   \n     QuaDrant-3 "Delegate(* +=[❤"';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.setQuadrant3Text).toHaveBeenCalledWith({
      text: 'Delegate(* +=[❤',
      type: 'text',
    });
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
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'point1', type: 'text' },
      '',
      '0.1',
      '0.4',
      []
    );

    clearMocks();
    str = 'QuadRantChart   \n     Point1      : [0.1, 0.4]   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'Point1', type: 'text' },
      '',
      '0.1',
      '0.4',
      []
    );

    clearMocks();
    str = 'QuadRantChart   \n     "Point1 : (* +=[❤": [1, 0]   ';
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'Point1 : (* +=[❤', type: 'text' },
      '',
      '1',
      '0',
      []
    );

    clearMocks();
    str = 'QuadRantChart   \n     Point1 : [1.2, 0.4]   ';
    expect(parserFnConstructor(str)).toThrow();
  });

  it('should be able to parse the whole chart', () => {
    const str = `quadrantChart
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
      '',
      '0.75',
      '0.75',
      []
    );
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'Salesforce', type: 'text' },
      '',
      '0.55',
      '0.60',
      []
    );
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'IBM', type: 'text' },
      '',
      '0.51',
      '0.40',
      []
    );
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'Incorta', type: 'text' },
      '',
      '0.20',
      '0.30',
      []
    );
  });

  it('should be able to parse the whole chart with point styling with all params or some params', () => {
    const str = `quadrantChart
      title Analytics and Business Intelligence Platforms
      x-axis "Completeness of Vision ❤" --> "x-axis-2"
      y-axis Ability to Execute --> "y-axis-2"
      quadrant-1 Leaders
      quadrant-2 Challengers
      quadrant-3 Niche
      quadrant-4 Visionaries
      Microsoft: [0.75, 0.75] radius: 10
      Salesforce: [0.55, 0.60] radius: 10, color: #ff0000
      IBM: [0.51, 0.40] radius: 10, color: #ff0000, stroke-color: #ff00ff
      Incorta: [0.20, 0.30] radius: 10 ,color: #ff0000 ,stroke-color: #ff00ff ,stroke-width: 10px`;

    expect(parserFnConstructor(str)).not.toThrow();
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
      '',
      '0.75',
      '0.75',
      ['radius: 10']
    );
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'Salesforce', type: 'text' },
      '',
      '0.55',
      '0.60',
      ['radius: 10', 'color: #ff0000']
    );
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'IBM', type: 'text' },
      '',
      '0.51',
      '0.40',
      ['radius: 10', 'color: #ff0000', 'stroke-color: #ff00ff']
    );
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'Incorta', type: 'text' },
      '',
      '0.20',
      '0.30',
      ['radius: 10', 'color: #ff0000', 'stroke-color: #ff00ff', 'stroke-width: 10px']
    );
  });

  it('should be able to parse the whole chart with point styling with params in a random order + class names', () => {
    const str = `quadrantChart
      title Analytics and Business Intelligence Platforms
      x-axis "Completeness of Vision ❤" --> "x-axis-2"
      y-axis Ability to Execute --> "y-axis-2"
      quadrant-1 Leaders
      quadrant-2 Challengers
      quadrant-3 Niche
      quadrant-4 Visionaries
      Microsoft: [0.75, 0.75] stroke-color: #ff00ff ,stroke-width: 10px, color: #ff0000, radius: 10
      Salesforce:::class1: [0.55, 0.60] radius: 10, color: #ff0000
      IBM: [0.51, 0.40] stroke-color: #ff00ff ,stroke-width: 10px
      Incorta: [0.20, 0.30] stroke-width: 10px`;

    expect(parserFnConstructor(str)).not.toThrow();
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
      '',
      '0.75',
      '0.75',
      ['stroke-color: #ff00ff', 'stroke-width: 10px', 'color: #ff0000', 'radius: 10']
    );
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'Salesforce', type: 'text' },
      'class1',
      '0.55',
      '0.60',
      ['radius: 10', 'color: #ff0000']
    );
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'IBM', type: 'text' },
      '',
      '0.51',
      '0.40',
      ['stroke-color: #ff00ff', 'stroke-width: 10px']
    );
    expect(mockDB.addPoint).toHaveBeenCalledWith(
      { text: 'Incorta', type: 'text' },
      '',
      '0.20',
      '0.30',
      ['stroke-width: 10px']
    );
  });

  it('should be able to handle constructor as a className', () => {
    const str = `quadrantChart
    classDef constructor fill:#ff0000
    Microsoft:::constructor: [0.75, 0.75]
    `;
    expect(parserFnConstructor(str)).not.toThrow();
    expect(mockDB.addClass).toHaveBeenCalledWith('constructor', ['fill:#ff0000']);
  });

  describe('Unicode support (CJK + Emoji)', () => {
    it('should be able to parse Chinese text in quadrant labels', () => {
      let str = 'quadrantChart\nquadrant-1 需要扩展';
      expect(parserFnConstructor(str)).not.toThrow();
      expect(mockDB.setQuadrant1Text).toHaveBeenCalledWith({
        text: '需要扩展',
        type: 'text',
      });

      clearMocks();
      str = 'quadrantChart\nquadrant-2 需要推广\nquadrant-3 重新评估\nquadrant-4 可以改进';
      expect(parserFnConstructor(str)).not.toThrow();
      expect(mockDB.setQuadrant2Text).toHaveBeenCalledWith({
        text: '需要推广',
        type: 'text',
      });
      expect(mockDB.setQuadrant3Text).toHaveBeenCalledWith({
        text: '重新评估',
        type: 'text',
      });
      expect(mockDB.setQuadrant4Text).toHaveBeenCalledWith({
        text: '可以改进',
        type: 'text',
      });
    });

    it('should be able to parse Chinese text in x-axis', () => {
      const str = 'quadrantChart\nx-axis 低覆盖率 --> 高覆盖率';
      expect(parserFnConstructor(str)).not.toThrow();
      expect(mockDB.setXAxisLeftText).toHaveBeenCalledWith({
        text: '低覆盖率',
        type: 'text',
      });
      expect(mockDB.setXAxisRightText).toHaveBeenCalledWith({
        text: '高覆盖率',
        type: 'text',
      });
    });

    it('should be able to parse Chinese text in y-axis', () => {
      const str = 'quadrantChart\ny-axis 低参与度 --> 高参与度';
      expect(parserFnConstructor(str)).not.toThrow();
      expect(mockDB.setYAxisBottomText).toHaveBeenCalledWith({
        text: '低参与度',
        type: 'text',
      });
      expect(mockDB.setYAxisTopText).toHaveBeenCalledWith({
        text: '高参与度',
        type: 'text',
      });
    });

    it('should be able to parse Chinese point names', () => {
      const str = 'quadrantChart\n产品A: [0.3, 0.6]';
      expect(parserFnConstructor(str)).not.toThrow();
      expect(mockDB.addPoint).toHaveBeenCalledWith(
        { text: '产品A', type: 'text' },
        '',
        '0.3',
        '0.6',
        []
      );
    });

    it('should be able to parse a full chart with Chinese', () => {
      const str = `quadrantChart
title 分析象限图
x-axis 低覆盖率 --> 高覆盖率
y-axis 低参与度 --> 高参与度
quadrant-1 需要扩展
quadrant-2 需要推广
quadrant-3 重新评估
quadrant-4 可以改进
产品A: [0.3, 0.6]
产品B: [0.45, 0.23]`;
      expect(parserFnConstructor(str)).not.toThrow();
      expect(mockDB.setDiagramTitle).toHaveBeenCalledWith('分析象限图');
      expect(mockDB.setXAxisLeftText).toHaveBeenCalledWith({
        text: '低覆盖率',
        type: 'text',
      });
      expect(mockDB.setXAxisRightText).toHaveBeenCalledWith({
        text: '高覆盖率',
        type: 'text',
      });
      expect(mockDB.setYAxisBottomText).toHaveBeenCalledWith({
        text: '低参与度',
        type: 'text',
      });
      expect(mockDB.setYAxisTopText).toHaveBeenCalledWith({
        text: '高参与度',
        type: 'text',
      });
      expect(mockDB.setQuadrant1Text).toHaveBeenCalledWith({
        text: '需要扩展',
        type: 'text',
      });
      expect(mockDB.addPoint).toHaveBeenCalledWith(
        { text: '产品A', type: 'text' },
        '',
        '0.3',
        '0.6',
        []
      );
      expect(mockDB.addPoint).toHaveBeenCalledWith(
        { text: '产品B', type: 'text' },
        '',
        '0.45',
        '0.23',
        []
      );
    });

    it('should be able to parse Japanese text', () => {
      const str = 'quadrantChart\nquadrant-1 拡張が必要\nx-axis 低い --> 高い';
      expect(parserFnConstructor(str)).not.toThrow();
      expect(mockDB.setQuadrant1Text).toHaveBeenCalledWith({
        text: '拡張が必要',
        type: 'text',
      });
    });

    it('should be able to parse Korean text', () => {
      const str = 'quadrantChart\nx-axis 낮음 --> 높음';
      expect(parserFnConstructor(str)).not.toThrow();
      expect(mockDB.setXAxisLeftText).toHaveBeenCalledWith({
        text: '낮음',
        type: 'text',
      });
    });

    it('should be able to parse emoji in text', () => {
      const str = 'quadrantChart\nquadrant-2 🚀Growth';
      expect(parserFnConstructor(str)).not.toThrow();
      expect(mockDB.setQuadrant2Text).toHaveBeenCalledWith({
        text: '🚀Growth',
        type: 'text',
      });
    });

    it('should parse Latin-1 accented text (French/Spanish/German)', () => {
      const str = 'quadrantChart\nx-axis Café --> Größe';
      expect(parserFnConstructor(str)).not.toThrow();
      expect(mockDB.setXAxisLeftText).toHaveBeenCalledWith({
        text: 'Café',
        type: 'text',
      });
      expect(mockDB.setXAxisRightText).toHaveBeenCalledWith({
        text: 'Größe',
        type: 'text',
      });
    });

    it('should parse accented characters in quadrant labels', () => {
      const str = 'quadrantChart\nquadrant-1 catégoría\nquadrant-2 naïve';
      expect(parserFnConstructor(str)).not.toThrow();
      expect(mockDB.setQuadrant1Text).toHaveBeenCalledWith({
        text: 'catégoría',
        type: 'text',
      });
      expect(mockDB.setQuadrant2Text).toHaveBeenCalledWith({
        text: 'naïve',
        type: 'text',
      });
    });
  });
});
