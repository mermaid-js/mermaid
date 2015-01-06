/**
 * Created by knut on 14-11-18.
 */
var sq = require('./parser/sequenceDiagram').parser;
var sd = require('./sequenceRenderer');

var str;
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
        'Alice->Bob:Hello Bob, how are you?\n' +
        'Note right of Bob: Bob thinks\n' +
        'Bob-->Alice: I am good thanks!\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(3);

        expect(messages[0].from).toBe('Alice');
        expect(messages[2].from).toBe('Bob');
    });
    it('it should space in actor names', function () {
        str = 'sequenceDiagram\n' +
        'Alice->Bob:Hello Bob, how are - you?\n' +
        'Bob-->Alice: I am good thanks!\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(2);

        expect(messages[0].from).toBe('Alice');
        expect(messages[1].from).toBe('Bob');
    });
    it('it should handle in async messages', function () {
        var str = 'sequenceDiagram\n' +
        'Alice-xBob:Hello Bob, how are you?\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        //console.log(actors);
        expect(actors.Alice.description).toBe('Alice');
        expect(actors.Bob.description).toBe('Bob');

        var messages = sq.yy.getMessages();


        expect(messages.length).toBe(1);

        expect(messages[0].type).toBe(sq.yy.LINETYPE.SOLID_CROSS);
    });
    it('it should handle in async dotted messages', function () {
        var str = 'sequenceDiagram\n' +
        'Alice--xBob:Hello Bob, how are you?\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        //console.log(actors);
        expect(actors.Alice.description).toBe('Alice');
        expect(actors.Bob.description).toBe('Bob');

        var messages = sq.yy.getMessages();


        expect(messages.length).toBe(1);

        expect(messages[0].type).toBe(sq.yy.LINETYPE.DOTTED_CROSS);
    });
    it('it should handle in arrow messages', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->>Bob:Hello Bob, how are you?\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        expect(actors.Bob.description).toBe('Bob');

        var messages = sq.yy.getMessages();
        //console.log(messages);


        expect(messages.length).toBe(1);

        expect(messages[0].type).toBe(sq.yy.LINETYPE.SOLID);
    });
    it('it should handle in arrow messages', function () {
        var str = 'sequenceDiagram\n' +
            'Alice-->>Bob:Hello Bob, how are you?\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        expect(actors.Bob.description).toBe('Bob');

        var messages = sq.yy.getMessages();
        //console.log(messages);


        expect(messages.length).toBe(1);

        expect(messages[0].type).toBe(sq.yy.LINETYPE.DOTTED);
    });
    it('it should handle comments in a sequenceDiagram', function () {
        str = 'sequenceDiagram\n' +
        'Alice->Bob: Hello Bob, how are you?\n'+
        '%% Comment\n' +
        'Note right of Bob: Bob thinks\n' +
        'Bob-->Alice: I am good thanks!\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(3);

        expect(messages[0].from).toBe('Alice');
        expect(messages[2].from).toBe('Bob');
    });

    it('it should handle new lines in a sequenceDiagram', function () {
        str = 'sequenceDiagram\n' +
        'Alice->Bob: Hello Bob, how are you?\n\n' +
        '%% Comment\n' +
        'Note right of Bob: Bob thinks\n' +
        'Bob-->Alice: I am good thanks!\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(3);

        expect(messages[0].from).toBe('Alice');
        expect(messages[2].from).toBe('Bob');
    });

    it('it should handle one leading space in lines in a sequenceDiagram', function () {
        str = 'sequenceDiagram\n' +
        ' Alice->Bob: Hello Bob, how are you?\n\n' +
        '%% Comment\n' +
        'Note right of Bob: Bob thinks\n' +
        'Bob-->Alice: I am good thanks!\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(3);

        expect(messages[0].from).toBe('Alice');
        expect(messages[2].from).toBe('Bob');
    });
    it('it should handle several leading spaces in lines in a sequenceDiagram', function () {
        str = 'sequenceDiagram\n' +
        '   Alice->Bob: Hello Bob, how are you?\n\n' +
        '%% Comment\n' +
        'Note right of Bob: Bob thinks\n' +
        'Bob-->Alice: I am good thanks!\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(3);

        expect(messages[0].from).toBe('Alice');
        expect(messages[2].from).toBe('Bob');
    });
    it('it should handle several leading spaces in lines in a sequenceDiagram', function () {
        str = 'sequenceDiagram\n'+
        'participant Alice\n'+
        'participant Bob\n'+
        'Alice->John: Hello John, how are you?\n'+
        '    loop Healthcheck\n'+
        'John->John: Fight against hypochondria\n'+
        ' end\n'+
        'Note right of John: Rational thoughts<br/>prevail...\n'+
        '    John-->Alice: Great!\n'+
        '    John->Bob: How about you?\n'+
        'Bob-->John: Jolly good!\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(8);

        expect(messages[0].from).toBe('Alice');
        expect(messages[2].from).toBe('John');
    });

    it('it should handle loop statements a sequenceDiagram', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n\n' +
            '%% Comment\n' +
            'Note right of Bob: Bob thinks\n' +
            'loop Multiple happy responses\n\n' +
            'Bob-->Alice: I am good thanks!\n' +
            'end';

        sq.parse(str);
        var actors = sq.yy.getActors();
        //console.log(actors);
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();
        //console.log(messages);

        expect(messages.length).toBe(5);
        expect(messages[0].from).toBe('Alice');
        expect(messages[1].from).toBe('Bob');


    });

    it('it should handle opt statements a sequenceDiagram', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n\n' +
            '%% Comment\n' +
            'Note right of Bob: Bob thinks\n' +
            'opt Perhaps a happy response\n\n' +
            'Bob-->Alice: I am good thanks!\n' +
            'end';

        sq.parse(str);
        var actors = sq.yy.getActors();
        //console.log(actors);
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();
        //console.log(messages);

        expect(messages.length).toBe(5);
        expect(messages[0].from).toBe('Alice');
        expect(messages[1].from).toBe('Bob');


    });
    it('it should handle opt statements a sequenceDiagram', function () {
        var str = 'sequenceDiagram;Alice->Bob: Hello Bob, how are you?;opt Perhaps a happy response;Bob-->Alice: I am good thanks!;end;';

        sq.parse(str);
        var actors = sq.yy.getActors();
        //console.log(actors);
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();
        //console.log(messages);

        expect(messages.length).toBe(4);
        expect(messages[0].from).toBe('Alice');
        expect(messages[1].type).toBe(sq.yy.LINETYPE.OPT_START);
        expect(messages[2].from).toBe('Bob');


    });

    it('it should handle alt statements a sequenceDiagram', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n\n' +
            '%% Comment\n' +
            'Note right of Bob: Bob thinks\n' +
            'alt isWell\n\n' +
            'Bob-->Alice: I am good thanks!\n' +
            'else isSick\n' +
            'Bob-->Alice: Feel sick...\n' +
            'end';

        sq.parse(str);
        var actors = sq.yy.getActors();

        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();
        //console.log(messages);

        expect(messages.length).toBe(7);
        expect(messages[0].from).toBe('Alice');
        expect(messages[1].from).toBe('Bob');


    });});

