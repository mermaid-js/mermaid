/**
 * Created by knut on 14-11-26.
 */
/**
 * Created by knut on 14-11-23.
 */
var rewire = require("rewire");
var utils = require("./utils");

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
        expect(main.version()).toBe('0.2.4');
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