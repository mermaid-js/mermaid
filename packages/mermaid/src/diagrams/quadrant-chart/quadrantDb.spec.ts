import quadrantDb from './quadrantDb.js';
// @ts-ignore: JISON doesn't support types
import parser from './parser/quadrant.jison';

describe('quadrant unit tests', () => {
  it('should parse the styles array and return a StylesObject', () => {
    const styles = ['radius: 10', 'color: #ff0000', 'stroke-color: #ff00ff', 'stroke-width: 10px'];
    const result = quadrantDb.parseStyles(styles);

    expect(result).toEqual({
      radius: 10,
      color: '#ff0000',
      strokeColor: '#ff00ff',
      strokeWidth: '10px',
    });
  });

  it('should throw an error for non supported style name', () => {
    const styles: string[] = ['test_name: value'];
    expect(() => quadrantDb.parseStyles(styles)).toThrowError(
      'style named test_name is not supported.'
    );
  });

  it('should return an empty StylesObject for an empty input array', () => {
    const styles: string[] = [];
    const result = quadrantDb.parseStyles(styles);
    expect(result).toEqual({});
  });

  it('should throw an error for non supported style value', () => {
    let styles: string[] = ['radius: f'];
    expect(() => quadrantDb.parseStyles(styles)).toThrowError(
      'value for radius f is invalid, please use a valid number'
    );

    styles = ['color: ffaa'];
    expect(() => quadrantDb.parseStyles(styles)).toThrowError(
      'value for color ffaa is invalid, please use a valid hex code'
    );

    styles = ['stroke-color: #f677779'];
    expect(() => quadrantDb.parseStyles(styles)).toThrowError(
      'value for stroke-color #f677779 is invalid, please use a valid hex code'
    );

    styles = ['stroke-width: 30'];
    expect(() => quadrantDb.parseStyles(styles)).toThrowError(
      'value for stroke-width 30 is invalid, please use a valid number of pixels (eg. 10px)'
    );
  });
  it('should store long quadrant titles correctly (wrap handled in renderer)', () => {
    const input = `
    quadrantChart
      quadrant-1 "🔥 This is a very long quadrant title that should wrap properly inside the box"
      quadrant-2 "💡 Another long label that should be parsed fully"
      quadrant-3 "Short"
      quadrant-4 "🚀 Final test case with long label"
  `;

    quadrantDb.clear();
    parser.yy = quadrantDb;
    parser.parse(input);

    expect(quadrantDb.getQuadrantData().quadrants[0].text.text).toBe(
      '🔥 This is a very long quadrant title that should wrap properly inside the box'
    );
    expect(quadrantDb.getQuadrantData().quadrants[1].text.text).toBe(
      '💡 Another long label that should be parsed fully'
    );
    expect(quadrantDb.getQuadrantData().quadrants[2].text.text).toBe('Short');
    expect(quadrantDb.getQuadrantData().quadrants[3].text.text).toBe(
      '🚀 Final test case with long label'
    );
  });
});
