var Logger = require('../../logger');
var _ = require('lodash');

//var log = new Logger.Log();
var log = new Logger.Log(1);


var commits = {};
var head  = null;
var branches = { 'master' : head };
var curBranch = 'master';
var direction = 'LR';
var seq = 0;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getId() {
    var pool='0123456789abcdef';
    var id = '';
    for (var i = 0; i < 7; i++) {
        id += pool[getRandomInt(0,16)]
    }
    return id;
}


function isfastforwardable(currentCommit, otherCommit) {
    log.debug('Entering isfastforwardable:', currentCommit.id, otherCommit.id);
    while (currentCommit.seq <= otherCommit.seq && currentCommit != otherCommit) {
        // only if other branch has more commits
        if (otherCommit.parent == null) break;
        if (Array.isArray(otherCommit.parent)){
            log.debug('In merge commit:', otherCommit.parent);
            return isfastforwardable(currentCommit, commits[otherCommit.parent[0]]) ||
                    isfastforwardable(currentCommit, commits[otherCommit.parent[1]])
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
var options = {};
exports.setOptions = function(rawOptString) {
    log.debug('options str', rawOptString);
    rawOptString = rawOptString && rawOptString.trim();
    rawOptString = rawOptString || '{}';
    try {
        options = JSON.parse(rawOptString)
    } catch(e) {
        log.error('error while parsing gitGraph options', e.message);
    }
}

exports.getOptions = function() {
    return options;
}

exports.commit = function(msg) {
    var commit = { id: getId(),
        message: msg,
        seq: seq++,
        parent:  head == null ? null : head.id};
    head = commit;
    commits[commit.id] = commit;
    branches[curBranch] = commit.id;
    log.debug('in pushCommit ' + commit.id);
}

exports.branch = function(name) {
    branches[name] = head != null ? head.id: null;
    log.debug('in createBranch');
}

exports.merge = function(otherBranch) {
    var currentCommit = commits[branches[curBranch]];
    var otherCommit = commits[branches[otherBranch]];
    if (isReachableFrom(currentCommit, otherCommit)) {
        log.debug('Already merged');
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
            parent:  [head == null ? null : head.id, branches[otherBranch]]
        };
        head = commit;
        commits[commit.id] = commit;
        branches[curBranch] = commit.id;
    }
    log.debug(branches);
    log.debug('in mergeBranch');
}

exports.checkout = function(branch) {
    log.debug('in checkout');
    curBranch = branch;
    var id = branches[curBranch];
    head = commits[id];
}

exports.reset = function(commitRef) {
    log.debug('in reset', commitRef);
    var ref = commitRef.split(':')[0];
    var parentCount = parseInt(commitRef.split(':')[1]);
    var commit = ref == 'HEAD' ? head : commits[branches[ref]];
    log.debug(commit, parentCount);
    while (parentCount > 0) {
        commit = commits[commit.parent];
        parentCount--;
        if (!commit) {
            var err = 'Critical error - unique parent commit not found during reset';
            log.error(err);
            throw err;
        }
    }
    head = commit;
    branches[curBranch] = commit.id;
}

function upsert(arr, key, newval) {
    var match = _.find(arr, key);
    if(match){
        var index = _.indexOf(arr, _.find(arr, key));
        arr.splice(index, 1, newval);
    } else {
        arr.push(newval);
    }
    //console.log(arr);
}

function prettyPrintCommitHistory(commitArr) {
    var commit = _.maxBy(commitArr, 'seq');
    var line = '';
    _.each(commitArr, function(c) {
        if (c == commit) {
            line += '\t*'
        } else {
            line +='\t|'
        }
    });
    var label = [line, commit.id, commit.seq];
    _.each(branches, function(v,k){
        if (v == commit.id) label.push(k);
    });
    log.debug(label.join(' '));
    if (Array.isArray(commit.parent)) {
        //console.log("here", commit.parent);
        var newCommit = commits[commit.parent[0]];
        upsert(commitArr, commit, newCommit);
        commitArr.push(commits[commit.parent[1]]);
        //console.log("shoudl have 2", commitArr);
    } else if(commit.parent == null){
        return;
    } else {
        var nextCommit = commits[commit.parent];
        upsert(commitArr, commit, nextCommit);
    }
    commitArr = _.uniqBy(commitArr, 'id');
    prettyPrintCommitHistory(commitArr);

}

exports.prettyPrint = function() {
    log.debug(commits);
    var node = exports.getCommitsArray()[0];
    prettyPrintCommitHistory([node]);
}

exports.clear = function () {
    commits = {};
    head  = null;
    branches = { 'master' : head };
    curBranch = 'master';
    seq =0;
}

exports.getBranchesAsObjArray = function() {
    var branchArr = _.map(branches, function(v,k) {
        return {'name': k, 'commit': commits[v]};
    });
    //return _.orderBy(branchArr, [function(b) { return b.commit.seq}], ['desc']);
    return branchArr;
}

exports.getBranches = function() { return branches; }
exports.getCommits = function() { return commits; }
exports.getCommitsArray = function() {
    var commitArr = Object.keys(commits).map(function (key) {
        return commits[key];
    });
    _.each(commitArr, function(o) { log.debug(o.id) });
    return _.orderBy(commitArr, ['seq'], ['desc']);
    }
exports.getCurrentBranch = function() { return curBranch; }
exports.getDirection = function() { return direction; }
exports.getHead = function() { return head; }
