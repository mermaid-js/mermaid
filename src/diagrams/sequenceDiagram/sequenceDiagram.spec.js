var proxyquire = require('proxyquire');
/**
 * Created by knut on 14-11-18.
 */
//var proxyquire = require('proxyquire');
//var log = require('../../logger').create();

var sq = require('./parser/sequenceDiagram').parser;
var newD3;

var d3 = {
    select:function(){
        return new newD3();
    },
    selectAll:function(){
        return new newD3();
    }
};
//var sd = proxyquire('./sequenceRenderer', { './d3': d3 });
var sd = proxyquire('./sequenceRenderer', { '../../d3': d3 });

//
//
//var sd = require('./sequenceRenderer');

function addConf(conf, key, value) {
  if (value !== undefined) {
    conf[key]=value;
  }
  return conf;
}

var str;
describe('when parsing a sequenceDiagram',function() {
    beforeEach(function () {
        sq.yy = require('./sequenceDb');
        sq.yy.clear();
        //parseError = function(err, hash) {
        //    log.debug('Syntax error:' + err);
        //    log.debug(hash);
        //};
        //sq.yy.parseError = parseError;
    });
    it('it should handle a sequenceDiagram defintion', function () {
        str = 'sequenceDiagram\n' +
        'Alice->Bob:Hello Bob, how are you?\n' +
        'Note right of Bob: Bob thinks\n' +
        'Bob-->Alice: I am good thanks!';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(3);
        expect(messages[0].from).toBe('Alice');
        expect(messages[2].from).toBe('Bob');
    });
		it('it should handle a sequenceDiagram definition with a title', function () {
        str = 'sequenceDiagram\n' +
        'title: Diagram Title\n' + 
        'Alice->Bob:Hello Bob, how are you?\n' +
        'Note right of Bob: Bob thinks\n' +
        'Bob-->Alice: I am good thanks!';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();
        var title = sq.yy.getTitle();

        expect(messages.length).toBe(3);
        expect(messages[0].from).toBe('Alice');
        expect(messages[2].from).toBe('Bob');
        expect(title).toBe('Diagram Title');
    });
    it('it should space in actor names', function () {
        str = 'sequenceDiagram\n' +
        'Alice->Bob:Hello Bob, how are - you?\n' +
        'Bob-->Alice: I am good thanks!';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(2);
        expect(messages[0].from).toBe('Alice');
        expect(messages[1].from).toBe('Bob');
    });
    it('it should alias participants', function () {
        str = 'sequenceDiagram\n' +
            'participant A as Alice\n' +
            'participant B as Bob\n' +
            'A->B:Hello Bob, how are you?\n' +
            'B-->A: I am good thanks!';

        sq.parse(str);

        var actors = sq.yy.getActors();
        expect(Object.keys(actors)).toEqual(['A', 'B']);
        expect(actors.A.description).toBe('Alice');
        expect(actors.B.description).toBe('Bob');

        var messages = sq.yy.getMessages();
        expect(messages.length).toBe(2);
        expect(messages[0].from).toBe('A');
        expect(messages[1].from).toBe('B');
    });
    it('it should handle in async messages', function () {
        var str = 'sequenceDiagram\n' +
        'Alice-xBob:Hello Bob, how are you?';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        expect(actors.Bob.description).toBe('Bob');

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(1);
        expect(messages[0].type).toBe(sq.yy.LINETYPE.SOLID_CROSS);
    });
    it('it should handle in async dotted messages', function () {
        var str = 'sequenceDiagram\n' +
        'Alice--xBob:Hello Bob, how are you?';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        expect(actors.Bob.description).toBe('Bob');

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(1);
        expect(messages[0].type).toBe(sq.yy.LINETYPE.DOTTED_CROSS);
    });
    it('it should handle in arrow messages', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->>Bob:Hello Bob, how are you?';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        expect(actors.Bob.description).toBe('Bob');

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(1);
        expect(messages[0].type).toBe(sq.yy.LINETYPE.SOLID);
    });
    it('it should handle in arrow messages', function () {
        var str = 'sequenceDiagram\n' +
          'Alice-->>Bob:Hello Bob, how are you?';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        expect(actors.Bob.description).toBe('Bob');

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(1);
        expect(messages[0].type).toBe(sq.yy.LINETYPE.DOTTED);
    });
    it('it should handle actor activation', function () {
        var str = 'sequenceDiagram\n' +
          'Alice-->>Bob:Hello Bob, how are you?\n' +
          'activate Bob\n' +
          'Bob-->>Alice:Hello Alice, I\'m fine and  you?\n' +
          'deactivate Bob';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        expect(actors.Bob.description).toBe('Bob');

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(4);
        expect(messages[0].type).toBe(sq.yy.LINETYPE.DOTTED);
        expect(messages[1].type).toBe(sq.yy.LINETYPE.ACTIVE_START);
        expect(messages[1].from.actor).toBe('Bob');
        expect(messages[2].type).toBe(sq.yy.LINETYPE.DOTTED);
        expect(messages[3].type).toBe(sq.yy.LINETYPE.ACTIVE_END);
        expect(messages[3].from.actor).toBe('Bob');
    });
    it('it should handle actor one line notation activation', function () {
        var str = 'sequenceDiagram\n' +
          'Alice-->>+Bob:Hello Bob, how are you?\n' +
          'Bob-->>- Alice:Hello Alice, I\'m fine and  you?';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        expect(actors.Bob.description).toBe('Bob');

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(4);
        console.log('msg', messages[0]);
        expect(messages[0].type).toBe(sq.yy.LINETYPE.DOTTED);
        console.log('msg', messages[1]);
        expect(messages[1].type).toBe(sq.yy.LINETYPE.ACTIVE_START);
        expect(messages[1].from.actor).toBe('Bob');
        console.log('msg', messages[2]);
        expect(messages[2].type).toBe(sq.yy.LINETYPE.DOTTED);
        console.log('msg', messages[3]);
        expect(messages[3].type).toBe(sq.yy.LINETYPE.ACTIVE_END);
        expect(messages[3].from.actor).toBe('Bob');
    });
    it('it should handle stacked activations', function () {
        var str = 'sequenceDiagram\n' +
          'Alice-->>+Bob:Hello Bob, how are you?\n' +
          'Bob-->>+Carol:Carol, let me introduce Alice?\n' +
          'Bob-->>- Alice:Hello Alice, please meet Carol?\n' +
          'Carol->>- Bob:Oh Bob, I\'m so happy to be here!';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        expect(actors.Bob.description).toBe('Bob');

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(8);
        console.log('msg', messages[0]);
        expect(messages[0].type).toBe(sq.yy.LINETYPE.DOTTED);
        console.log('msg', messages[1]);
        expect(messages[1].type).toBe(sq.yy.LINETYPE.ACTIVE_START);
        expect(messages[1].from.actor).toBe('Bob');
        console.log('msg', messages[2]);
        expect(messages[2].type).toBe(sq.yy.LINETYPE.DOTTED);
        console.log('msg', messages[3]);
        expect(messages[3].type).toBe(sq.yy.LINETYPE.ACTIVE_START);
        expect(messages[3].from.actor).toBe('Carol');
        console.log('msg', messages[5]);
        expect(messages[5].type).toBe(sq.yy.LINETYPE.ACTIVE_END);
        expect(messages[5].from.actor).toBe('Bob');
        console.log('msg', messages[7]);
        expect(messages[7].type).toBe(sq.yy.LINETYPE.ACTIVE_END);
        expect(messages[7].from.actor).toBe('Carol');
    });
    it('it should handle comments in a sequenceDiagram', function () {
        str = 'sequenceDiagram\n' +
        'Alice->Bob: Hello Bob, how are you?\n'+
        '%% Comment\n' +
        'Note right of Bob: Bob thinks\n' +
        'Bob-->Alice: I am good thanks!';

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
    it('it should handle semicolons', function () {
        str = 'sequenceDiagram;' +
        'Alice->Bob: Hello Bob, how are you?;' +
        'Note right of Bob: Bob thinks;' +
        'Bob-->Alice: I am good thanks!;';

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
        'Bob-->Alice: I am good thanks!';

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
        'Bob-->Alice: I am good thanks!';

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
        'Bob-->John: Jolly good!';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(8);
        expect(messages[0].from).toBe('Alice');
        expect(messages[2].from).toBe('John');
    });
    it('it should handle notes over a single actor', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n' +
            'Note over Bob: Bob thinks\n';

        sq.parse(str);

        var messages = sq.yy.getMessages();
        expect(messages[1].from).toBe('Bob');
        expect(messages[1].to).toBe('Bob');
    });
    it('it should handle notes over multiple actors', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n' +
            'Note over Alice,Bob: confusion\n' +
            'Note over Bob,Alice: resolution\n';

        sq.parse(str);

        var messages = sq.yy.getMessages();
        expect(messages[1].from).toBe('Alice');
        expect(messages[1].to).toBe('Bob');
        expect(messages[2].from).toBe('Bob');
        expect(messages[2].to).toBe('Alice');
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
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

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
        expect(actors.Alice.description).toBe('Alice');
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(5);
        expect(messages[0].from).toBe('Alice');
        expect(messages[1].from).toBe('Bob');
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

        expect(messages.length).toBe(7);
        expect(messages[0].from).toBe('Alice');
        expect(messages[1].from).toBe('Bob');
    });
    it('it should handle special characters in signals', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: -:<>,;# comment';

        sq.parse(str);

        var messages = sq.yy.getMessages();
        expect(messages[0].message).toBe('-:<>,');
    });
    it('it should handle special characters in notes', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n' +
            'Note right of Bob: -:<>,;# comment';

        sq.parse(str);

        var messages = sq.yy.getMessages();
        expect(messages[1].message).toBe('-:<>,');
    });
    it('it should handle special characters in loop', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n' +
            'loop -:<>,;# comment\n' +
            'Bob-->Alice: I am good thanks!\n' +
            'end';

        sq.parse(str);

        var messages = sq.yy.getMessages();
        expect(messages[1].message).toBe('-:<>,');
    });
    it('it should handle special characters in opt', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n' +
            'opt -:<>,;# comment\n' +
            'Bob-->Alice: I am good thanks!\n' +
            'end';

        sq.parse(str);

        var messages = sq.yy.getMessages();
        expect(messages[1].message).toBe('-:<>,');
    });
    it('it should handle special characters in alt', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n' +
            'alt -:<>,;# comment\n' +
            'Bob-->Alice: I am good thanks!\n' +
            'else ,<>:-#; comment\n' +
            'Bob-->Alice: I am good thanks!\n' +
            'end';

        sq.parse(str);

        var messages = sq.yy.getMessages();
        expect(messages[1].message).toBe('-:<>,');
        expect(messages[3].message).toBe(',<>:-');
    });
    it('it should handle no-label loop', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n' +
            'loop\n' +
            'Bob-->Alice: I am good thanks!\n' +
            'end';

        sq.parse(str);

        var messages = sq.yy.getMessages();
        expect(messages[1].message).toBe('');
        expect(messages[2].message).toBe('I am good thanks!');
    });
    it('it should handle no-label opt', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n' +
            'opt # comment\n' +
            'Bob-->Alice: I am good thanks!\n' +
            'end';

        sq.parse(str);

        var messages = sq.yy.getMessages();
        expect(messages[1].message).toBe('');
        expect(messages[2].message).toBe('I am good thanks!');
    });
    it('it should handle no-label alt', function () {
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n' +
            'alt;' +
            'Bob-->Alice: I am good thanks!\n' +
            'else # comment\n' +
            'Bob-->Alice: I am good thanks!\n' +
            'end';

        sq.parse(str);

        var messages = sq.yy.getMessages();
        expect(messages[1].message).toBe('');
        expect(messages[2].message).toBe('I am good thanks!');
        expect(messages[3].message).toBe('');
        expect(messages[4].message).toBe('I am good thanks!');
    });
});

