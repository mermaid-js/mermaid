/**
 * Created by knut on 14-11-18.
 */
describe('when parsing a gantt diagram it',function() {
    var parseError, gantt;
    beforeEach(function () {
        gantt = require('./parser/gantt').parser;
        gantt.yy = require('./ganttDb');
        parseError = function(err, hash) {
            console.log('Syntax error:' + err);
        };
        //ex.yy.parseError = parseError;
    });

    it('should handle an dateFormat definition', function () {
        var str = 'gantt\ndateFormat yyyy-mm-dd';

        gantt.parse(str);
    });
    it('should handle an dateFormat definition', function () {
        var str = 'gantt\ntitle Adding gantt diagram functionality to mermaid';

        gantt.parse(str);
    });
    it('should handle an dateFormat definition', function () {
        var str = 'gantt\ntitle Adding gantt diagram functionality to mermaid';

        gantt.parse(str);
    });
    it('should handle an dateFormat definition', function () {
        var str = 'gantt\nsection Documentation';

        gantt.parse(str);
    });
    it('should handle an dateFormat definition', function () {
        var str = 'gantt\n' +
            'section Documentation\n' +
            //'section Documentation2\n';
            //'Design jison grammar :';
            'Design jison grammar:des1, 2014-01-01, 2014-01-04';

        gantt.parse(str);
    });
});

// Ogiltigt id i after id
