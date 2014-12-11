/**
 * Created by knut on 14-11-26.
 */
/**
 * Created by knut on 14-11-23.
 */
var rewire = require("rewire");
var utils = require("./utils");

describe('when using main and ',function() {
    describe('when detecting chart type ',function() {
        var main;
        beforeEach(function () {
            var MockBrowser = require('mock-browser').mocks.MockBrowser;
            var mock = new MockBrowser();

            // and in the run-code inside some object
            document = mock.getDocument();


        });

        it('should not call start anything with an empty document', function () {

            mermaid_config ={startOnLoad : false};
            main = rewire('./main');

            spyOn(utils,'detectType');
            expect(utils.detectType).not.toHaveBeenCalled();
        });
        it('should start something with a mermaid document', function () {
            mermaid_config ={startOnLoad : false};
            main = rewire('./main');
            document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
            spyOn(utils,'detectType');
            mermaid.init();
            expect(utils.detectType).toHaveBeenCalled();
        });

    });

    describe('when calling addEdges ',function() {
        var main;
        var graph = require('./diagrams/flowchart/graphDb');
        var flow = require('./diagrams/flowchart/parser/flow');
        var flowRend = require('./diagrams/flowchart/flowRenderer');

        beforeEach(function () {
            mermaid_config ={startOnLoad : false};
            var MockBrowser = require('mock-browser').mocks.MockBrowser;
            var mock = new MockBrowser();
            flow.parser.yy =graph;
            graph.clear();
            document = mock.getDocument();
            main = rewire('./main');
        });
        it('it should handle edges with text', function () {
            var res = flow.parser.parse('graph TD;A-->|text ex|B;');
            var vert = flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            var mockG = {
                setEdge:function(start, end,options,name){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('normal');
                    expect(options.label.match('text ex')).toBeTruthy();
                }
            };

            flowRend.addEdges(edges,mockG);
        });

        it('should handle edges without text', function () {
            var res = flow.parser.parse('graph TD;A-->B;');
            var vert = flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            var mockG = {
                setEdge:function(start, end,options,name){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('normal');
                }
            };

            flowRend.addEdges(edges,mockG);
        });


        it('should handle open-ended edges', function () {
            var res = flow.parser.parse('graph TD;A---B;');
            var vert = flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            var mockG = {
                setEdge:function(start, end,options,name){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('none');
                }
            };

            flowRend.addEdges(edges,mockG);
        });

        it('should handle edges with styles defined', function () {
            var res = flow.parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2;');
            var vert = flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            var mockG = {
                setEdge:function(start, end,options,name){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('none');
                    expect(options.style).toBe('stroke:val1;stroke-width:val2;');
                }
            };

            flowRend.addEdges(edges,mockG);
        });
        it('should handle edges with text and styles defined', function () {
            var res = flow.parser.parse('graph TD;A---|the text|B; linkStyle 0 stroke:val1,stroke-width:val2;');
            var vert = flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            var mockG = {
                setEdge:function(start, end,options,name){
                    expect(start).toBe('A');
                    expect(end).toBe('B');
                    expect(options.arrowhead).toBe('none');
                    expect(options.label.match('the text')).toBeTruthy();
                    expect(options.style).toBe('stroke:val1;stroke-width:val2;');
                }
            };

            flowRend.addEdges(edges,mockG);
        });
    });
});