describe('when checking the bounds in a sequenceDiagram',function() {
    var conf;
    beforeEach(function () {
        sq.yy = require('./sequenceDb');
        sq.yy.clear();
        //parseError = function(err, hash) {
        //    log.debug('Syntax error:' + err);
        //    log.debug(hash);
        //};
        //sq.yy.parseError = parseError;


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
    var conf;
    beforeEach(function () {
        sq.yy = require('./sequenceDb');
        sq.yy.clear();

        //var MockBrowser = require('mock-browser').mocks.MockBrowser;
        //var mock = new MockBrowser();

        delete global.mermaid_config;

        // and in the run-code inside some object
        //global.document = mock.getDocument();
        //global.window = mock.getWindow();

        //parseError = function(err, hash) {
        //    log.debug('Syntax error:' + err);
        //    log.debug(hash);
        //};
        //sq.yy.parseError = parseError;

        newD3 = function() {
            var o = {
                append: function () {
                    return newD3();
                },
                attr: function () {
                    return this;
                },
                style: function () {
                    return this;
                },
                text: function () {
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
        };

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
        //document.body.innerHTML = '<div id="tst"></div>';
        //document.body.innerHTML = '<svg height="30" width="200"><text id="tst" x="0" y="15" fill="red">I love SVG!</text></svg>';
        //document.body.innerHTML = '<svg height="30" width="200"><text x="0" y="15" fill="red"><tspan x="46" id="tst">Alice thinks</tspan></text></svg>';
        //console.log('document.body');
        //console.log(document.querySelector('#tst').getBBox());

    });
    ['tspan','fo','old',undefined].forEach(function(textPlacement) {
      it('it should handle one actor, when textPlacement is '+textPlacement, function () {
        sd.setConf(addConf(conf, 'textPlacement', textPlacement));
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'participant Alice';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(0);
        expect(bounds.starty).toBe(0);
        expect(bounds.stopx ).toBe( conf.width);
        expect(bounds.stopy ).toBe(conf.height);
      });
    });
    it('it should handle one actor and a centered note', function () {
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'participant Alice\n' +
            'Note over Alice: Alice thinks\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(0);
        expect(bounds.starty).toBe(0);
        expect(bounds.stopx ).toBe( conf.width);
        // 10 comes from mock of text height
        expect(bounds.stopy ).toBe( conf.height + conf.boxMargin + 2*conf.noteMargin +10);
    });
    it('it should handle one actor and a note to the left', function () {
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'participant Alice\n' +
            'Note left of Alice: Alice thinks';

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
            'Note right of Alice: Alice thinks';

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
            'Alice->Bob: Hello Bob, how are you?';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(0);
        expect(bounds.starty).toBe(0);
        expect(bounds.stopx ).toBe(conf.width*2 + conf.actorMargin);
        expect(bounds.stopy ).toBe(0 + conf.messageMargin + conf.height);
    });
    it('it should handle two actors and two centered shared notes', function () {
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n'+
            'Note over Alice,Bob: Looks\n' +
            'Note over Bob,Alice: Looks back\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(0);
        expect(bounds.starty).toBe(0);
        expect(bounds.stopx ).toBe(conf.width*2 + conf.actorMargin);
        expect(bounds.stopy ).toBe( conf.height + conf.messageMargin + 2*(conf.boxMargin + 2*conf.noteMargin + 10));
    });
    it('it should draw two actors and two messages', function () {
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n'+
            'Bob->Alice: Fine!';

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
            'Bob->Alice: Fine!';

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
            'Bob->Alice: Fine!';

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
            'end';
        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(0);
        expect(bounds.starty).toBe(0);

        expect(bounds.stopx ).toBe(0 + conf.width*2 + conf.actorMargin);
        expect(bounds.stopy ).toBe(0 + 2*conf.messageMargin + conf.height + 3*conf.boxMargin + conf.boxTextMargin);

    });
});

describe('when rendering a sequenceDiagram with actor mirror activated',function() {
    var conf;
    beforeEach(function () {
        sq.yy = require('./sequenceDb');
        sq.yy.clear();
        //parseError = function(err, hash) {
        //    log.debug('Syntax error:' + err);
        //    log.debug(hash);
        //};
        //sq.yy.parseError = parseError;

        newD3 = function() {
            var o = {
                append: function () {
                    return newD3();
                },
                attr: function () {
                    return this;
                },
                style: function () {
                    return this;
                },
                text: function () {
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
        };

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
            noteMargin:25,
            mirrorActors:true,
            // Depending on css styling this might need adjustment
            // Prolongs the edge of the diagram downwards
            bottomMarginAdj:1
        };
        sd.setConf(conf);
    });
    ['tspan','fo','old',undefined].forEach(function(textPlacement) {
      it('it should handle one actor, when textPlacement is'+textPlacement, function () {
        sd.setConf(addConf(conf, 'textPlacement', textPlacement));
        sd.bounds.init();
        var str = 'sequenceDiagram\n' +
            'participant Alice';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(0);
        expect(bounds.starty).toBe(0);
        expect(bounds.stopx ).toBe( conf.width);
        expect(bounds.stopy ).toBe(2*conf.height+2*conf.boxMargin);
      });
    });
});
