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
import type { DiagramOrientation, Commit } from './gitGraphTypes.js';

const mainBranchName = defaultConfig.gitGraph.mainBranchName;
const mainBranchOrder = defaultConfig.gitGraph.mainBranchOrder;

let commits = new Map<string, Commit>();
let head: Commit | null = null;
let branchesConfig = new Map<string, { name: string; order: number }>();
branchesConfig.set(mainBranchName, { name: mainBranchName, order: mainBranchOrder });
let branches = new Map<string, string | null>();
branches.set(mainBranchName, null);
let curBranch = mainBranchName;
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
 * @param currentCommit - current commit
 * @param otherCommit - other commit
 */
// function isReachableFrom(currentCommit, otherCommit) {
//   const currentSeq = currentCommit.seq;
//   const otherSeq = otherCommit.seq;
//   if (currentSeq > otherSeq) return isFastForwardable(otherCommit, currentCommit);
//   return false;
// }

/**
 * @param list - list of items
 * @param fn -  function to get the key
 */
function uniqBy(list: any[], fn: (item: any) => any) {
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
  rawOptString = rawOptString?.trim();
  rawOptString = rawOptString || '{}';
  try {
    options = JSON.parse(rawOptString);
  } catch (e: any) {
    log.error('error while parsing gitGraph options', e.message);
  }
};

export const getOptions = function () {
  return options;
};

export const commit = function (msg: string, id: string, type: number, tag: string) {
  log.info('commit', msg, id, type, tag);
  log.debug('Entering commit:', msg, id, type, tag);
  id = common.sanitizeText(id, getConfig());
  msg = common.sanitizeText(msg, getConfig());
  tag = common.sanitizeText(tag, getConfig());
  const newCommit: Commit = {
    id: id ? id : seq + '-' + getId(),
    message: msg,
    seq: seq++,
    type: type,
    tag: tag ? tag : '',
    parents: head == null ? [] : [head.id],
    branch: curBranch,
  };
  head = newCommit;
  log.info('main branch', mainBranchName);
  commits.set(newCommit.id, newCommit);
  branches.set(curBranch, newCommit.id);
  log.debug('in pushCommit ' + newCommit.id);
};

export const branch = function (name: string, order: number) {
  name = common.sanitizeText(name, getConfig());
  if (!branches.has(name)) {
    branches.set(name, head != null ? head.id : null);
    branchesConfig.set(name, { name, order });
    checkout(name);
    log.debug('in createBranch');
  } else {
    throw new Error(
      `Trying to create an existing branch: ${name}. Use 'checkout ${name}' instead.`
    );
  }
};

