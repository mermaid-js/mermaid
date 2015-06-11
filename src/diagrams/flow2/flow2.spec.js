/**
 * Created by knut on 14-11-18.
 */
ddescribe('when parsing an info graph it',function() {
    var parseError;
    beforeEach(function () {
        ex = require('./parser/flow2').parser;
        ex.yy = require('./flow2Db');
        parseError = function(err, hash) {
            console.log('Syntax error:' + err);
        };
        //ex.yy.parseError = parseError;
    });



    it('should handle a vertex definition', function () {
        var str = 'graph TB\napa[tjo(apa)]\n';

        ex.parse(str);
    });

    it('should handle a vertex definition with escaped text', function () {
        var str = 'graph TB\napa[\"hello()\"]\n';

        ex.parse(str);
    });

    it('should handle a vertex definition with escaped text', function () {
        var str = 'graph TB\napa[\"hello[man]\"]\n';

        ex.parse(str);
    });

    it('should handle a rounded vertex definition', function () {
        var str = 'graph TB\napa(tjo apa !!!)\n';

        ex.parse(str);
    });

    it('should handle a rounded vertex definition with escaped text', function () {
        var str = 'graph TB\napa(\"hello(man)\")\n';

        ex.parse(str);
    });

    it('should handle a rounded vertex definition with escaped text', function () {
        var str = 'graph TB\napa(\"hello[man]\")\n';

        ex.parse(str);
    });

    it('should handle a circöe vertex definition', function () {
        var str = 'graph TB\napa((tjo apa !!!))\n';

        ex.parse(str);
    });

    it('should handle a rounded vertex definition with escaped text', function () {
        var str = 'graph TB\napa((\"hello(man)\"))\n';

        ex.parse(str);
    });

    it('should handle a rounded vertex definition with escaped text', function () {
        var str = 'graph TB\napa((\"hello[man]\"))\n';

        ex.parse(str);
    });

    it('should handle a diamond vertex definition', function () {
        var str = 'graph TB\napa{tjo apa !!!}\n';

        ex.parse(str);
    });

    it('should handle a diamond vertex definition with escaped text', function () {
        var str = 'graph TB\napa{\"hello(man)\"}\n';

        ex.parse(str);
    });

    it('should handle a diamond vertex definition with escaped text', function () {
        var str = 'graph TB\napa{\"hello[man]\"}\n';

        ex.parse(str);
    });
    it('should handle a odd vertex definition', function () {
        var str = 'graph TB\napa>tjo apa !!!]\n';

        ex.parse(str);
    });

    it('should handle a odd vertex definition with escaped text', function () {
        var str = 'graph TB\napa>\"hello(man)\"]\n';

        ex.parse(str);
    });

    it('should handle a odd vertex definition with escaped text', function () {
        var str = 'graph TB\napa>\"hello[man]\"]\n';

        ex.parse(str);
    });
});