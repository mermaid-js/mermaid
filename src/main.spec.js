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
        it('should have a version', function () {
            div = document.createElement('div');
            mermaid_config ={startOnLoad : false};
            main = rewire('./main');
            expect(main.version()).toBe('0.2.8');
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

            document.body.innerHTML = '<div class="mermaid"></div>';
            spyOn(utils,'detectType');
            mermaid.init();
            expect(utils.detectType).toHaveBeenCalled();
        });

    });

    xdescribe('when calling addEdges ',function() {
        var main;
        beforeEach(function () {
            main = rewire('./main');
        });
        it('should have a version', function () {
            var edge = {start: 'start', end: 'end', type: 'arrow', text: 'test text'};
            var edges = [edge];
            var mockG = {
                setEdge:function(start, end,options,name){}
            };
            spyOn(mockG,'setEdge');
            main.__set__('exports.apa',function(a,b){
                addEdges(a,b);
            });
            main.apa(edges,mockG);
            expect(mockG.setEdge).toHaveBeenCalled();
        });

    });
});