// @ts-ignore - jison doesn't export types
import { parser } from './parser/info.jison';
import { db } from './infoDb.js';

describe('info graph', () => {
  beforeEach(() => {
    parser.yy = db;
    parser.yy.clear();
  });

  it('should handle an info definition', () => {
    const str = `info`;
    parser.parse(str);

    expect(db.getInfo()).toBeFalsy();
  });

  it('should handle an info definition with showInfo', () => {
    const str = `info showInfo`;
    parser.parse(str);

    expect(db.getInfo()).toBeTruthy();
  });
});
