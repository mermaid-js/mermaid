// @ts-ignore Jison doesn't export types
import { parser } from './parser/info.jison';
import infoDb from './infoDb.js';

describe('info graph', () => {
  beforeEach(() => {
    parser.yy = infoDb;
    parser.yy.clear();
  });

  it('should handle an info definition', () => {
    const str = `info`;
    parser.parse(str);

    expect(infoDb.getInfo()).toBeFalsy();
  });

  it('should handle an info definition with showInfo', () => {
    const str = `info showInfo`;
    parser.parse(str);

    expect(infoDb.getInfo()).toBeTruthy();
  });
});
