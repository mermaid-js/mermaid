var parser = require('./parser/gitGraph').parser;
var ast = require("./gitGraphAst.js");
describe('when parsing a gitGraph',function() {
    "use strict";
    beforeEach(function () {
        parser.yy = ast;
        parser.yy.reset();
    });
    it('should handle a gitGraph defintion', function () {
        var str = 'gitGraph:\n' +
        'commit\n';

        parser.parse(str);
        var commits = parser.yy.getCommits();
        console.log(commits);

        expect(Object.keys(commits).length).toBe(1);
        expect(parser.yy.getCurrentBranch()).toBe("master");
        expect(parser.yy.getDirection()).toBe("LR");
        expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    });

    it('should handle set direction', function () {
        var str = 'gitGraph TB:\n' +
        'commit\n';

        parser.parse(str);
        var commits = parser.yy.getCommits();
        console.log(commits);

        expect(Object.keys(commits).length).toBe(1);
        expect(parser.yy.getCurrentBranch()).toBe("master");
        expect(parser.yy.getDirection()).toBe("TB");
        expect(Object.keys(parser.yy.getBranches()).length).toBe(1);
    });

    it('should checkout a branch', function () {
        var str = 'gitGraph:\n' +
        'branch new\n' +
        'checkout new\n'

        parser.parse(str);
        var commits = parser.yy.getCommits();

        expect(Object.keys(commits).length).toBe(0);
        expect(parser.yy.getCurrentBranch()).toBe("new");
    });

    it('should add commits to checked out branch', function () {
        var str = 'gitGraph:\n' +
        'branch new\n' +
        'checkout new\n' +
        'commit\n'+
        'commit\n'

        parser.parse(str);
        var commits = parser.yy.getCommits();

        expect(Object.keys(commits).length).toBe(2);
        expect(parser.yy.getCurrentBranch()).toBe("new");
        var branchCommit = parser.yy.getBranches()['new'];
        expect(branchCommit).not.toBeNull();
        expect(commits[branchCommit].parent).not.toBeNull();
    });
    it('should handle commit with args', function () {
        var str = 'gitGraph:\n' +
        'commit "a commit"\n';

        parser.parse(str);
        var commits = parser.yy.getCommits();
        console.log(commits);

        expect(Object.keys(commits).length).toBe(1);
        var key = Object.keys(commits)[0];
        expect(commits[key].message).toBe("a commit");
        expect(parser.yy.getCurrentBranch()).toBe("master");
    });

    it('should handle branch statement', function () {
        var str = 'gitGraph:\n' +
        'commit\n' +
        'commit\n' +
        'branch newbranch\n' +
        'commit\n' +
        'commit\n';

        console.log(parser.parse(str));
        var commits = parser.yy.getCommits();
        console.log(commits);

        expect(Object.keys(commits).length).toBe(4);
        expect(parser.yy.getCurrentBranch()).toBe("master");
        expect(Object.keys(parser.yy.getBranches())).toContain('newbranch');
        expect(Object.keys(parser.yy.getBranches()).length).toBe(2);
    });

});
