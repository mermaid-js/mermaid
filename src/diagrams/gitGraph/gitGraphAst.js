var crypto = require("crypto");
var Logger = require('../../logger');
var log = new Logger.Log();


var commits = {};
var head  = null;
var branches = { "master" : head };
var curBranch = "master";
var direction = "LR";

function getId() {
    return crypto.randomBytes(20).toString('hex').substring(0, 7);
}

exports.setDirection = function(dir) {
    direction = dir;
}
exports.commit = function(msg) {
    var commit = { id: getId(),
        message: msg,
        parent:  head == null ? null : head.id};
    head = commit;
    commits[commit.id] = commit;
    branches[curBranch] = commit.id;
    log.debug("in pushCommit");
}

exports.branch = function(name) {
    branches[name] = head != null ? head.id: null;
    log.debug("in createBranch");
}

exports.merge = function() {
    log.debug("in mergeBranch");
}

exports.checkout = function(branch) {
    log.debug("in checkout");
    curBranch = branch;
    var id = branches[curBranch];
    head = commits[id];
}

exports.reset = function(ref) {
    log.debug("in reset");
    var commit = ref == 'HEAD' ? head : commits[branches[ref]];
    head = commit;
    branches[curBranch] = commit.id;
}

exports.clear = function () {
    commits = {};
    head  = null;
    branches = { "master" : head };
    curBranch = "master";
}

exports.getBranches = function() { return branches; }
exports.getCommits = function() { return commits; }
exports.getCurrentBranch = function() { return curBranch; }
exports.getDirection = function() { return direction; }
exports.getHead = function() { return head; }
