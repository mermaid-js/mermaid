import { parser } from './parser/info';
import infoDb from './infoDb';
describe('when parsing an info graph it', function () {
  var ex;
  beforeEach(function () {
    ex = parser;
    ex.yy = infoDb;
  });

  it('should handle an info definition', function () {
    var str = `info
    showInfo`;

    ex.parse(str);
  });
});
