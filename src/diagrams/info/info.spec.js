/* eslint-env jasmine */
describe('when parsing an info graph it', function() {
  var ex;
  beforeEach(function() {
    ex = require('./parser/info').parser;
    ex.yy = require('./infoDb');
  });

  it('should handle an info definition', function() {
    var str = `info
    showInfo`;

    ex.parse(str);
  });
});
