/**
 * Created by knut on 14-11-26.
 */
/**
 * Created by knut on 14-11-23.
 */
var api = require('./mermaidAPI.js');
//var log = require('./logger').create();

describe('when using mermaidAPI and ',function() {
    describe('doing initialize ',function() {
        //var main;
        //var document;
        //var window;
        beforeEach(function () {
            //var MockBrowser = require('mock-browser').mocks.MockBrowser;
            //var mock = new MockBrowser();

            delete global.mermaid_config;

            // and in the run-code inside some object
            //global.document = mock.getDocument();
            //global.window = mock.getWindow();
            document.body.innerHTML = '';
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
    describe('checking validity of input ', function(){
        it('it should return false for an invalid definiton',function(){
            global.mermaidAPI.parseError= function(){};
            spyOn(global.mermaidAPI,'parseError');
            var res = api.parse('this is not a mermaid diagram definition');

            expect(res).toBe(false);
            expect(global.mermaidAPI.parseError).toHaveBeenCalled();
        });
        it('it should return true for a valid definiton',function(){
            spyOn(global.mermaidAPI,'parseError');
            var res = api.parse('graph TD;A--x|text including URL space|B;');

            expect(res).toBe(true);
            expect(global.mermaidAPI.parseError).not.toHaveBeenCalled();
        });
    });
});