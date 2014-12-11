/**
 * Created by knut on 14-11-18.
 */
var sq = require('./parser/sequence').parser;

//console.log(sq.parse('a12:d12\na24:d24'));

str = 'a12:d12\n\na24:d24';
//console.log(str);
//console.log(sq.parse(str));
//console.log(sq.parse('[]\n[]'));

str = 'bfs:queue\n\nbfs3:queue\n';
str =  str + 'bfs:message=someNode.setLevel\n';
str =  str + 'bfs:message2=someNode.setLevel2';
//console.log(str);
//console.log(sq.parse(str));

str = 'bfs:BFS\n';
str = str + 'someNode:SomeNode\n';
str = str + 'bfs:queue.new\n';
str = str + 'bfs:someNode.setLevel';
//console.log(str);
//console.log(sq.parse(str));


describe('when parsing ',function() {
    var parseError;
    beforeEach(function () {
        sq = require('./parser/sequence').parser;
        sq.yy = require('./sequenceDb');
        sq.yy.clear();
        parseError = function(err, hash) {
            console.log('Syntax error:' + err);
        };
        sq.yy.parseError = parseError;
    });

    it('should handle a sequence defintion', function () {
        str = 'sequence TB\nbfs1:queue';

        sq.parse(str);
        var actors = sq.yy.getActors();
        actors.bfs1.description = 'queue';
    });

    it('should handle an actor', function () {
        str = 'sequence TB\nbfs1:queue';

        sq.parse(str);
        var actors = sq.yy.getActors();
        actors.bfs1.description = 'queue';
    });

    it('should handle an actor with space in its description', function () {
        str = 'sequence TB\nbfs1:The queue\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        actors.bfs1.description = 'queue';
    });

    it('should handle a statement ending with a newline', function () {
        str = 'sequence TB\nbfs1:queue\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        actors.bfs1.description = 'queue';
    });

    xit('should handle a errors', function () {
        str = 'sequence TB\nbfs1!!!!queue\n';

        spyOn('sq.yy',parseError);
        sq.parse(str);

        //expect(sq.yy.parseError).toHaveBeenCalled();
    });

    it('should handle multiple actors', function () {
        str = 'sequence TB\nbfs1:queue\n\nbfs2:queue';

        sq.parse(str);
        var actors = sq.yy.getActors();
        actors.bfs1.description = 'queue';
        actors.bfs2.description = 'queue';
    });

    it('should handle a message with response', function () {
        str = 'sequence TB\nbfs1:queue\n\nbfs2:queue\n';
        str =  str + 'bfs1:message=bfs2.setLevel(0)';
        //console.log(str);
        sq.parse(str);
        var messages = sq.yy.getMessages();
        expect(messages.length).toBe(1);
        expect(messages[0].from).toBe('bfs1');
    });

    it('should handle a message with no response', function () {
        str = 'sequence TB\nbfs1:queue\n\nbfs2:queue\n';
        str =  str + 'bfs1:bfs2.start';
        //console.log(str);
        sq.parse(str);
        var messages = sq.yy.getMessages();
        expect(messages.length).toBe(1);
        expect(messages[0].from).toBe('bfs1');
    });
});