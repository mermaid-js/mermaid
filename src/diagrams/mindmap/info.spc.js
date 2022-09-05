describe('when parsing an info graph it', function () {
  let ex;
  beforeEach(function () {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ex = require('./parser/info').parser;
    ex.yy = require('./infoDb');
  });

  it('should handle an info definition', function () {
    let str = `info
    showInfo`;

    ex.parse(str);
  });
});
