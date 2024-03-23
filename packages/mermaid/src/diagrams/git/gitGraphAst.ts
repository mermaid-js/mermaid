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
import defaultConfig from '../../defaultConfig.js';
import { CommitType } from './gitGraphTypes.js';

// TODO
type CommitParentGraph = {
  // First element is null, rest is parent
};
type BranchConfig = {
  name: string;
  order: number;
};
type DiagramOrientation = 'LR' | 'TB';
type Commit = {
  id: string;
  message: string;
  seq: number;
  type: CommitType;
  tag: string;
  parents: (string | null)[];
  branch: string;
  customType?: CommitType;
  customId?: boolean;
};

const mainBranchName =
  getConfig()?.gitGraph?.mainBranchName ?? defaultConfig.gitGraph.mainBranchName;

const mainBranchOrder =
  getConfig()?.gitGraph?.mainBranchOrder ?? defaultConfig.gitGraph.mainBranchOrder;
let commits: Record<string, Commit> = {};
let head: Commit | null = null;
let branchesConfig: Record<string, BranchConfig> = {};
branchesConfig[mainBranchName] = { name: mainBranchName, order: mainBranchOrder };
let branches: Record<string, string | null> = {}; // branch name to current commit id
branches[mainBranchName] = head;
let currBranchName = mainBranchName;
let direction: DiagramOrientation = 'LR';
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
// eslint-disable-next-line @cspell/spellchecker
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
//         isFastForwardable(currentCommit, commits[otherCommit.parent[0]]) ||
//         isFastForwardable(currentCommit, commits[otherCommit.parent[1]])
//       );
//     } else {
//       otherCommit = commits[otherCommit.parent];
//     }
//   }
//   log.debug(currentCommit.id, otherCommit.id);
//   return currentCommit.id === otherCommit.id;
// }

// /**
//  * @param currentCommit
//  * @param otherCommit
//  */
// function isReachableFrom(currentCommit, otherCommit) {
//   const currentSeq = currentCommit.seq;
//   const otherSeq = otherCommit.seq;
//   if (currentSeq > otherSeq) return isFastForwardable(otherCommit, currentCommit);
//   return false;
// }

