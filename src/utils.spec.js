/**
 * Created by knut on 14-11-23.
 */

describe('when detecting chart type ',function() {
    var utils = require('./utils');
    beforeEach(function () {

    });

    it('should handle a sequence defintion', function () {
        str = 'sequence TB\nbfs1:queue';

        var type = utils.detectType(str);
        expect(type).toBe('sequence');
    });
    it('should handle a sequence defintion with leading spaces', function () {
        str = '    sequence TB\nbfs1:queue';

        var type = utils.detectType(str);
        expect(type).toBe('sequence');
    });

    it('should handle a graph defintion', function () {
        str = 'graph TB\nbfs1:queue';

        var type = utils.detectType(str);
        expect(type).toBe('graph');
    });
    it('should handle a graph defintion with leading spaces', function () {
        str = '    graph TB\nbfs1:queue';

        var type = utils.detectType(str);
        expect(type).toBe('graph');
    });

    it('should handle a graph defintion with leading spaces and newline', function () {
        str = '  \n  graph TB\nbfs1:queue';

        var type = utils.detectType(str);
        expect(type).toBe('graph');
    });
    it('should handle a sequence defintion with leading spaces and newline', function () {
        str = '  \n  sequence TB\nbfs1:queue';

        var type = utils.detectType(str);
        expect(type).toBe('sequence');
    });
});