export const merge = (
  otherBranch: string,
  custom_id?: string,
  override_type?: number,
  custom_tag?: string
): void => {
  otherBranch = common.sanitizeText(otherBranch, getConfig());
  if (custom_id) {
    custom_id = common.sanitizeText(custom_id, getConfig());
  }
  const currentBranchCheck: string | null | undefined = branches.get(curBranch);
  const otherBranchCheck: string | null | undefined = branches.get(otherBranch);
  const currentCommit: Commit | undefined = currentBranchCheck
    ? commits.get(currentBranchCheck)
    : undefined;
  const otherCommit: Commit | undefined = otherBranchCheck
    ? commits.get(otherBranchCheck)
    : undefined;
  if (currentCommit && otherCommit && currentCommit.branch === otherBranch) {
    throw new Error(`Cannot merge branch '${otherBranch}' into itself.`);
  }
  if (curBranch === otherBranch) {
    const error: any = new Error('Incorrect usage of "merge". Cannot merge a branch to itself');
    error.hash = {
      text: 'merge ' + otherBranch,
      token: 'merge ' + otherBranch,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['branch abc'],
    };
    throw error;
  } else if (currentCommit === undefined || !currentCommit) {
    const error: any = new Error(
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
    const error: any = new Error(
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
    const error: any = new Error(
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
    const error: any = new Error('Incorrect usage of "merge". Both branches have same head');
    error.hash = {
      text: 'merge ' + otherBranch,
      token: 'merge ' + otherBranch,
      line: '1',
      loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
      expected: ['branch abc'],
    };
    throw error;
  } else if (custom_id && commits.has(custom_id)) {
    const error: any = new Error(
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
  // if (isFastForwardable(currentCommit, otherCommit)) {
  //   branches.set(curBranch, branches.get(otherBranch));
  //   head = commits.get(branches.get(curBranch));
  // } else {
  // create merge commit

  const verifiedBranch: string = otherBranchCheck ? otherBranchCheck : ''; //figure out a cleaner way to do this

  const commit: Commit = {
    id: custom_id ? custom_id : seq + '-' + getId(),
    message: 'merged branch ' + otherBranch + ' into ' + curBranch,
    seq: seq++,
    parents: [head == null ? null : head.id, verifiedBranch],
    branch: curBranch,
    type: commitType.MERGE,
    customType: override_type, //TODO - need to make customType optional
    customId: custom_id, //TODO - need to make customId optional as well as tag
    tag: custom_tag ? custom_tag : '',
  };
  head = commit;
  commits.set(commit.id, commit);
  branches.set(curBranch, commit.id);
  // }
  log.debug(branches);
  log.debug('in mergeBranch');
};

export const cherryPick = function (
  sourceId: string,
  targetId: string,
  tag: string,
  parentCommitId: string
) {
  log.debug('Entering cherryPick:', sourceId, targetId, tag);
  sourceId = common.sanitizeText(sourceId, getConfig());
  targetId = common.sanitizeText(targetId, getConfig());
  tag = common.sanitizeText(tag, getConfig());
  parentCommitId = common.sanitizeText(parentCommitId, getConfig());

  if (!sourceId || !commits.has(sourceId)) {
    const error: any = new Error(
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

  const sourceCommit = commits.get(sourceId);

  if (
    !sourceCommit ||
    !parentCommitId ||
    !Array.isArray(sourceCommit.parents) ||
    !sourceCommit.parents.includes(parentCommitId)
  ) {
    throw new Error(
      'Invalid operation: The specified parent commit is not an immediate parent of the cherry-picked commit.'
    );
  }
  const sourceCommitBranch = sourceCommit.branch;
  if (sourceCommit.type === commitType.MERGE && !parentCommitId) {
    const error = new Error(
      'Incorrect usage of cherry-pick: If the source commit is a merge commit, an immediate parent commit must be specified.'
    );
    throw error;
  }
  if (!targetId || !commits.has(targetId)) {
    // cherry-pick source commit to current branch

    if (sourceCommitBranch === curBranch) {
      const error: any = new Error(
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
    const currentCommitId = branches.get(curBranch);
    if (currentCommitId === undefined || !currentCommitId) {
      const error: any = new Error(
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

    const currentCommit = commits.get(currentCommitId);
    if (currentCommit === undefined || !currentCommit) {
      const error: any = new Error(
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
      message: 'cherry-picked ' + sourceCommit?.message + ' into ' + curBranch,
      seq: seq++,
      parents: [head == null ? null : head.id, sourceCommit.id],
      branch: curBranch,
      type: commitType.CHERRY_PICK,
      tag:
        tag ??
        `cherry-pick:${sourceCommit.id}${
          sourceCommit.type === commitType.MERGE ? `|parent:${parentCommitId}` : ''
        }`,
    };
    head = commit;
    commits.set(commit.id, commit);
    branches.set(curBranch, commit.id);
    log.debug(branches);
    log.debug('in cherryPick');
  }
};
export const checkout = function (branch: string) {
  branch = common.sanitizeText(branch, getConfig());
  if (!branches.has(branch)) {
    const error: any = new Error(
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
    const id = branches.get(curBranch);
    if (id === undefined || !id) {
      head = null;
    } else {
      head = commits.get(id) ?? null;
    }
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
 * @param arr - array
 * @param key - key
 * @param newVal - new value
 */
function upsert(arr: any[], key: any, newVal: any) {
  const index = arr.indexOf(key);
  if (index === -1) {
    arr.push(newVal);
  } else {
    arr.splice(index, 1, newVal);
  }
}

/** @param commitArr  - array */
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
    if (branches.get(branch) === commit.id) {
      label.push(branch);
    }
  }
  log.debug(label.join(' '));
  if (commit.parents && commit.parents.length == 2 && commit.parents[0] && commit.parents[1]) {
    const newCommit = commits.get(commit.parents[0]);
    upsert(commitArr, commit, newCommit);
    if (commit.parents[1]) {
      commitArr.push(commits.get(commit.parents[1])!);
    }
  } else if (commit.parents.length == 0) {
    return;
  } else {
    if (commit.parents[0]) {
      const newCommit = commits.get(commit.parents[0]);
      upsert(commitArr, commit, newCommit);
    }
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
  const mainBranch = defaultConfig.gitGraph.mainBranchName;
  const mainBranchOrder = defaultConfig.gitGraph.mainBranchOrder;
  branches = new Map();
  branches.set(mainBranch, null);
  branchesConfig = new Map();
  branchesConfig.set(mainBranch, { name: mainBranch, order: mainBranchOrder });
  curBranch = mainBranch;
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
};
