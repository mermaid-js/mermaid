var crypto = require("crypto");
var Logger = require('../../logger');
var log = new Logger.Log();

var commits = {};
var head  = null;
var branches = { "master" : head };
var curBranch = "master";

function getId() {
    return crypto.randomBytes(20).toString('hex').substring(0, 7);
}
exports.pushCommit = function() {
    var commit = { id: getId(),
        parent:  head == null ? null : head.id};
    head = commit;
    commits[commit.id] = commit;
    branches[curBranch] = commit.id;
    log.debug("in pushCommit");
}

exports.createBranch = function(name) {
    branches[name] = head.id;
    log.debug("in createBranch");
}

exports.mergeBranch = function() {
    log.debug("in mergeBranch");
}

exports.reset = function () {
    commits = {};
    head  = null;
    branches = { "master" : head };
    curBranch = "master";
}

exports.getBranches = function() { return branches; }
exports.getCommits = function() { return commits; }
exports.getCurrentBranch = function() { return curBranch; }
