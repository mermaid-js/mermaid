import { log } from '../../logger';
import { random } from '../../utils';
import mermaidAPI from '../../mermaidAPI';
import * as configApi from '../../config';
import { getConfig } from '../../config';
import common from '../common/common';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../../commonDb';

let mainBranchName = getConfig().gitGraph.mainBranchName;
let mainBranchOrder = getConfig().gitGraph.mainBranchOrder;
let commits = {};
let head = undefined;
let branchesConfig = {};
branchesConfig[mainBranchName] = { name: mainBranchName, order: mainBranchOrder };
let branches = {};
branches[mainBranchName] = head;
let curBranch = mainBranchName;
let direction = 'LR';
let seq = 0;

/**
 *
 */
function getId() {
  return random({ length: 7 });
}

export const parseDirective = function (statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

// /**
//  * @param currentCommit
//  * @param otherCommit
//  */
// eslint-disable-next-line @cspell/spellchecker
// function isfastforwardable(currentCommit, otherCommit) {
//   log.debug('Entering isfastforwardable:', currentCommit.id, otherCommit.id);
//   let cnt = 0;
//   while (currentCommit.seq <= otherCommit.seq && currentCommit !== otherCommit && cnt < 1000) {
//     cnt++;
//     // only if other branch has more commits
//     if (otherCommit.parent == null) break;
//     if (Array.isArray(otherCommit.parent)) {
//       log.debug('In merge commit:', otherCommit.parent);
//       return (
//         isfastforwardable(currentCommit, commits[otherCommit.parent[0]]) ||
//         isfastforwardable(currentCommit, commits[otherCommit.parent[1]])
//       );
//     } else {
//       otherCommit = commits[otherCommit.parent];
//     }
//   }
//   log.debug(currentCommit.id, otherCommit.id);
//   return currentCommit.id === otherCommit.id;
// }

/**
 * @param currentCommit
 * @param otherCommit
 */
// function isReachableFrom(currentCommit, otherCommit) {
//   const currentSeq = currentCommit.seq;
//   const otherSeq = otherCommit.seq;
//   if (currentSeq > otherSeq) return isfastforwardable(otherCommit, currentCommit);
//   return false;
// }

/**
 * @param list
 * @param fn
 */
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

export const commit = function (msg, id, type, tag) {
  log.debug('Entering commit:', msg, id, type, tag);
  id = common.sanitizeText(id, configApi.getConfig());
  msg = common.sanitizeText(msg, configApi.getConfig());
  tag = common.sanitizeText(tag, configApi.getConfig());
  const commit = {
    id: id ? id : seq + '-' + getId(),
    message: msg,
    seq: seq++,
    type: type ? type : commitType.NORMAL,
    tag: tag ? tag : '',
    parents: head == undefined ? [] : [head.id],
    branch: curBranch,
  };
  head = commit;
  commits[commit.id] = commit;
  branches[curBranch] = commit.id;
  log.debug('in pushCommit ' + commit.id);
};

export const branch = function (name, order) {
  name = common.sanitizeText(name, configApi.getConfig());
  if (branches[name] === undefined) {
    branches[name] = head != null ? head.id : null;
    branchesConfig[name] = { name, order: order ? parseInt(order, 10) : null };
    checkout(name);
    log.debug('in createBranch');
  } else {
    let error = new Error(
      'Trying to create an existing branch. (Help: Either use a new name if you want create a new branch or try using "checkout ' +
        name +
        '")'
    );
    error.hash = {
      text: 'branch ' + name,
      token: 'branch ' + name,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['"checkout ' + name + '"'],
    };
    throw error;
  }
};

export const merge = function (otherBranch, custom_id, override_type, custom_tag) {
  otherBranch = common.sanitizeText(otherBranch, configApi.getConfig());
  custom_id = common.sanitizeText(custom_id, configApi.getConfig());

  const currentCommit = commits[branches[curBranch]];
  const otherCommit = commits[branches[otherBranch]];
  if (curBranch === otherBranch) {
    let error = new Error('Incorrect usage of "merge". Cannot merge a branch to itself');
    error.hash = {
      text: 'merge ' + otherBranch,
      token: 'merge ' + otherBranch,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['branch abc'],
    };
    throw error;
  } else if (currentCommit === undefined || !currentCommit) {
    let error = new Error(
      'Incorrect usage of "merge". Current branch (' + curBranch + ')has no commits'
    );
    error.hash = {
      text: 'merge ' + otherBranch,
      token: 'merge ' + otherBranch,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['commit'],
    };
    throw error;
  } else if (branches[otherBranch] === undefined) {
    let error = new Error(
      'Incorrect usage of "merge". Branch to be merged (' + otherBranch + ') does not exist'
    );
    error.hash = {
      text: 'merge ' + otherBranch,
      token: 'merge ' + otherBranch,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['branch ' + otherBranch],
    };
    throw error;
  } else if (otherCommit === undefined || !otherCommit) {
    let error = new Error(
      'Incorrect usage of "merge". Branch to be merged (' + otherBranch + ') has no commits'
    );
    error.hash = {
      text: 'merge ' + otherBranch,
      token: 'merge ' + otherBranch,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['"commit"'],
    };
    throw error;
  } else if (currentCommit === otherCommit) {
    let error = new Error('Incorrect usage of "merge". Both branches have same head');
    error.hash = {
      text: 'merge ' + otherBranch,
      token: 'merge ' + otherBranch,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['branch abc'],
    };
    throw error;
  } else if (custom_id && commits[custom_id] !== undefined) {
    let error = new Error(
      'Incorrect usage of "merge". Commit with id:' +
        custom_id +
        ' already exists, use different custom Id'
    );
    error.hash = {
      text: 'merge ' + otherBranch + custom_id + override_type + custom_tag,
      token: 'merge ' + otherBranch + custom_id + override_type + custom_tag,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: [
        'merge ' + otherBranch + ' ' + custom_id + '_UNIQUE ' + override_type + ' ' + custom_tag,
      ],
    };

    throw error;
  }
  // if (isReachableFrom(currentCommit, otherCommit)) {
  //   log.debug('Already merged');
  //   return;
  // }
  // if (isfastforwardable(currentCommit, otherCommit)) {
  //   branches[curBranch] = branches[otherBranch];
  //   head = commits[branches[curBranch]];
  // } else {
  // create merge commit
  const commit = {
    id: custom_id ? custom_id : seq + '-' + getId(),
    message: 'merged branch ' + otherBranch + ' into ' + curBranch,
    seq: seq++,
    parents: [head?.id, branches[otherBranch]],
    branch: curBranch,
    type: commitType.MERGE,
    customType: override_type,
    customId: custom_id ? true : false,
    tag: custom_tag ? custom_tag : '',
  };
  head = commit;
  commits[commit.id] = commit;
  branches[curBranch] = commit.id;
  // }
  log.debug(branches);
  log.debug('in mergeBranch');
};

export const cherryPick = function (sourceId, targetId, tag) {
  log.debug('Entering cherryPick:', sourceId, targetId, tag);
  sourceId = common.sanitizeText(sourceId, configApi.getConfig());
  targetId = common.sanitizeText(targetId, configApi.getConfig());
  tag = common.sanitizeText(tag, configApi.getConfig());

  if (!sourceId || commits[sourceId] === undefined) {
    let error = new Error(
      'Incorrect usage of "cherryPick". Source commit id should exist and provided'
    );
    error.hash = {
      text: 'cherryPick ' + sourceId + ' ' + targetId,
      token: 'cherryPick ' + sourceId + ' ' + targetId,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['cherry-pick abc'],
    };
    throw error;
  }

  let sourceCommit = commits[sourceId];
  let sourceCommitBranch = sourceCommit.branch;
  if (sourceCommit.type === commitType.MERGE) {
    let error = new Error(
      'Incorrect usage of "cherryPick". Source commit should not be a merge commit'
    );
    error.hash = {
      text: 'cherryPick ' + sourceId + ' ' + targetId,
      token: 'cherryPick ' + sourceId + ' ' + targetId,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['cherry-pick abc'],
    };
    throw error;
  }
  if (!targetId || commits[targetId] === undefined) {
    // cherry-pick source commit to current branch

    if (sourceCommitBranch === curBranch) {
      let error = new Error(
        'Incorrect usage of "cherryPick". Source commit is already on current branch'
      );
      error.hash = {
        text: 'cherryPick ' + sourceId + ' ' + targetId,
        token: 'cherryPick ' + sourceId + ' ' + targetId,
        line: '1',
        loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
        expected: ['cherry-pick abc'],
      };
      throw error;
    }
    const currentCommit = commits[branches[curBranch]];
    if (currentCommit === undefined || !currentCommit) {
      let error = new Error(
        'Incorrect usage of "cherry-pick". Current branch (' + curBranch + ')has no commits'
      );
      error.hash = {
        text: 'cherryPick ' + sourceId + ' ' + targetId,
        token: 'cherryPick ' + sourceId + ' ' + targetId,
        line: '1',
        loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
        expected: ['cherry-pick abc'],
      };
      throw error;
    }
    const commit = {
      id: seq + '-' + getId(),
      message: 'cherry-picked ' + sourceCommit + ' into ' + curBranch,
      seq: seq++,
      parents: [head?.id, sourceCommit.id],
      branch: curBranch,
      type: commitType.CHERRY_PICK,
      tag: tag ?? 'cherry-pick:' + sourceCommit.id,
    };
    head = commit;
    commits[commit.id] = commit;
    branches[curBranch] = commit.id;
    log.debug(branches);
    log.debug('in cherryPick');
  }
};
export const checkout = function (branch) {
  branch = common.sanitizeText(branch, configApi.getConfig());
  if (branches[branch] === undefined) {
    let error = new Error(
      'Trying to checkout branch which is not yet created. (Help try using "branch ' + branch + '")'
    );
    error.hash = {
      text: 'checkout ' + branch,
      token: 'checkout ' + branch,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['"branch ' + branch + '"'],
    };
    throw error;
    //branches[branch] = head != null ? head.id : null;
    //log.debug('in createBranch');
  } else {
    curBranch = branch;
    const id = branches[curBranch];
    head = commits[id];
  }
};

// export const reset = function (commitRef) {
//   log.debug('in reset', commitRef);
//   const ref = commitRef.split(':')[0];
//   let parentCount = parseInt(commitRef.split(':')[1]);
//   let commit = ref === 'HEAD' ? head : commits[branches[ref]];
//   log.debug(commit, parentCount);
//   while (parentCount > 0) {
//     commit = commits[commit.parent];
//     parentCount--;
//     if (!commit) {
//       const err = 'Critical error - unique parent commit not found during reset';
//       log.error(err);
//       throw err;
//     }
//   }
//   head = commit;
//   branches[curBranch] = commit.id;
// };

/**
 * @param arr
 * @param key
 * @param newVal
 */
function upsert(arr, key, newVal) {
  const index = arr.indexOf(key);
  if (index === -1) {
    arr.push(newVal);
  } else {
    arr.splice(index, 1, newVal);
  }
}

/** @param commitArr */
function prettyPrintCommitHistory(commitArr) {
  const commit = commitArr.reduce((out, commit) => {
    if (out.seq > commit.seq) {
      return out;
    }
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
    if (branches[branch] === commit.id) {
      label.push(branch);
    }
  }
  log.debug(label.join(' '));
  if (commit.parents && commit.parents.length == 2) {
    const newCommit = commits[commit.parents[0]];
    upsert(commitArr, commit, newCommit);
    commitArr.push(commits[commit.parents[1]]);
  } else if (commit.parents.length == 0) {
    return;
  } else {
    const nextCommit = commits[commit.parents];
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
  head = undefined;
  let mainBranch = getConfig().gitGraph.mainBranchName;
  let mainBranchOrder = getConfig().gitGraph.mainBranchOrder;
  branches = {};
  branches[mainBranch] = null;
  branchesConfig = {};
  branchesConfig[mainBranch] = { name: mainBranch, order: mainBranchOrder };
  curBranch = mainBranch;
  seq = 0;
  commonClear();
};

export const getBranchesAsObjArray = function () {
  const branchesArray = Object.values(branchesConfig)
    .map((branchConfig, i) => {
      if (branchConfig.order !== null) {
        return branchConfig;
      }
      return {
        ...branchConfig,
        order: parseFloat(`0.${i}`, 10),
      };
    })
    .sort((a, b) => a.order - b.order)
    .map(({ name }) => ({ name }));

  return branchesArray;
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
  commitArr.sort((a, b) => a.seq - b.seq);
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

export const commitType = {
  NORMAL: 0,
  REVERSE: 1,
  HIGHLIGHT: 2,
  MERGE: 3,
  CHERRY_PICK: 4,
};

export default {
  parseDirective,
  getConfig: () => configApi.getConfig().gitGraph,
  setDirection,
  setOptions,
  getOptions,
  commit,
  branch,
  merge,
  cherryPick,
  checkout,
  //reset,
  prettyPrint,
  clear,
  getBranchesAsObjArray,
  getBranches,
  getCommits,
  getCommitsArray,
  getCurrentBranch,
  getDirection,
  getHead,
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  setDiagramTitle,
  getDiagramTitle,
  commitType,
};