function uniqBy(list: any[], fn: (item: any) => any): any[] {
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

export const setDirection = function (dir: DiagramOrientation) {
  direction = dir;
};

let options = {};
export const setOptions = function (rawOptString: string) {
  log.debug('options str', rawOptString);
  rawOptString = rawOptString && rawOptString.trim();
  rawOptString = rawOptString || '{}';
  try {
    options = JSON.parse(rawOptString);
  } catch (e) {
    if (e instanceof Error) {
      log.error('error while parsing gitGraph options', e.message);
    } else {
      throw e;
    }
  }
};

export const getOptions = function () {
  return options;
};

export const commit = function (msg: string, id: string, type: any, tag: string) {
  log.debug('Entering commit:', msg, id, type, tag);
  id = common.sanitizeText(id, getConfig());
  msg = common.sanitizeText(msg, getConfig());
  tag = common.sanitizeText(tag, getConfig());
  const commit: Commit = {
    id: id ? id : seq + '-' + getId(),
    message: msg,
    seq: seq++,
    type: type ? type : CommitType.NORMAL, // TODO
    tag: tag ? tag : '',
    parents: head == null ? [] : [head.id],
    branch: currBranchName,
  };
  head = commit;
  commits[commit.id] = commit;
  branches[currBranchName] = commit.id;
  log.debug('in pushCommit ' + commit.id);
};

export const branch = function (name: string, order: string) {
  name = common.sanitizeText(name, getConfig());
  if (branches[name] === undefined) {
    const orderInt = parseInt(order, 10);
    if (isNaN(orderInt)) {
      throw new Error('Invalid order provided');
      // TODO - what is this hash?
      // error.hash = {
      //   text: 'branch ' + name,
      //   token: 'branch ' + name,
      //   line: '1',
      //   loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      //   expected: ['Invalid order provided'],
      // };
      // throw error;
    }
    branches[name] = head != null ? head.id : null;
    branchesConfig[name] = { name, order: orderInt };
    checkout(name);
    log.debug('in createBranch');
  } else {
    const error = new Error(
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

export const merge = function (
  otherBranchName: string,
  custom_id: string,
  override_type: CommitType,
  custom_tag: string
) {
  otherBranchName = common.sanitizeText(otherBranchName, getConfig());
  custom_id = common.sanitizeText(custom_id, getConfig());

  const currBranch = branches[currBranchName];
  const otherBranch = branches[otherBranchName];

  let currentCommit;
  let otherCommit;

  if (currBranch != null) {
    currentCommit = commits[currBranch];
  }

  if (otherBranch != null) {
    otherCommit = commits[otherBranch];
  }

  if (currBranchName === otherBranchName) {
    const error = new Error('Incorrect usage of "merge". Cannot merge a branch to itself');
    error.hash = {
      text: 'merge ' + otherBranchName,
      token: 'merge ' + otherBranchName,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['branch abc'],
    };
    throw error;
  } else if (currentCommit === undefined || !currentCommit) {
    const error = new Error(
      'Incorrect usage of "merge". Current branch (' + currBranchName + ')has no commits'
    );
    error.hash = {
      text: 'merge ' + otherBranchName,
      token: 'merge ' + otherBranchName,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['commit'],
    };
    throw error;
  } else if (branches[otherBranchName] === undefined) {
    const error = new Error(
      'Incorrect usage of "merge". Branch to be merged (' + otherBranchName + ') does not exist'
    );
    error.hash = {
      text: 'merge ' + otherBranchName,
      token: 'merge ' + otherBranchName,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['branch ' + otherBranchName],
    };
    throw error;
  } else if (otherCommit === undefined || !otherCommit) {
    const error = new Error(
      'Incorrect usage of "merge". Branch to be merged (' + otherBranchName + ') has no commits'
    );
    error.hash = {
      text: 'merge ' + otherBranchName,
      token: 'merge ' + otherBranchName,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['"commit"'],
    };
    throw error;
  } else if (currentCommit === otherCommit) {
    const error = new Error('Incorrect usage of "merge". Both branches have same head');
    error.hash = {
      text: 'merge ' + otherBranchName,
      token: 'merge ' + otherBranchName,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['branch abc'],
    };
    throw error;
  } else if (custom_id && commits[custom_id] !== undefined) {
    const error = new Error(
      'Incorrect usage of "merge". Commit with id:' +
        custom_id +
        ' already exists, use different custom Id'
    );
    error.hash = {
      text: 'merge ' + otherBranchName + custom_id + override_type + custom_tag,
      token: 'merge ' + otherBranchName + custom_id + override_type + custom_tag,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: [
        'merge ' +
          otherBranchName +
          ' ' +
          custom_id +
          '_UNIQUE ' +
          override_type +
          ' ' +
          custom_tag,
      ],
    };

    throw error;
  }
  // if (isReachableFrom(currentCommit, otherCommit)) {
  //   log.debug('Already merged');
  //   return;
  // }
  // if (isFastForwardable(currentCommit, otherCommit)) {
  //   branches[curBranch] = branches[otherBranch];
  //   head = commits[branches[curBranch]];
  // } else {
  // create merge commit
  const commit: Commit = {
    id: custom_id ? custom_id : seq + '-' + getId(),
    message: 'merged branch ' + otherBranchName + ' into ' + currBranchName,
    seq: seq++,
    parents: [head == null ? null : head.id, branches[otherBranchName]],
    branch: currBranchName,
    type: CommitType.MERGE,
    customType: override_type,
    customId: custom_id ? true : false,
    tag: custom_tag ? custom_tag : '',
  };
  head = commit;
  commits[commit.id] = commit;
  branches[currBranchName] = commit.id;
  // }
  log.debug(branches);
  log.debug('in mergeBranch');
};

export const cherryPick = function (sourceId: string, targetId, tag, parentCommitId) {
  log.debug('Entering cherryPick:', sourceId, targetId, tag);
  sourceId = common.sanitizeText(sourceId, getConfig());
  targetId = common.sanitizeText(targetId, getConfig());
  tag = common.sanitizeText(tag, getConfig());
  parentCommitId = common.sanitizeText(parentCommitId, getConfig());

  if (!sourceId || commits[sourceId] === undefined) {
    const error = new Error(
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
  const sourceCommit = commits[sourceId];
  const sourceCommitBranch = sourceCommit.branch;
  if (
    parentCommitId &&
    !(Array.isArray(sourceCommit.parents) && sourceCommit.parents.includes(parentCommitId))
  ) {
    const error = new Error(
      'Invalid operation: The specified parent commit is not an immediate parent of the cherry-picked commit.'
    );
    throw error;
  }
  if (sourceCommit.type === CommitType.MERGE && !parentCommitId) {
    const error = new Error(
      'Incorrect usage of cherry-pick: If the source commit is a merge commit, an immediate parent commit must be specified.'
    );
    throw error;
  }
  if (!targetId || commits[targetId] === undefined) {
    // cherry-pick source commit to current branch

    if (sourceCommitBranch === currBranchName) {
      const error = new Error(
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

    const currBranch = branches[currBranchName];

    let currentCommit;

    if (currBranch != null) {
      currentCommit = commits[currBranch];
    }

    if (currentCommit === undefined || !currentCommit) {
      const error = new Error(
        'Incorrect usage of "cherry-pick". Current branch (' + currBranchName + ')has no commits'
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
      message: 'cherry-picked ' + sourceCommit + ' into ' + currBranchName,
      seq: seq++,
      parents: [head == null ? null : head.id, sourceCommit.id],
      branch: currBranchName,
      type: CommitType.CHERRY_PICK,
      tag:
        tag ??
        `cherry-pick:${sourceCommit.id}${
          sourceCommit.type === CommitType.MERGE ? `|parent:${parentCommitId}` : ''
        }`,
    };
    head = commit;
    commits[commit.id] = commit;
    branches[currBranchName] = commit.id;
    log.debug(branches);
    log.debug('in cherryPick');
  }
};
export const checkout = function (branch: string) {
  branch = common.sanitizeText(branch, getConfig());
  if (branches[branch] === undefined || ) {
    const error = new Error(
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
    currBranchName = branch;
    const id = branches[currBranchName];
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

function upsert(arr: any[], key: any, newVal: any) {
  const index = arr.indexOf(key);
  if (index === -1) {
    arr.push(newVal);
  } else {
    arr.splice(index, 1, newVal);
  }
}

function prettyPrintCommitHistory(commitArr: Commit[]) {
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
  for (const branch in branches) {
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
  head = null;
  const mainBranch = getConfig().gitGraph?.mainBranchName ?? defaultConfig.gitGraph.mainBranchName;
  const mainBranchOrder = getConfig().gitGraph?.mainBranchOrder ?? defaultConfig.gitGraph.mainBranchOrder;
  branches = {};
  branches[mainBranch] = null;
  branchesConfig = {};
  branchesConfig[mainBranch] = { name: mainBranch, order: mainBranchOrder };
  currBranchName = mainBranch;
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
        order: parseFloat(`0.${i}`),
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
  return currBranchName;
};
export const getDirection = function () {
  return direction;
};
export const getHead = function () {
  return head;
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
  commitType: CommitType,
};
