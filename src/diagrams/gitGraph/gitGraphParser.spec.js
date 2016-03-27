var parser = require('./parser/gitGraph').parser;
var ast = require("./gitGraphAst.js");
describe('when parsing a gitGraph',function() {
    "use strict";
    beforeEach(function () {
        parser.yy = ast;
        parser.yy.clear();
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

    it('it should reset a branch', function () {
        var str = 'gitGraph:\n' +
        'commit\n' +
        'commit\n' +
        'branch newbranch\n' +
        'checkout newbranch\n' +
        'commit\n' +
        'reset master\n';

        parser.parse(str);

        var commits = parser.yy.getCommits();
        expect(Object.keys(commits).length).toBe(3);
        expect(parser.yy.getCurrentBranch()).toBe("newbranch");
        expect(parser.yy.getBranches()["newbranch"]).toEqual(parser.yy.getBranches()["master"]);
        expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches()["newbranch"]);
    });

    it('it should handle fast forwardable merges', function () {
        var str = 'gitGraph:\n' +
        'commit\n' +
        'branch newbranch\n' +
        'checkout newbranch\n' +
        'commit\n' +
        'commit\n' +
        'checkout master\n'+
        'merge newbranch\n';

        parser.parse(str);

        var commits = parser.yy.getCommits();
        console.log(commits);
        expect(Object.keys(commits).length).toBe(3);
        expect(parser.yy.getCurrentBranch()).toBe("master");
        expect(parser.yy.getBranches()["newbranch"]).toEqual(parser.yy.getBranches()["master"]);
        expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches()["newbranch"]);
    });

    it('it should handle cases when merge is a noop', function () {
        var str = 'gitGraph:\n' +
        'commit\n' +
        'branch newbranch\n' +
        'checkout newbranch\n' +
        'commit\n' +
        'commit\n' +
        'merge master\n';

        parser.parse(str);

        var commits = parser.yy.getCommits();
        console.log(commits);
        expect(Object.keys(commits).length).toBe(3);
        expect(parser.yy.getCurrentBranch()).toBe("newbranch");
        expect(parser.yy.getBranches()["newbranch"]).not.toEqual(parser.yy.getBranches()["master"]);
        expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches()["newbranch"]);
    });

    it('it should handle merge with 2 parents', function () {
        var str = 'gitGraph:\n' +
        'commit\n' +
        'branch newbranch\n' +
        'checkout newbranch\n' +
        'commit\n' +
        'commit\n' +
        'checkout master\n' +
        'commit\n' +
        'merge newbranch\n';

        parser.parse(str);

        var commits = parser.yy.getCommits();
        console.log(commits);
        expect(Object.keys(commits).length).toBe(5);
        expect(parser.yy.getCurrentBranch()).toBe("master");
        expect(parser.yy.getBranches()["newbranch"]).not.toEqual(parser.yy.getBranches()["master"]);
        expect(parser.yy.getHead().id).toEqual(parser.yy.getBranches()["master"]);
    });
});
