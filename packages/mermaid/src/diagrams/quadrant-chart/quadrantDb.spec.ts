import quadrantDb from './quadrantDb.js';

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
});
