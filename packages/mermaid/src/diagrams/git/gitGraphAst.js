import { log } from '../../logger.js';
import { random } from '../../utils.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import common from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';

let { mainBranchName, mainBranchOrder } = getConfig().gitGraph;
let commits = new Map();
let head = null;
let branchesConfig = new Map();
branchesConfig.set(mainBranchName, { name: mainBranchName, order: mainBranchOrder });
let branches = new Map();
branches.set(mainBranchName, head);
let curBranch = mainBranchName;
let direction = 'LR';
let seq = 0;

/**
 *
 */
function getId() {
  return random({ length: 7 });
}

// /**
//  * @param currentCommit
//  * @param otherCommit
//  */

// function isFastForwardable(currentCommit, otherCommit) {
//   log.debug('Entering isFastForwardable:', currentCommit.id, otherCommit.id);
//   let cnt = 0;
//   while (currentCommit.seq <= otherCommit.seq && currentCommit !== otherCommit && cnt < 1000) {
//     cnt++;
//     // only if other branch has more commits
//     if (otherCommit.parent == null) break;
//     if (Array.isArray(otherCommit.parent)) {
//       log.debug('In merge commit:', otherCommit.parent);
//       return (
//         isFastForwardable(currentCommit, commits.get(otherCommit.parent[0])) ||
//         isFastForwardable(currentCommit, commits.get(otherCommit.parent[1]))
//       );
//     } else {
//       otherCommit = commits.get(otherCommit.parent);
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
//   if (currentSeq > otherSeq) return isFastForwardable(otherCommit, currentCommit);
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
  rawOptString = rawOptString?.trim();
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

export const commit = function (msg, id, type, tags) {
  log.debug('Entering commit:', msg, id, type, tags);
  const config = getConfig();
  id = common.sanitizeText(id, config);
  msg = common.sanitizeText(msg, config);
  tags = tags?.map((tag) => common.sanitizeText(tag, config));
  const commit = {
    id: id ? id : seq + '-' + getId(),
    message: msg,
    seq: seq++,
    type: type ? type : commitType.NORMAL,
    tags: tags ?? [],
    parents: head == null ? [] : [head.id],
    branch: curBranch,
  };
  head = commit;
  commits.set(commit.id, commit);
  branches.set(curBranch, commit.id);
  log.debug('in pushCommit ' + commit.id);
};

