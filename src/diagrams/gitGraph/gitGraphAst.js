var crypto = require("crypto");
var Logger = require('../../logger');
//var log = new Logger.Log();
var log = new Logger.Log(1);


var commits = {};
var head  = null;
var branches = { "master" : head };
var curBranch = "master";
var direction = "LR";
var seq = 0;

function getId() {
    return crypto.randomBytes(20).toString('hex').substring(0, 7);
}


function isfastforwardable(current, other) {
    var currentCommit = commits[branches[current]];
    var currentSeq = currentCommit.seq;
    var otherCommit = commits[branches[other]];
    var otherSeq = otherCommit.seq;

    log.debug(commits);
    log.debug(currentCommit, otherCommit);
    while (currentSeq <= otherSeq && currentCommit != otherCommit) {
        // only if source has more commits
        otherCommit = commits[otherCommit.parent];
    }
    log.debug(currentCommit.id, otherCommit.id);
    return currentCommit.id == otherCommit.id;
}

function isReachableFrom(current, other) {
    var currentCommit = commits[branches[current]];
    var currentSeq = currentCommit.seq;
    var otherCommit = commits[branches[other]];
    var otherSeq = otherCommit.seq;
    if (currentSeq > otherSeq) return isfastforwardable(other, current);
    return false;
}
exports.setDirection = function(dir) {
    direction = dir;
}
exports.commit = function(msg) {
    var commit = { id: getId(),
        message: msg,
        seq: seq++,
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

exports.merge = function(otherBranch) {
    if (isReachableFrom(curBranch, otherBranch)) {
        log.debug("Already merged");
        return;
    }
    if (isfastforwardable(curBranch, otherBranch)){
        branches[curBranch] = branches[otherBranch];
        head = commits[branches[curBranch]];
    }
    log.debug(branches);
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
    seq =0;
}

exports.getBranches = function() { return branches; }
exports.getCommits = function() { return commits; }
exports.getCurrentBranch = function() { return curBranch; }
exports.getDirection = function() { return direction; }
exports.getHead = function() { return head; }
