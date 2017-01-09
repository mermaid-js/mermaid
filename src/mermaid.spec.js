/**
 * Created by knut on 14-11-26.
 */
/**
 * Created by knut on 14-11-23.
 */
//var rewire = require('rewire');
var mermaid = require('./mermaid');
//var log = require('./logger').create();

describe('when using mermaid and ',function() {
    describe('when detecting chart type ',function() {
        //var mermaid;
        //var document;
        //var window;
        beforeEach(function () {
            //var MockBrowser = require('mock-browser').mocks.MockBrowser;
            //var mock = new MockBrowser();
            //
            //delete global.mermaid_config;
            //
            //// and in the run-code inside some object
            //global.document = mock.getDocument();
            //global.window = mock.getWindow();

        });

        it('should not start rendering with mermaid_config.startOnLoad set to false', function () {
            //mermaid = rewire('./mermaid');
            global.mermaid_config ={startOnLoad : false};

            document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
            spyOn(global.mermaid,'init');
            //log.debug(mermaid);
            mermaid.contentLoaded();
            expect(global.mermaid.init).not.toHaveBeenCalled();
        });

        it('should not start rendering with mermaid.startOnLoad set to false', function () {
            //mermaid = rewire('./mermaid');
            global.mermaid.startOnLoad =  false;
            global.mermaid_config ={startOnLoad : true};

            document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
            spyOn(global.mermaid,'init');
            mermaid.contentLoaded();
            expect(global.mermaid.init).not.toHaveBeenCalled();
        });

        it('should start rendering with both startOnLoad set', function () {
            //mermaid = rewire('./mermaid');
            global.mermaid.startOnLoad =  true;
            global.mermaid_config ={startOnLoad : true};
            document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
            spyOn(global.mermaid,'init');
            mermaid.contentLoaded();
            expect(global.mermaid.init).toHaveBeenCalled();
        });

        it('should start rendering with mermaid.startOnLoad set and no mermaid_config defined', function () {
            //mermaid = rewire('./mermaid');
            global.mermaid.startOnLoad =  true;
            document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
            spyOn(global.mermaid,'init');
            mermaid.contentLoaded();
            expect(global.mermaid.init).toHaveBeenCalled();
        });

        it('should start rendering as a default with no changes performed', function () {
            //mermaid = rewire('./mermaid');
            document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
            spyOn(global.mermaid,'init');
            mermaid.contentLoaded();
            expect(global.mermaid.init).toHaveBeenCalled();
        });

    });

    describe('when calling addEdges ',function() {
        var graph = require('./diagrams/flowchart/graphDb');
        var flow = require('./diagrams/flowchart/parser/flow');
        var flowRend = require('./diagrams/flowchart/flowRenderer');

        beforeEach(function () {
            global.mermaid_config ={startOnLoad : false};
            //var MockBrowser = require('mock-browser').mocks.MockBrowser;
            //var mock = new MockBrowser();
            flow.parser.yy =graph;
            graph.clear();
            //global.document = mock.getDocument();
            //mermaid = rewire('./mermaid');
        });
        it('it should handle edges with text', function () {
            flow.parser.parse('graph TD;A-->|text ex|B;');
            flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            var mockG = {
                setEdge:function(start, end,options){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('normal');
                    expect(options.label.match('text ex')).toBeTruthy();
                }
            };

            flowRend.addEdges(edges,mockG);
        });

        it('should handle edges without text', function () {
            flow.parser.parse('graph TD;A-->B;');
            flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            var mockG = {
                setEdge:function(start, end,options){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('normal');
                }
            };

            flowRend.addEdges(edges,mockG);
        });


        it('should handle open-ended edges', function () {
            flow.parser.parse('graph TD;A---B;');
            flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            var mockG = {
                setEdge:function(start, end,options){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('none');
                }
            };

            flowRend.addEdges(edges,mockG);
        });

        it('should handle edges with styles defined', function () {
            flow.parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2;');
            flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            var mockG = {
                setEdge:function(start, end,options){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('none');
                    expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;');
                }
            };

            flowRend.addEdges(edges,mockG);
        });
        it('should handle edges with interpolation defined', function () {
            flow.parser.parse('graph TD;A---B; linkStyle 0 interpolate basis');
            flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            var mockG = {
                setEdge:function(start, end,options){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('none');
                    expect(options.lineInterpolate).toBe('basis');
                }
            };

            flowRend.addEdges(edges,mockG);
        });
        it('should handle edges with text and styles defined', function () {
            flow.parser.parse('graph TD;A---|the text|B; linkStyle 0 stroke:val1,stroke-width:val2;');
            flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            var mockG = {
                setEdge:function(start, end,options){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('none');
                    expect(options.label.match('the text')).toBeTruthy();
                    expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;');
                }
            };

            flowRend.addEdges(edges,mockG);
        });

        it('should set fill to "none" by default when handling edges', function () {
            flow.parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2;');
            flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            var mockG = {
                setEdge:function(start, end,options){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('none');
                    expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;');
                }
            };

            flowRend.addEdges(edges,mockG);
        });

        it('should not set fill to none if fill is set in linkStyle', function () {
            flow.parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2,fill:blue;');
            flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();
            var mockG = {
                setEdge:function(start, end,options){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('none');
                    expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:blue;');
                }
            };

            flowRend.addEdges(edges,mockG);
        });
    });

    describe('checking validity of input ', function(){
        it('it should return false for an invalid definiton',function(){
            spyOn(global.mermaid,'parseError');
            var res = mermaid.parse('this is not a mermaid diagram definition');

            expect(res).toBe(false);
            expect(global.mermaid.parseError).toHaveBeenCalled();
        });

        it('it should return true for a valid flow definition',function(){
            spyOn(global.mermaid,'parseError');
            var res = mermaid.parse('graph TD;A--x|text including URL space|B;');

            expect(res).toBe(true);
            expect(global.mermaid.parseError).not.toHaveBeenCalled();
        });
        it('it should return false for an invalid flow definition',function(){
            spyOn(global.mermaid,'parseError');
            var res = mermaid.parse('graph TQ;A--x|text including URL space|B;');

            expect(res).toBe(false);
            expect(global.mermaid.parseError).toHaveBeenCalled();
        });

        it('it should return true for a valid sequenceDiagram definition',function(){
            spyOn(global.mermaid,'parseError');
            var str = 'sequenceDiagram\n' +
                'Alice->Bob: Hello Bob, how are you?\n\n' +
                '%% Comment\n' +
                'Note right of Bob: Bob thinks\n' +
                'alt isWell\n\n' +
                'Bob-->Alice: I am good thanks!\n' +
                'else isSick\n' +
                'Bob-->Alice: Feel sick...\n' +
                'end';
            var res = mermaid.parse(str);

            expect(res).toBe(true);
            expect(global.mermaid.parseError).not.toHaveBeenCalled();
        });

        it('it should return false for an invalid sequenceDiagram definition',function(){
            spyOn(global.mermaid,'parseError');
            var str = 'sequenceDiagram\n' +
                'Alice:->Bob: Hello Bob, how are you?\n\n' +
                '%% Comment\n' +
                'Note right of Bob: Bob thinks\n' +
                'alt isWell\n\n' +
                'Bob-->Alice: I am good thanks!\n' +
                'else isSick\n' +
                'Bob-->Alice: Feel sick...\n' +
                'end';
            var res = mermaid.parse(str);

            expect(res).toBe(false);
            expect(global.mermaid.parseError).toHaveBeenCalled();
        });

        it('it should return true for a valid dot definition',function(){
            spyOn(global.mermaid,'parseError');
            var res = mermaid.parse('digraph\n' +
            '{\n' +
            ' a -> b -> c -- d -> e;\n' +
            ' a -- e;\n' +
            '}');

            expect(res).toBe(true);
            expect(global.mermaid.parseError).not.toHaveBeenCalled();
        });
        it('it should return false for an invalid dot definition',function(){
            spyOn(global.mermaid,'parseError');
            var res = mermaid.parse('digraph\n' +
            '{\n' +
            'a -:> b -> c -- d -> e;\n' +
            'a -- e;\n' +
            '}');

            expect(res).toBe(false);
            expect(global.mermaid.parseError).toHaveBeenCalled();
        });
    });


});