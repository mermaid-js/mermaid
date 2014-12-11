/**
 * Created by knut on 14-11-18.
 */
var sq = require('./parser/sequenceDiagram').parser;

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


describe('when parsing a sequenceDiagram',function() {
    var parseError;
    beforeEach(function () {
        sq.yy = require('./sequenceDb');
        sq.yy.clear();
        parseError = function(err, hash) {
            console.log('Syntax error:' + err);
            console.log(hash);
        };
        sq.yy.parseError = parseError;
    });

    it('it should handle a sequenceDiagram defintion', function () {
        str = 'sequenceDiagram\n' +
        'Alice->Bob: Hello Bob, how are you?\n' +
        'Note right of Bob: Bob thinks\n' +
        'Bob-->Alice: I am good thanks!\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice).ToBdescription = 'Alice';
        actors.Bob.description = 'Bob';

        //console.log('actors');
        //console.log(actors);

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(2);
        //console.log('messages');
        //console.log(messages);
        expect(messages[0].from).toBe('Alice');
        expect(messages[1].from).toBe('Bob');
    });

});