export const branch = function (name, order) {
  name = common.sanitizeText(name, getConfig());
  if (!branches.has(name)) {
    branches.set(name, head != null ? head.id : null);
    branchesConfig.set(name, { name, order: order ? parseInt(order, 10) : null });
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

export const merge = function (otherBranch, custom_id, override_type, custom_tags) {
  const config = getConfig();
  otherBranch = common.sanitizeText(otherBranch, config);
  custom_id = common.sanitizeText(custom_id, config);

  const currentCommit = commits.get(branches.get(curBranch));
  const otherCommit = commits.get(branches.get(otherBranch));
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
  } else if (!branches.has(otherBranch)) {
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
  } else if (custom_id && commits.has(custom_id)) {
    let error = new Error(
      'Incorrect usage of "merge". Commit with id:' +
        custom_id +
        ' already exists, use different custom Id'
    );
    error.hash = {
      text: 'merge ' + otherBranch + custom_id + override_type + custom_tags?.join(','),
      token: 'merge ' + otherBranch + custom_id + override_type + custom_tags?.join(','),
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: [
        `merge ${otherBranch} ${custom_id}_UNIQUE ${override_type} ${custom_tags?.join(',')}`,
      ],
    };

    throw error;
  }
  // if (isReachableFrom(currentCommit, otherCommit)) {
  //   log.debug('Already merged');
  //   return;
  // }
  // if (isFastForwardable(currentCommit, otherCommit)) {
  //   branches.set(curBranch, branches.get(otherBranch));
  //   head = commits.get(branches.get(curBranch));
  // } else {
  // create merge commit
  const commit = {
    id: custom_id ? custom_id : seq + '-' + getId(),
    message: 'merged branch ' + otherBranch + ' into ' + curBranch,
    seq: seq++,
    parents: [head == null ? null : head.id, branches.get(otherBranch)],
    branch: curBranch,
    type: commitType.MERGE,
    customType: override_type,
    customId: custom_id ? true : false,
    tags: custom_tags ? custom_tags : [],
  };
  head = commit;
  commits.set(commit.id, commit);
  branches.set(curBranch, commit.id);
  // }
  log.debug(branches);
  log.debug('in mergeBranch');
};

export const cherryPick = function (sourceId, targetId, tags, parentCommitId) {
  log.debug('Entering cherryPick:', sourceId, targetId, tags);
  const config = getConfig();
  sourceId = common.sanitizeText(sourceId, config);
  targetId = common.sanitizeText(targetId, config);
  tags = tags?.map((tag) => common.sanitizeText(tag, config));
  parentCommitId = common.sanitizeText(parentCommitId, config);

  if (!sourceId || !commits.has(sourceId)) {
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
  let sourceCommit = commits.get(sourceId);
  let sourceCommitBranch = sourceCommit.branch;
  if (
    parentCommitId &&
    !(Array.isArray(sourceCommit.parents) && sourceCommit.parents.includes(parentCommitId))
  ) {
    let error = new Error(
      'Invalid operation: The specified parent commit is not an immediate parent of the cherry-picked commit.'
    );
    throw error;
  }
  if (sourceCommit.type === commitType.MERGE && !parentCommitId) {
    let error = new Error(
      'Incorrect usage of cherry-pick: If the source commit is a merge commit, an immediate parent commit must be specified.'
    );
    throw error;
  }
  if (!targetId || !commits.has(targetId)) {
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
    const currentCommit = commits.get(branches.get(curBranch));
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
      parents: [head == null ? null : head.id, sourceCommit.id],
      branch: curBranch,
      type: commitType.CHERRY_PICK,
      tags: tags
        ? tags.filter(Boolean)
        : [
            `cherry-pick:${sourceCommit.id}${
              sourceCommit.type === commitType.MERGE ? `|parent:${parentCommitId}` : ''
            }`,
          ],
    };
    head = commit;
    commits.set(commit.id, commit);
    branches.set(curBranch, commit.id);
    log.debug(branches);
    log.debug('in cherryPick');
  }
};
export const checkout = function (branch) {
  branch = common.sanitizeText(branch, getConfig());
  if (!branches.has(branch)) {
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
  } else {
    curBranch = branch;
    const id = branches.get(curBranch);
    head = commits.get(id);
  }
};

// export const reset = function (commitRef) {
//   log.debug('in reset', commitRef);
//   const ref = commitRef.split(':')[0];
//   let parentCount = parseInt(commitRef.split(':')[1]);
//   let commit = ref === 'HEAD' ? head : commits.get(branches.get(ref));
//   log.debug(commit, parentCount);
//   while (parentCount > 0) {
//     commit = commits.get(commit.parent);
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
    if (branches.get(branch) === commit.id) {
      label.push(branch);
    }
  }
  log.debug(label.join(' '));
  if (commit.parents && commit.parents.length == 2) {
    const newCommit = commits.get(commit.parents[0]);
    upsert(commitArr, commit, newCommit);
    commitArr.push(commits.get(commit.parents[1]));
  } else if (commit.parents.length == 0) {
    return;
  } else {
    const nextCommit = commits.get(commit.parents);
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
  commits = new Map();
  head = null;
  const { mainBranchName, mainBranchOrder } = getConfig().gitGraph;
  branches = new Map();
  branches.set(mainBranchName, null);
  branchesConfig = new Map();
  branchesConfig.set(mainBranchName, { name: mainBranchName, order: mainBranchOrder });
  curBranch = mainBranchName;
  seq = 0;
  commonClear();
};

export const getBranchesAsObjArray = function () {
  const branchesArray = [...branchesConfig.values()]
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
  const commitArr = [...commits.values()];
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
  getConfig: () => getConfig().gitGraph,
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
