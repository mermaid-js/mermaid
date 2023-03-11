import { parser } from './parser/info.js';
import infoDb from './infoDb.js';
describe('when parsing an info graph it', function () {
  let ex;
  beforeEach(function () {
    ex = parser;
    ex.yy = infoDb;
  });

  it('should handle an info definition', function () {
    let str = `info
    showInfo`;

    ex.parse(str);
  });
});
