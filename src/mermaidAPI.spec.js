/**
 * Created by knut on 14-11-26.
 */
/**
 * Created by knut on 14-11-23.
 */
var api = require('./mermaidAPI.js');

describe('when using mermaidAPI and ',function() {
    describe('doing initialize ',function() {
        //var main;
        //var document;
        //var window;
        beforeEach(function () {
            var MockBrowser = require('mock-browser').mocks.MockBrowser;
            var mock = new MockBrowser();

            delete global.mermaid_config;

            // and in the run-code inside some object
            document = mock.getDocument();
            window = mock.getWindow();
        });

        it('should copy a literal into the configuration', function () {
            var orgConfig = api.getConfig();
            expect(orgConfig.testLiteral).toBe(undefined);

            api.initialize({'testLiteral':true});
            var config = api.getConfig();

            expect(config.testLiteral).toBe(true);
        });
        it('should copy a an object into the configuration', function () {
            var orgConfig = api.getConfig();
            expect(orgConfig.testObject).toBe(undefined);

            
            var object = {
                test1:1,
                test2:false
            };
            
            api.initialize({'testObject':object});
            api.initialize({'testObject':{'test3':true}});
            var config = api.getConfig();

            expect(config.testObject.test1).toBe(1);
            expect(config.testObject.test2).toBe(false);
            expect(config.testObject.test3).toBe(true);
            expect(config.cloneCssStyles).toBe(orgConfig.cloneCssStyles);
        });

    });
});