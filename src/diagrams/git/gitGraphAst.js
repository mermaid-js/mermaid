import { log } from '../../logger';
import { random } from '../../utils';
let commits = {};
let head = null;
let branches = { master: head };
let curBranch = 'master';
let direction = 'LR';
let seq = 0;

function getId() {
  return random({ length: 7 });
}

function isfastforwardable(currentCommit, otherCommit) {
  log.debug('Entering isfastforwardable:', currentCommit.id, otherCommit.id);
  while (currentCommit.seq <= otherCommit.seq && currentCommit !== otherCommit) {
    // only if other branch has more commits
    if (otherCommit.parent == null) break;
    if (Array.isArray(otherCommit.parent)) {
      log.debug('In merge commit:', otherCommit.parent);
      return (
        isfastforwardable(currentCommit, commits[otherCommit.parent[0]]) ||
        isfastforwardable(currentCommit, commits[otherCommit.parent[1]])
      );
    } else {
      otherCommit = commits[otherCommit.parent];
    }
  }
  log.debug(currentCommit.id, otherCommit.id);
  return currentCommit.id === otherCommit.id;
}

function isReachableFrom(currentCommit, otherCommit) {
  const currentSeq = currentCommit.seq;
  const otherSeq = otherCommit.seq;
  if (currentSeq > otherSeq) return isfastforwardable(otherCommit, currentCommit);
  return false;
}

function uniqBy(list, fn) {
  const recordMap = Object.create(null);
  return list.reduce((out, item) => {
    const key = fn(item);
    if (!recordMap[key]) {
      recordMap[key] = true;
      out.push(item);
    }
    return out;
  }, []);
}

export const setDirection = function (dir) {
  direction = dir;
};
let options = {};
export const setOptions = function (rawOptString) {
  log.debug('options str', rawOptString);
  rawOptString = rawOptString && rawOptString.trim();
  rawOptString = rawOptString || '{}';
  try {
    options = JSON.parse(rawOptString);
  } catch (e) {
    log.error('error while parsing gitGraph options', e.message);
  }
};

export const getOptions = function () {
  return options;
};

export const commit = function (msg) {
  const commit = {
    id: getId(),
    message: msg,
    seq: seq++,
    parent: head == null ? null : head.id,
  };
  head = commit;
  commits[commit.id] = commit;
  branches[curBranch] = commit.id;
  log.debug('in pushCommit ' + commit.id);
};

export const branch = function (name) {
  branches[name] = head != null ? head.id : null;
  log.debug('in createBranch');
};

export const merge = function (otherBranch) {
  const currentCommit = commits[branches[curBranch]];
  const otherCommit = commits[branches[otherBranch]];
  if (isReachableFrom(currentCommit, otherCommit)) {
    log.debug('Already merged');
    return;
  }
  if (isfastforwardable(currentCommit, otherCommit)) {
    branches[curBranch] = branches[otherBranch];
    head = commits[branches[curBranch]];
  } else {
    // create merge commit
    const commit = {
      id: getId(),
      message: 'merged branch ' + otherBranch + ' into ' + curBranch,
      seq: seq++,
      parent: [head == null ? null : head.id, branches[otherBranch]],
    };
    head = commit;
    commits[commit.id] = commit;
    branches[curBranch] = commit.id;
  }
  log.debug(branches);
  log.debug('in mergeBranch');
};

export const checkout = function (branch) {
  log.debug('in checkout');
  curBranch = branch;
  const id = branches[curBranch];
  head = commits[id];
};

export const reset = function (commitRef) {
  log.debug('in reset', commitRef);
  const ref = commitRef.split(':')[0];
  let parentCount = parseInt(commitRef.split(':')[1]);
  let commit = ref === 'HEAD' ? head : commits[branches[ref]];
  log.debug(commit, parentCount);
  while (parentCount > 0) {
    commit = commits[commit.parent];
    parentCount--;
    if (!commit) {
      const err = 'Critical error - unique parent commit not found during reset';
      log.error(err);
      throw err;
    }
  }
  head = commit;
  branches[curBranch] = commit.id;
};

function upsert(arr, key, newval) {
  const index = arr.indexOf(key);
  if (index === -1) {
    arr.push(newval);
  } else {
    arr.splice(index, 1, newval);
  }
}

function prettyPrintCommitHistory(commitArr) {
  const commit = commitArr.reduce((out, commit) => {
    if (out.seq > commit.seq) return out;
    return commit;
  }, commitArr[0]);
  let line = '';
  commitArr.forEach(function (c) {
    if (c === commit) {
      line += '\t*';
    } else {
      line += '\t|';
    }
  });
  const label = [line, commit.id, commit.seq];
  for (let branch in branches) {
    if (branches[branch] === commit.id) label.push(branch);
  }
  log.debug(label.join(' '));
  if (Array.isArray(commit.parent)) {
    const newCommit = commits[commit.parent[0]];
    upsert(commitArr, commit, newCommit);
    commitArr.push(commits[commit.parent[1]]);
  } else if (commit.parent == null) {
    return;
  } else {
    const nextCommit = commits[commit.parent];
    upsert(commitArr, commit, nextCommit);
  }
  commitArr = uniqBy(commitArr, (c) => c.id);
  prettyPrintCommitHistory(commitArr);
}

export const prettyPrint = function () {
  log.debug(commits);
  const node = getCommitsArray()[0];
  prettyPrintCommitHistory([node]);
};

export const clear = function () {
  commits = {};
  head = null;
  branches = { master: head };
  curBranch = 'master';
  seq = 0;
};

export const getBranchesAsObjArray = function () {
  const branchArr = [];
  for (let branch in branches) {
    branchArr.push({ name: branch, commit: commits[branches[branch]] });
  }
  return branchArr;
};

export const getBranches = function () {
  return branches;
};
export const getCommits = function () {
  return commits;
};
export const getCommitsArray = function () {
  const commitArr = Object.keys(commits).map(function (key) {
    return commits[key];
  });
  commitArr.forEach(function (o) {
    log.debug(o.id);
  });
  commitArr.sort((a, b) => b.seq - a.seq);
  return commitArr;
};
export const getCurrentBranch = function () {
  return curBranch;
};
export const getDirection = function () {
  return direction;
};
export const getHead = function () {
  return head;
};

export default {
  setDirection,
  setOptions,
  getOptions,
  commit,
  branch,
  merge,
  checkout,
  reset,
  prettyPrint,
  clear,
  getBranchesAsObjArray,
  getBranches,
  getCommits,
  getCommitsArray,
  getCurrentBranch,
  getDirection,
  getHead,
};
