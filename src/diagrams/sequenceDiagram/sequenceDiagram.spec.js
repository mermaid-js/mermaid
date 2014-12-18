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
        'Alice->Bob: Hello Bob, how are you?\n' +
        'Note right of Bob: Bob thinks\n' +
        'Bob-->Alice: I am good thanks!\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice).ToBdescription = 'Alice';
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(3);

        expect(messages[0].from).toBe('Alice');
        expect(messages[2].from).toBe('Bob');
    });
    it('it should handle comments in a sequenceDiagram', function () {
        str = 'sequenceDiagram\n' +
        'Alice->Bob: Hello Bob, how are you?\n' +
        '%% Comment\n' +
        'Note right of Bob: Bob thinks\n' +
        'Bob-->Alice: I am good thanks!\n';

        sq.parse(str);
        var actors = sq.yy.getActors();
        expect(actors.Alice).ToBdescription = 'Alice';
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
        expect(actors.Alice).ToBdescription = 'Alice';
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(3);

        expect(messages[0].from).toBe('Alice');
        expect(messages[2].from).toBe('Bob');
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
        expect(actors.Alice).ToBdescription = 'Alice';
        actors.Bob.description = 'Bob';

        var messages = sq.yy.getMessages();

        expect(messages.length).toBe(5);

        expect(messages[0].from).toBe('Alice');
        expect(messages[3].from).toBe('Bob');


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
            margin:50,
            width:150,
            // Height of actor boxes
            height:65,
            loopMargin:10,
            messageMargin:40,
            noteMargin:25
        };
        sd.setConf(conf);
    });
    it('it should handle two actors', function () {
        sd.bounds.init();
        sd.bounds.newLoop(0);
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(conf.diagramMarginX);
        expect(bounds.starty).toBe(conf.diagramMarginY);
        expect(bounds.stopx ).toBe(conf.diagramMarginX + conf.width*2 + conf.margin);
        expect(bounds.stopy ).toBe(conf.diagramMarginY + conf.messageMargin + conf.height);

    });

    it('it should draw two actors and two messages', function () {
        sd.bounds.init();
        sd.bounds.newLoop(0);
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n'+
            'Bob->Alice: Fine!\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(conf.diagramMarginX);
        expect(bounds.starty).toBe(conf.diagramMarginY);
        expect(bounds.stopx ).toBe(conf.diagramMarginX + conf.width*2 + conf.margin);
        expect(bounds.stopy ).toBe(conf.diagramMarginY + 2*conf.messageMargin + conf.height);

    });


    it('it should draw two actors notes to the right', function () {
        sd.bounds.init();
        sd.bounds.newLoop(0);
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n'+
            'Note right of Bob: Bob thinks\n' +
            'Bob->Alice: Fine!\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(conf.diagramMarginX);
        expect(bounds.starty).toBe(conf.diagramMarginY);

        var expStopX = conf.diagramMarginX  + conf.messageMargin +conf.width+ (conf.width/2) + conf.noteMargin + conf.width;

        expect(bounds.stopx ).toBe(expStopX);
        expect(bounds.stopy ).toBe(conf.diagramMarginY + 3*conf.messageMargin + conf.height);

    });
    it('it should draw two actors notes to the left', function () {
        sd.bounds.init();
        sd.bounds.newLoop(0);
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n'+
            'Note left of Alice: Bob thinks\n' +
            'Bob->Alice: Fine!\n';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(conf.diagramMarginX - conf.width + conf.margin);
        expect(bounds.starty).toBe(conf.diagramMarginY);

        expect(bounds.stopx ).toBe(conf.diagramMarginX + conf.width*2 + conf.margin);
        expect(bounds.stopy ).toBe(conf.diagramMarginY + 3*conf.messageMargin + conf.height);

    });

    it('it should draw two loops', function () {
        sd.bounds.init();
        sd.bounds.newLoop(0);
        var str = 'sequenceDiagram\n' +
            'Alice->Bob: Hello Bob, how are you?\n'+
            'loop Cheers\n' +
            'Bob->Alice: Fine!\n' +
            'end';

        sq.parse(str);
        sd.draw(str,'tst');

        var bounds = sd.bounds.getBounds();
        expect(bounds.startx).toBe(conf.diagramMarginX);
        expect(bounds.starty).toBe(conf.diagramMarginY);

        expect(bounds.stopx ).toBe(conf.diagramMarginX + conf.width*2 + conf.margin);
        expect(bounds.stopy ).toBe(conf.diagramMarginY + 3*conf.messageMargin + conf.height);

    });
});