/**
 * Created by knut on 14-11-18.
 */
describe('when parsing an info graph it',function() {
    var parseError;
    var ex;
    beforeEach(function () {
        ex = require('./parser/example').parser;
        ex.yy = require('./exampleDb');
        parseError = function(err, hash) {
            log.debug('Syntax error:' + err);
        };
        //ex.yy.parseError = parseError;
    });

    it('should handle an info definition', function () {
        var str = 'info\nsay: hello';

        ex.parse(str);
    });
    it('should handle an showMessage statement definition', function () {
        var str = 'info\nshowInfo';

        ex.parse(str);
    });
});