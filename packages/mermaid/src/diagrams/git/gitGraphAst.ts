import { log } from '../../logger.js';
import { cleanAndMerge, random } from '../../utils.js';
import { getConfig as commonGetConfig } from '../../config.js';
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
import type {
  DiagramOrientation,
  Commit,
  GitGraphDB,
  CommitDB,
  MergeDB,
  BranchDB,
  CherryPickDB,
} from './gitGraphTypes.js';
import { commitType } from './gitGraphTypes.js';
import { ImperativeState } from '../../utils/imperativeState.js';

import DEFAULT_CONFIG from '../../defaultConfig.js';

import type { GitGraphDiagramConfig } from '../../config.type.js';
interface GitGraphState {
  commits: Map<string, Commit>;
  head: Commit | null;
  branchConfig: Map<string, { name: string; order: number | undefined }>;
  branches: Map<string, string | null>;
  currBranch: string;
  direction: DiagramOrientation;
  seq: number;
  options: any;
}

const DEFAULT_GITGRAPH_CONFIG: Required<GitGraphDiagramConfig> = DEFAULT_CONFIG.gitGraph;
const getConfig = (): Required<GitGraphDiagramConfig> => {
  const config = cleanAndMerge({
    ...DEFAULT_GITGRAPH_CONFIG,
    ...commonGetConfig().gitGraph,
  });
  return config;
};

const state = new ImperativeState<GitGraphState>(() => {
  const config = getConfig();
  const mainBranchName = config.mainBranchName;
  const mainBranchOrder = config.mainBranchOrder;
  return {
    mainBranchName,
    commits: new Map(),
    head: null,
    branchConfig: new Map([[mainBranchName, { name: mainBranchName, order: mainBranchOrder }]]),
    branches: new Map([[mainBranchName, null]]),
    currBranch: mainBranchName,
    direction: 'LR',
    seq: 0,
    options: {},
  };
});

function getID() {
  return random({ length: 7 });
}

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
  state.records.direction = dir;
};

export const setOptions = function (rawOptString: string) {
  log.debug('options str', rawOptString);
  rawOptString = rawOptString?.trim();
  rawOptString = rawOptString || '{}';
  try {
    state.records.options = JSON.parse(rawOptString);
  } catch (e: any) {
    log.error('error while parsing gitGraph options', e.message);
  }
};

export const getOptions = function () {
  return state.records.options;
};

export const commit = function (commitDB: CommitDB) {
  let msg = commitDB.msg;
  let id = commitDB.id;
  const type = commitDB.type;
  let tags = commitDB.tags;

  log.info('commit', msg, id, type, tags);
  log.debug('Entering commit:', msg, id, type, tags);
  const config = getConfig();
  id = common.sanitizeText(id, config);
  msg = common.sanitizeText(msg, config);
  tags = tags?.map((tag) => common.sanitizeText(tag, config));
  const newCommit: Commit = {
    id: id ? id : state.records.seq + '-' + getID(),
    message: msg,
    seq: state.records.seq++,
    type: type ?? commitType.NORMAL,
    tags: tags ?? [],
    parents: state.records.head == null ? [] : [state.records.head.id],
    branch: state.records.currBranch,
  };
  state.records.head = newCommit;
  log.info('main branch', config.mainBranchName);
  state.records.commits.set(newCommit.id, newCommit);
  state.records.branches.set(state.records.currBranch, newCommit.id);
  log.debug('in pushCommit ' + newCommit.id);
};

export const branch = function (branchDB: BranchDB) {
  let name = branchDB.name;
  const order = branchDB.order;
  name = common.sanitizeText(name, getConfig());
  if (state.records.branches.has(name)) {
    throw new Error(
      `Trying to create an existing branch. (Help: Either use a new name if you want create a new branch or try using "checkout ${name}")`
    );
  }

  state.records.branches.set(name, state.records.head != null ? state.records.head.id : null);
  state.records.branchConfig.set(name, { name, order });
  checkout(name);
  log.debug('in createBranch');
};

