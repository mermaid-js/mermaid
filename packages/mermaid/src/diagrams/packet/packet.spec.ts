import { parser } from './parser.js';

describe('info', () => {
  it('should handle an info definition', () => {
    const str = `info`;
    expect(() => {
      parser.parse(str);
    }).not.toThrow();
  });

  it('should handle an info definition with showInfo', () => {
    const str = `info showInfo`;
    expect(() => {
      parser.parse(str);
    }).not.toThrow();
  });

  it('should throw because of unsupported info grammar', () => {
    const str = `info unsupported`;
    expect(() => {
      parser.parse(str);
    }).toThrow('Parsing failed: unexpected character: ->u<- at offset: 5, skipped 11 characters.');
  });

  it('should throw because of unsupported info grammar', () => {
    const str = `info unsupported`;
    expect(() => {
      parser.parse(str);
    }).toThrow('Parsing failed: unexpected character: ->u<- at offset: 5, skipped 11 characters.');
  });
});