describe('when checking the bounds in a sequenceDiagram',function() {
    var parseError, _d3, conf;
    beforeEach(function () {
        sq.yy = require('./sequenceDb');
        sq.yy.clear();
        parseError = function(err, hash) {
            console.log('Syntax error:' + err);
            console.log(hash);
        };
        sq.yy.parseError = parseError;


        conf = {
            diagramMarginX:50,
            diagramMarginY:10,
            actorMargin:50,
            width:150,
            // Height of actor boxes
            height:65,
            boxMargin:10,
            messageMargin:40,
            boxTextMargin:15,
            noteMargin:25
        };
        sd.setConf(conf);
    });
    it('it should handle a simple bound call', function () {
        sd.bounds.init();

        sd.bounds.insert(100,100,200,200);

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(100);
        expect(bounds.starty).toBe(100);
        expect(bounds.stopx ).toBe(200);
        expect(bounds.stopy ).toBe(200);

    });
    it('it should handle an expanding bound', function () {
        sd.bounds.init();

        sd.bounds.insert(100,100,200,200);
        sd.bounds.insert(25,50,300,400);

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(25);
        expect(bounds.starty).toBe(50);
        expect(bounds.stopx ).toBe(300);
        expect(bounds.stopy ).toBe(400);

    });
    it('it should handle inserts within the bound without changing the outer bounds', function () {
        sd.bounds.init();

        sd.bounds.insert(100,100,200,200);
        sd.bounds.insert(25,50,300,400);
        sd.bounds.insert(125,150,150,200);

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(25);
        expect(bounds.starty).toBe(50);
        expect(bounds.stopx ).toBe(300);
        expect(bounds.stopy ).toBe(400);

    });

    it('it should handle a loop without expanding the area', function () {
        sd.bounds.init();

        sd.bounds.insert(25,50,300,400);
        sd.bounds.verticalPos  = 150;
        sd.bounds.newLoop();
        sd.bounds.insert(125,150,150,200);

        var loop = sd.bounds.endLoop();

        expect(loop.startx).toBe(125-conf.boxMargin);
        expect(loop.starty).toBe(150-conf.boxMargin);
        expect(loop.stopx ).toBe(150+conf.boxMargin);
        expect(loop.stopy ).toBe(200+conf.boxMargin);

        // Check bounds of first loop
        var bounds = sd.bounds.getBounds();

        expect(bounds.startx).toBe(25);
        expect(bounds.starty).toBe(50);
        expect(bounds.stopx ).toBe(300);
        expect(bounds.stopy ).toBe(400);
    });


    it('it should handle multiple loops withtout expanding the bounds', function () {
        sd.bounds.init();

        sd.bounds.insert(100,100,1000,1000);
        sd.bounds.verticalPos  = 200;
        sd.bounds.newLoop();
        sd.bounds.newLoop();
        sd.bounds.insert(200,200,300,300);

        // Check bounds of first loop
        var loop = sd.bounds.endLoop();

        expect(loop.startx).toBe(200-conf.boxMargin);
        expect(loop.starty).toBe(200-conf.boxMargin);
        expect(loop.stopx ).toBe(300+conf.boxMargin);
        expect(loop.stopy ).toBe(300+conf.boxMargin);

        // Check bounds of second loop
        loop = sd.bounds.endLoop();

        expect(loop.startx).toBe(200-2*conf.boxMargin);
        expect(loop.starty).toBe(200-2*conf.boxMargin);
        expect(loop.stopx ).toBe(300+2*conf.boxMargin);
        expect(loop.stopy ).toBe(300+2*conf.boxMargin);

        // Check bounds of first loop
        var bounds = sd.bounds.getBounds();

        expect(bounds.startx).toBe(100);
        expect(bounds.starty).toBe(100);
        expect(bounds.stopx ).toBe(1000);
        expect(bounds.stopy ).toBe(1000);
    });

    it('it should handle a loop that expands the area', function () {
        sd.bounds.init();

        sd.bounds.insert(100,100,200,200);
        sd.bounds.verticalPos  = 200;
        sd.bounds.newLoop();
        sd.bounds.insert(50,50,300,300);

        var loop = sd.bounds.endLoop();

        expect(loop.startx).toBe(50  - conf.boxMargin);
        expect(loop.starty).toBe(50  - conf.boxMargin);
        expect(loop.stopx ).toBe(300 + conf.boxMargin);
        expect(loop.stopy ).toBe(300 + conf.boxMargin);

        // Check bounds after the loop
        var bounds = sd.bounds.getBounds();

        expect(bounds.startx).toBe(loop.startx);
        expect(bounds.starty).toBe(loop.starty);
        expect(bounds.stopx ).toBe(loop.stopx);
        expect(bounds.stopy ).toBe(loop.stopy);
    });
});
describe('when rendering a sequenceDiagram',function() {
    var parseError, _d3, conf;
    beforeEach(function () {
        sq.yy = require('./sequenceDb');
        sq.yy.clear();
        parseError = function(err, hash) {
            console.log('Syntax error:' + err);
            console.log(hash);
        };
        sq.yy.parseError = parseError;

        function newD3() {
            var o = {
                append: function (type) {
                    return newD3();
                },
                attr: function (key, val) {
                    return this;
                },
                style: function (key, val) {
                    return this;
                },
                text: function (txt) {
                    return this;
                },
                0:{
                    0: {
                        getBBox: function () {
                            return {
                                height: 10,
                                width: 20
                            };
                        }
                    }

                }
            };

            return o;
        }

        var _d3 = {
            select:function(){
                return new newD3();
            }
        };

        d3 = _d3;

        conf = {
            diagramMarginX:50,
            diagramMarginY:10,
            actorMargin:50,
            width:150,
            // Height of actor boxes
            height:65,
            boxMargin:10,
            messageMargin:40,
            boxTextMargin:15,
            noteMargin:25
        };
        sd.setConf(conf);
    });
    it('it should handle one actor', function () {
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'participant Alice\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(0);
        expect(bounds.starty).toBe(0);
        expect(bounds.stopx ).toBe( conf.width);
        expect(bounds.stopy ).toBe(conf.height);

    });
    it('it should handle one actor and a note', function () {
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'participant Alice\n' +
            'Note left of Alice: Alice thinks\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(-(conf.width/2)-(conf.actorMargin/2));
        expect(bounds.starty).toBe(0);
        expect(bounds.stopx ).toBe( conf.width );
        // 10 comes from mock of text height
        expect(bounds.stopy ).toBe( conf.height + conf.boxMargin + 2*conf.noteMargin +10);
    });
    it('it should handle one actor and a note to the right', function () {
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'participant Alice\n' +
            'Note right of Alice: Alice thinks\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(0);
        expect(bounds.starty).toBe(0);
        expect(bounds.stopx ).toBe( (conf.width/2) + (conf.actorMargin/2) + conf.width);
        // 10 comes from mock of text height
        expect(bounds.stopy ).toBe( conf.height + conf.boxMargin + 2*conf.noteMargin +10);
    });
    it('it should handle two actors', function () {
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(0);
        expect(bounds.starty).toBe(0);
        expect(bounds.stopx ).toBe(conf.width*2 + conf.actorMargin);
        expect(bounds.stopy ).toBe(0 + conf.messageMargin + conf.height);

    });

    it('it should draw two actors and two messages', function () {
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n'+
            'Bob->Alice: Fine!\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(0);
        expect(bounds.starty).toBe(0);
        expect(bounds.stopx ).toBe(0 + conf.width*2 + conf.actorMargin);
        expect(bounds.stopy ).toBe(0 + 2*conf.messageMargin + conf.height);

    });


    it('it should draw two actors notes to the right', function () {
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n'+
            'Note right of Bob: Bob thinks\n' +
            'Bob->Alice: Fine!\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(0);
        expect(bounds.starty).toBe(0);

        var expStopX = conf.actorMargin +conf.width+ (conf.width/2) + conf.noteMargin + conf.width;

        expect(bounds.stopx ).toBe(expStopX);
        expect(bounds.stopy ).toBe(2*conf.messageMargin + conf.height + conf.boxMargin + 10+ 2*conf.noteMargin);

    });
    it('it should draw two actors notes to the left', function () {
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n'+
            'Note left of Alice: Bob thinks\n' +
            'Bob->Alice: Fine!\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe( -(conf.width/2)-(conf.actorMargin/2));
        expect(bounds.starty).toBe(0);

        expect(bounds.stopx ).toBe( conf.width*2 + conf.actorMargin);
        expect(bounds.stopy ).toBe( 2*conf.messageMargin + conf.height + conf.boxMargin +10+ 2*conf.noteMargin);

    });

    it('it should draw two loops', function () {
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n'+
            'loop Cheers\n' +
            'Bob->Alice: Fine!\n' +
            'end\n';
        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(0);
        expect(bounds.starty).toBe(0);

        expect(bounds.stopx ).toBe(0 + conf.width*2 + conf.actorMargin);
        expect(bounds.stopy ).toBe(0 + 2*conf.messageMargin + conf.height + 3*conf.boxMargin + conf.boxTextMargin);

    });
});