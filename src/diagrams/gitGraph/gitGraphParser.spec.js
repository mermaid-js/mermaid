var proxyquire = require('proxyquire');
var parser = require('./parser/gitGraph').parser;
var ast = require("./gitGraphAst.js");
describe('when parsing a gitGraph',function() {
    beforeEach(function () {
        parser.yy = ast;
        parser.yy.reset();
    });
    it('should handle a gitGraph defintion', function () {
        str = 'gitGraph:\n' +
        'commit';

        parser.parse(str);
        var commits = parser.yy.getCommits();
        console.log(commits);

        expect(Object.keys(commits).length).toBe(1);
        expect(parser.yy.getCurrentBranch()).toBe("master");
        expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    });
    it('should handle branch statement', function () {
        str = 'gitGraph:\n' +
        'commit\n' +
        'commit\n' +
        'branch newbranch\n' +
        'commit\n' +
        'commit\n';

        parser.parse(str);
        var commits = parser.yy.getCommits();
        console.log(commits);

        expect(Object.keys(commits).length).toBe(4);
        expect(parser.yy.getCurrentBranch()).toBe("master");
        expect(Object.keys(parser.yy.getBranches())).toContain('newbranch');
        expect(Object.keys(parser.yy.getBranches()).length).toBe(2);
    });
});
