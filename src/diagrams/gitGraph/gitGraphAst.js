var crypto = require("crypto");
var Logger = require('../../logger');
var log = new Logger.Log();
var _ = require("lodash");
//var log = new Logger.Log(1);


var commits = {};
var head  = null;
var branches = { "master" : head };
var curBranch = "master";
var direction = "LR";
var seq = 0;

function getId() {
    return crypto.randomBytes(20).toString('hex').substring(0, 7);
}


function isfastforwardable(currentCommit, otherCommit) {
    var currentSeq = currentCommit.seq;
    var otherSeq = otherCommit.seq;

    log.debug(commits);
    log.debug(currentCommit, otherCommit);
    while (currentSeq <= otherSeq && currentCommit != otherCommit) {
        // only if other branch has more commits
        if (otherCommit.parent == null) break;
        if (Array.isArray(otherCommit.parent)){
            return isfastforwardable(currentCommit, otherCommit.parent[0]) ||
                    isfastforwardable(currentCommit, otherCommit.parent[1])
        } else {
            otherCommit = commits[otherCommit.parent];
        }
    }
    log.debug(currentCommit.id, otherCommit.id);
    return currentCommit.id == otherCommit.id;
}

function isReachableFrom(currentCommit, otherCommit) {
    var currentSeq = currentCommit.seq;
    var otherSeq = otherCommit.seq;
    if (currentSeq > otherSeq) return isfastforwardable(otherCommit, currentCommit);
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
    var currentCommit = commits[branches[curBranch]];
    var otherCommit = commits[branches[otherBranch]];
    if (isReachableFrom(currentCommit, otherCommit)) {
        log.debug("Already merged");
        return;
    }
    if (isfastforwardable(currentCommit, otherCommit)){
        branches[curBranch] = branches[otherBranch];
        head = commits[branches[curBranch]];
    } else {
        // create merge commit
        var commit = {
            id: getId(),
            message: 'merged branch ' + otherBranch + ' into ' + curBranch,
            seq: seq++,
            parent:  [head == null ? null : head.id, commits[branches[otherBranch]]]
        };
        head = commit;
        commits[commit.id] = commit;
        branches[curBranch] = commit.id;
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

exports.prettyPrint = function() {
    var commitArr = Object.keys(commits).map(function (key) {
        return commits[key];
    });
    var sortedCommits = _.orderBy(commitArr, ['seq'], ['desc']);
    console.log(sortedCommits);
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