export const merge = (mergeDB: MergeDB): void => {
  let otherBranch = mergeDB.branch;
  let customId = mergeDB.id;
  const overrideType = mergeDB.type;
  const customTags = mergeDB.tags;
  const config = getConfig();
  otherBranch = common.sanitizeText(otherBranch, config);
  if (customId) {
    customId = common.sanitizeText(customId, config);
  }
  const currentBranchCheck = state.records.branches.get(state.records.currBranch);
  const otherBranchCheck = state.records.branches.get(otherBranch);
  const currentCommit = currentBranchCheck
    ? state.records.commits.get(currentBranchCheck)
    : undefined;
  const otherCommit: Commit | undefined = otherBranchCheck
    ? state.records.commits.get(otherBranchCheck)
    : undefined;
  if (currentCommit && otherCommit && currentCommit.branch === otherBranch) {
    throw new Error(`Cannot merge branch '${otherBranch}' into itself.`);
  }
  if (state.records.currBranch === otherBranch) {
    const error: any = new Error('Incorrect usage of "merge". Cannot merge a branch to itself');
    error.hash = {
      text: `merge ${otherBranch}`,
      token: `merge ${otherBranch}`,
      expected: ['branch abc'],
    };
    throw error;
  }
  if (currentCommit === undefined || !currentCommit) {
    const error: any = new Error(
      `Incorrect usage of "merge". Current branch (${state.records.currBranch})has no commits`
    );
    error.hash = {
      text: `merge ${otherBranch}`,
      token: `merge ${otherBranch}`,
      expected: ['commit'],
    };
    throw error;
  }
  if (!state.records.branches.has(otherBranch)) {
    const error: any = new Error(
      'Incorrect usage of "merge". Branch to be merged (' + otherBranch + ') does not exist'
    );
    error.hash = {
      text: `merge ${otherBranch}`,
      token: `merge ${otherBranch}`,
      expected: [`branch ${otherBranch}`],
    };
    throw error;
  }
  if (otherCommit === undefined || !otherCommit) {
    const error: any = new Error(
      'Incorrect usage of "merge". Branch to be merged (' + otherBranch + ') has no commits'
    );
    error.hash = {
      text: `merge ${otherBranch}`,
      token: `merge ${otherBranch}`,
      expected: ['"commit"'],
    };
    throw error;
  }
  if (currentCommit === otherCommit) {
    const error: any = new Error('Incorrect usage of "merge". Both branches have same head');
    error.hash = {
      text: `merge ${otherBranch}`,
      token: `merge ${otherBranch}`,
      expected: ['branch abc'],
    };
    throw error;
  }
  if (customId && state.records.commits.has(customId)) {
    const error: any = new Error(
      'Incorrect usage of "merge". Commit with id:' +
        customId +
        ' already exists, use different custom Id'
    );
    error.hash = {
      text: `merge ${otherBranch} ${customId} ${overrideType} ${customTags?.join(' ')}`,
      token: `merge ${otherBranch} ${customId} ${overrideType} ${customTags?.join(' ')}`,
      expected: [
        `merge ${otherBranch} ${customId}_UNIQUE ${overrideType} ${customTags?.join(' ')}`,
      ],
    };

    throw error;
  }

  const verifiedBranch: string = otherBranchCheck ? otherBranchCheck : ''; //figure out a cleaner way to do this

  const commit = {
    id: customId || `${state.records.seq}-${getID()}`,
    message: `merged branch ${otherBranch} into ${state.records.currBranch}`,
    seq: state.records.seq++,
    parents: state.records.head == null ? [] : [state.records.head.id, verifiedBranch],
    branch: state.records.currBranch,
    type: commitType.MERGE,
    customType: overrideType,
    customId: customId ? true : false,
    tags: customTags ?? [],
  } satisfies Commit;
  state.records.head = commit;
  state.records.commits.set(commit.id, commit);
  state.records.branches.set(state.records.currBranch, commit.id);
  log.debug(state.records.branches);
  log.debug('in mergeBranch');
};

export const cherryPick = function (cherryPickDB: CherryPickDB) {
  let sourceId = cherryPickDB.id;
  let targetId = cherryPickDB.targetId;
  let tags = cherryPickDB.tags;
  let parentCommitId = cherryPickDB.parent;
  log.debug('Entering cherryPick:', sourceId, targetId, tags);
  const config = getConfig();
  sourceId = common.sanitizeText(sourceId, config);
  targetId = common.sanitizeText(targetId, config);

  tags = tags?.map((tag) => common.sanitizeText(tag, config));

  parentCommitId = common.sanitizeText(parentCommitId, config);

  if (!sourceId || !state.records.commits.has(sourceId)) {
    const error: any = new Error(
      'Incorrect usage of "cherryPick". Source commit id should exist and provided'
    );
    error.hash = {
      text: `cherryPick ${sourceId} ${targetId}`,
      token: `cherryPick ${sourceId} ${targetId}`,
      expected: ['cherry-pick abc'],
    };
    throw error;
  }

  const sourceCommit = state.records.commits.get(sourceId);
  if (sourceCommit === undefined || !sourceCommit) {
    throw new Error('Incorrect usage of "cherryPick". Source commit id should exist and provided');
  }
  if (
    parentCommitId &&
    !(Array.isArray(sourceCommit.parents) && sourceCommit.parents.includes(parentCommitId))
  ) {
    const error = new Error(
      'Invalid operation: The specified parent commit is not an immediate parent of the cherry-picked commit.'
    );
    throw error;
  }
  const sourceCommitBranch = sourceCommit.branch;
  if (sourceCommit.type === commitType.MERGE && !parentCommitId) {
    const error = new Error(
      'Incorrect usage of cherry-pick: If the source commit is a merge commit, an immediate parent commit must be specified.'
    );
    throw error;
  }
  if (!targetId || !state.records.commits.has(targetId)) {
    // cherry-pick source commit to current branch

    if (sourceCommitBranch === state.records.currBranch) {
      const error: any = new Error(
        'Incorrect usage of "cherryPick". Source commit is already on current branch'
      );
      error.hash = {
        text: `cherryPick ${sourceId} ${targetId}`,
        token: `cherryPick ${sourceId} ${targetId}`,
        expected: ['cherry-pick abc'],
      };
      throw error;
    }
    const currentCommitId = state.records.branches.get(state.records.currBranch);
    if (currentCommitId === undefined || !currentCommitId) {
      const error: any = new Error(
        `Incorrect usage of "cherry-pick". Current branch (${state.records.currBranch})has no commits`
      );
      error.hash = {
        text: `cherryPick ${sourceId} ${targetId}`,
        token: `cherryPick ${sourceId} ${targetId}`,
        expected: ['cherry-pick abc'],
      };
      throw error;
    }

    const currentCommit = state.records.commits.get(currentCommitId);
    if (currentCommit === undefined || !currentCommit) {
      const error: any = new Error(
        `Incorrect usage of "cherry-pick". Current branch (${state.records.currBranch})has no commits`
      );
      error.hash = {
        text: `cherryPick ${sourceId} ${targetId}`,
        token: `cherryPick ${sourceId} ${targetId}`,
        expected: ['cherry-pick abc'],
      };
      throw error;
    }
    const commit = {
      id: state.records.seq + '-' + getID(),
      message: `cherry-picked ${sourceCommit?.message} into ${state.records.currBranch}`,
      seq: state.records.seq++,
      parents: state.records.head == null ? [] : [state.records.head.id, sourceCommit.id],
      branch: state.records.currBranch,
      type: commitType.CHERRY_PICK,
      tags: tags
        ? tags.filter(Boolean)
        : [
            `cherry-pick:${sourceCommit.id}${
              sourceCommit.type === commitType.MERGE ? `|parent:${parentCommitId}` : ''
            }`,
          ],
    };

    state.records.head = commit;
    state.records.commits.set(commit.id, commit);
    state.records.branches.set(state.records.currBranch, commit.id);
    log.debug(state.records.branches);
    log.debug('in cherryPick');
  }
};
export const checkout = function (branch: string) {
  branch = common.sanitizeText(branch, getConfig());
  if (!state.records.branches.has(branch)) {
    const error: any = new Error(
      `Trying to checkout branch which is not yet created. (Help try using "branch ${branch}")`
    );
    error.hash = {
      text: `checkout ${branch}`,
      token: `checkout ${branch}`,
      expected: [`branch ${branch}`],
    };
    throw error;
  } else {
    state.records.currBranch = branch;
    const id = state.records.branches.get(state.records.currBranch);
    if (id === undefined || !id) {
      state.records.head = null;
    } else {
      state.records.head = state.records.commits.get(id) ?? null;
    }
  }
};

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
  for (const branch in state.records.branches) {
    if (state.records.branches.get(branch) === commit.id) {
      label.push(branch);
    }
  }
  log.debug(label.join(' '));
  if (commit.parents && commit.parents.length == 2 && commit.parents[0] && commit.parents[1]) {
    const newCommit = state.records.commits.get(commit.parents[0]);
    upsert(commitArr, commit, newCommit);
    if (commit.parents[1]) {
      commitArr.push(state.records.commits.get(commit.parents[1])!);
    }
  } else if (commit.parents.length == 0) {
    return;
  } else {
    if (commit.parents[0]) {
      const newCommit = state.records.commits.get(commit.parents[0]);
      upsert(commitArr, commit, newCommit);
    }
  }
  commitArr = uniqBy(commitArr, (c) => c.id);
  prettyPrintCommitHistory(commitArr);
}

export const prettyPrint = function () {
  log.debug(state.records.commits);
  const node = getCommitsArray()[0];
  prettyPrintCommitHistory([node]);
};

export const clear = function () {
  state.reset();
  commonClear();
};

export const getBranchesAsObjArray = function () {
  const branchesArray = [...state.records.branchConfig.values()]
    .map((branchConfig, i) => {
      if (branchConfig.order !== null && branchConfig.order !== undefined) {
        return branchConfig;
      }
      return {
        ...branchConfig,
        order: parseFloat(`0.${i}`),
      };
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(({ name }) => ({ name }));

  return branchesArray;
};

export const getBranches = function () {
  return state.records.branches;
};
export const getCommits = function () {
  return state.records.commits;
};
export const getCommitsArray = function () {
  const commitArr = [...state.records.commits.values()];
  commitArr.forEach(function (o) {
    log.debug(o.id);
  });
  commitArr.sort((a, b) => a.seq - b.seq);
  return commitArr;
};
export const getCurrentBranch = function () {
  return state.records.currBranch;
};
export const getDirection = function () {
  return state.records.direction;
};
export const getHead = function () {
  return state.records.head;
};

export const db: GitGraphDB = {
  commitType,
  getConfig,
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
