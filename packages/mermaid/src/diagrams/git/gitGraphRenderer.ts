import { select } from 'd3';
import { getConfig, setupGraphViewbox } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import utils from '../../utils.js';
import type { DrawDefinition } from '../../diagram-api/types.js';
import type d3 from 'd3';
import type { Commit, GitGraphDBRenderProvider, DiagramOrientation } from './gitGraphTypes.js';
import { commitType } from './gitGraphTypes.js';
import type { GitGraphDiagramConfig } from '../../config.type.js';

export interface BranchPosition {
  pos: number;
  index: number;
}

export interface LaneInfo {
  pos: number;
  index: number;
  branches: string[];
  spans: { startSeq: number; endSeq: number }[];
}

interface CommitPosition {
  x: number;
  y: number;
}

interface CommitPositionOffset extends CommitPosition {
  posWithOffset: number;
}

const LAYOUT_OFFSET = 10;
const COMMIT_STEP = 40;
const PX = 4;
const PY = 2;

const THEME_COLOR_LIMIT = 8;

/**
 * Themes that use redux-style geometry — smaller commit bullets, sharper label edges.
 * Note: neo themes are intentionally excluded; they use standard geometry.
 */
const REDUX_GEOMETRY_THEMES = new Set(['redux', 'redux-dark', 'redux-color', 'redux-dark-color']);

/** Vertical padding inside the LR branch label rect for redux themes (`drawBranches` `labelPaddingY`). */
const REDUX_BRANCH_LABEL_PADDING_Y = 12;

/**
 * Themes that use per-branch color cycling with a non-default first color
 * (avoidDefaultColor logic in calcColorIndex).
 */
const COLOR_THEMES = new Set(['redux-color', 'redux-dark-color']);

/** Themes rendered on a dark background. */
const DARK_THEMES = new Set(['dark', 'redux-dark', 'redux-dark-color', 'neo-dark']);

/**
 * Map a raw branch index to a CSS color-class index.
 * When avoidMainColor is true (redux-color / redux-dark-color themes only),
 * non-main branches cycle through 1…(limit-1) so color 0 is never reused.
 * For all other themes the plain modulo is used.
 */
export const calcColorIndex = (
  rawIndex: number,
  limit: number,
  avoidDefaultColor = false
): number => {
  if (avoidDefaultColor && rawIndex > 0) {
    return ((rawIndex - 1) % (limit - 1)) + 1;
  }
  return rawIndex % limit;
};
const branchPos = new Map<string, BranchPosition>();
const commitPos = new Map<string, CommitPosition>();
const defaultPos = 30;

let allCommitsDict = new Map();
let lanes: number[] = [];
let maxPos = 0;
let dir: DiagramOrientation = 'LR';

const clear = () => {
  branchPos.clear();
  commitPos.clear();
  allCommitsDict.clear();
  maxPos = 0;
  lanes = [];
  dir = 'LR';
};

const drawText = (txt: string | string[]) => {
  const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  const rows = typeof txt === 'string' ? txt.split(/\\n|\n|<br\s*\/?>/gi) : txt;

  rows.forEach((row) => {
    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    tspan.setAttribute('dy', '1em');
    tspan.setAttribute('x', '0');
    tspan.setAttribute('class', 'row');
    tspan.textContent = row.trim();
    svgLabel.appendChild(tspan);
  });

  return svgLabel;
};

const findClosestParent = (parents: string[]): string | undefined => {
  let closestParent: string | undefined;
  let comparisonFunc;
  let targetPosition: number;
  if (dir === 'BT') {
    comparisonFunc = (a: number, b: number) => a <= b;
    targetPosition = Infinity;
  } else {
    comparisonFunc = (a: number, b: number) => a >= b;
    targetPosition = 0;
  }

  parents.forEach((parent) => {
    const parentPosition =
      dir === 'TB' || dir == 'BT' ? commitPos.get(parent)?.y : commitPos.get(parent)?.x;

    if (parentPosition !== undefined && comparisonFunc(parentPosition, targetPosition)) {
      closestParent = parent;
      targetPosition = parentPosition;
    }
  });

  return closestParent;
};

const findClosestParentBT = (parents: string[]) => {
  let closestParent = '';
  let maxPosition = Infinity;

  parents.forEach((parent) => {
    const parentPosition = commitPos.get(parent)!.y;
    if (parentPosition <= maxPosition) {
      closestParent = parent;
      maxPosition = parentPosition;
    }
  });
  return closestParent || undefined;
};

const setParallelBTPos = (
  sortedKeys: string[],
  commits: Map<string, Commit>,
  defaultPos: number
) => {
  let curPos = defaultPos;
  let maxPosition = defaultPos;
  const roots: Commit[] = [];

  sortedKeys.forEach((key) => {
    const commit = commits.get(key);
    if (!commit) {
      throw new Error(`Commit not found for key ${key}`);
    }

    if (commit.parents.length) {
      curPos = calculateCommitPosition(commit);
      maxPosition = Math.max(curPos, maxPosition);
    } else {
      roots.push(commit);
    }
    setCommitPosition(commit, curPos);
  });

  curPos = maxPosition;
  roots.forEach((commit) => {
    setRootPosition(commit, curPos, defaultPos);
  });
  sortedKeys.forEach((key) => {
    const commit = commits.get(key);

    if (commit?.parents.length) {
      const closestParent = findClosestParentBT(commit.parents)!;
      curPos = commitPos.get(closestParent)!.y - COMMIT_STEP;
      if (curPos <= maxPosition) {
        maxPosition = curPos;
      }
      const x = branchPos.get(commit.branch)!.pos;
      const y = curPos - LAYOUT_OFFSET;
      commitPos.set(commit.id, { x: x, y: y });
    }
  });
};

const findClosestParentPos = (commit: Commit): number => {
  const closestParent = findClosestParent(commit.parents.filter((p) => p !== null));
  if (!closestParent) {
    throw new Error(`Closest parent not found for commit ${commit.id}`);
  }

  const closestParentPos = commitPos.get(closestParent)?.y;
  if (closestParentPos === undefined) {
    throw new Error(`Closest parent position not found for commit ${commit.id}`);
  }
  return closestParentPos;
};

const calculateCommitPosition = (commit: Commit): number => {
  const closestParentPos = findClosestParentPos(commit);
  return closestParentPos + COMMIT_STEP;
};

const setCommitPosition = (commit: Commit, curPos: number): CommitPosition => {
  const branch = branchPos.get(commit.branch);

  if (!branch) {
    throw new Error(`Branch not found for commit ${commit.id}`);
  }

  const x = branch.pos;
  const y = curPos + LAYOUT_OFFSET;
  commitPos.set(commit.id, { x, y });
  return { x, y };
};

const setRootPosition = (commit: Commit, curPos: number, defaultPos: number) => {
  const branch = branchPos.get(commit.branch);
  if (!branch) {
    throw new Error(`Branch not found for commit ${commit.id}`);
  }

  const y = curPos + defaultPos;
  const x = branch.pos;
  commitPos.set(commit.id, { x, y });
};

const drawCommitBullet = (
  gBullets: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  commit: Commit,
  commitPosition: CommitPositionOffset,
  typeClass: string,
  branchIndex: number,
  commitSymbolType: number
) => {
  const { theme } = getConfig();
  const useReduxGeometry = REDUX_GEOMETRY_THEMES.has(theme ?? '');
  const useColorTheme = COLOR_THEMES.has(theme ?? '');
  const isDark = DARK_THEMES.has(theme ?? '');
  const cx = dir === 'TB' || dir === 'BT' ? commitPosition.x : commitPosition.posWithOffset;
  const cy =
    dir === 'TB' || dir === 'BT'
      ? commitPosition.y
      : commitPosition.x + (useReduxGeometry ? REDUX_BRANCH_LABEL_PADDING_Y / 2 + 1 : -2);
  if (commitSymbolType === commitType.HIGHLIGHT) {
    gBullets
      .append('rect')
      .attr('x', cx - 10 + (useReduxGeometry ? 3 : 0))
      .attr('y', cy - 10 + (useReduxGeometry ? 3 : 0))
      .attr('width', useReduxGeometry ? 14 : 20)
      .attr('height', useReduxGeometry ? 14 : 20)
      .attr(
        'class',
        `commit ${commit.id} commit-highlight${calcColorIndex(branchIndex, THEME_COLOR_LIMIT, useColorTheme)} ${typeClass}-outer`
      );
    gBullets
      .append('rect')
      .attr('x', cx - 6 + (useReduxGeometry ? 2 : 0))
      .attr('y', cy - 6 + (useReduxGeometry ? 2 : 0))
      .attr('width', useReduxGeometry ? 8 : 12)
      .attr('height', useReduxGeometry ? 8 : 12)
      .attr(
        'class',
        `commit ${commit.id} commit${calcColorIndex(branchIndex, THEME_COLOR_LIMIT, useColorTheme)} ${typeClass}-inner`
      );
  } else if (commitSymbolType === commitType.CHERRY_PICK) {
    gBullets
      .append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', useReduxGeometry ? 7 : 10)
      .attr('class', `commit ${commit.id} ${typeClass}`);
    gBullets
      .append('circle')
      .attr('cx', cx - 3)
      .attr('cy', cy + 2)
      .attr('r', useReduxGeometry ? 2.5 : 2.75)
      .attr('fill', isDark ? '#000000' : '#fff')
      .attr('class', `commit ${commit.id} ${typeClass}`);
    gBullets
      .append('circle')
      .attr('cx', cx + 3)
      .attr('cy', cy + 2)
      .attr('r', useReduxGeometry ? 2.5 : 2.75)
      .attr('fill', isDark ? '#000000' : '#fff')
      .attr('class', `commit ${commit.id} ${typeClass}`);
    gBullets
      .append('line')
      .attr('x1', cx + 3)
      .attr('y1', cy + 1)
      .attr('x2', cx)
      .attr('y2', cy - 5)
      .attr('stroke', isDark ? '#000000' : '#fff')
      .attr('class', `commit ${commit.id} ${typeClass}`);
    gBullets
      .append('line')
      .attr('x1', cx - 3)
      .attr('y1', cy + 1)
      .attr('x2', cx)
      .attr('y2', cy - 5)
      .attr('stroke', isDark ? '#000000' : '#fff')
      .attr('class', `commit ${commit.id} ${typeClass}`);
  } else {
    const circle = gBullets.append('circle');
    circle.attr('cx', cx);
    circle.attr('cy', cy);
    circle.attr('r', useReduxGeometry ? 7 : 10);
    circle.attr(
      'class',
      `commit ${commit.id} commit${calcColorIndex(branchIndex, THEME_COLOR_LIMIT, useColorTheme)}`
    );
    if (commitSymbolType === commitType.MERGE) {
      const circle2 = gBullets.append('circle');
      circle2.attr('cx', cx);
      circle2.attr('cy', cy);
      circle2.attr('r', useReduxGeometry ? 5 : 6);
      circle2.attr(
        'class',
        `commit ${typeClass} ${commit.id} commit${calcColorIndex(branchIndex, THEME_COLOR_LIMIT, useColorTheme)}`
      );
    }
    if (commitSymbolType === commitType.REVERSE) {
      const cross = gBullets.append('path');
      const constValue = useReduxGeometry ? 4 : 5;
      cross
        .attr(
          'd',
          `M ${cx - constValue},${cy - constValue}L${cx + constValue},${cy + constValue}M${cx - constValue},${cy + constValue}L${cx + constValue},${cy - constValue}`
        )
        .attr(
          'class',
          `commit ${typeClass} ${commit.id} commit${calcColorIndex(branchIndex, THEME_COLOR_LIMIT, useColorTheme)}`
        );
    }
  }
};

const drawCommitLabel = (
  gLabels: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  commit: Commit,
  commitPosition: CommitPositionOffset,
  pos: number,
  gitGraphConfig: GitGraphDiagramConfig
) => {
  if (
    commit.type !== commitType.CHERRY_PICK &&
    ((commit.customId && commit.type === commitType.MERGE) || commit.type !== commitType.MERGE) &&
    gitGraphConfig.showCommitLabel
  ) {
    const { theme } = getConfig();
    const useReduxGeometry = REDUX_GEOMETRY_THEMES.has(theme ?? '');
    const cx = dir === 'TB' || dir === 'BT' ? commitPosition.x : commitPosition.posWithOffset;
    const cy =
      dir === 'TB' || dir === 'BT'
        ? commitPosition.y
        : commitPosition.x + (useReduxGeometry ? REDUX_BRANCH_LABEL_PADDING_Y / 2 + 1 : -2);
    const wrapper = gLabels.append('g');
    const labelBkg = wrapper.insert('rect').attr('class', 'commit-label-bkg');
    const text = wrapper
      .append('text')
      .attr('x', pos)
      .attr('y', cy + 25)
      .attr('class', 'commit-label')
      .text(commit.id);
    const bbox = text.node()?.getBBox();

    if (bbox) {
      labelBkg
        .attr('x', commitPosition.posWithOffset - bbox.width / 2 - PY)
        .attr('y', cy + 13.5)
        .attr('width', bbox.width + 2 * PY)
        .attr('height', bbox.height + 2 * PY);

      if (dir === 'TB' || dir === 'BT') {
        labelBkg.attr('x', cx - (bbox.width + 4 * PX + 5)).attr('y', cy - 12);
        text.attr('x', cx - (bbox.width + 4 * PX)).attr('y', cy + bbox.height - 12);
      } else {
        text.attr('x', commitPosition.posWithOffset - bbox.width / 2);
      }

      if (gitGraphConfig.rotateCommitLabel) {
        if (dir === 'TB' || dir === 'BT') {
          text.attr('transform', 'rotate(' + -45 + ', ' + cx + ', ' + cy + ')');
          labelBkg.attr('transform', 'rotate(' + -45 + ', ' + cx + ', ' + cy + ')');
        } else {
          const r_x = -7.5 - ((bbox.width + 10) / 25) * 9.5;
          const r_y = 10 + (bbox.width / 25) * 8.5;
          wrapper.attr(
            'transform',
            'translate(' + r_x + ', ' + r_y + ') rotate(' + -45 + ', ' + pos + ', ' + cy + ')'
          );
        }
      }
    }
  }
};

const drawCommitTags = (
  gLabels: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  commit: Commit,
  commitPosition: CommitPositionOffset,
  pos: number
) => {
  if (commit.tags.length > 0) {
    const { theme } = getConfig();
    const useReduxGeometry = REDUX_GEOMETRY_THEMES.has(theme ?? '');
    const cy =
      dir === 'TB' || dir === 'BT'
        ? commitPosition.y
        : commitPosition.x + (useReduxGeometry ? REDUX_BRANCH_LABEL_PADDING_Y / 2 + 1 : -2);
    let yOffset = 0;
    let maxTagBboxWidth = 0;
    let maxTagBboxHeight = 0;
    const tagElements = [];

    for (const tagValue of commit.tags.reverse()) {
      const rect = gLabels.insert('polygon');
      const hole = gLabels.append('circle');
      const tag = gLabels
        .append('text')
        .attr('y', cy - 16 - yOffset)
        .attr('class', 'tag-label')
        .text(tagValue);
      const tagBbox = tag.node()?.getBBox();
      if (!tagBbox) {
        throw new Error('Tag bbox not found');
      }

      maxTagBboxWidth = Math.max(maxTagBboxWidth, tagBbox.width);
      maxTagBboxHeight = Math.max(maxTagBboxHeight, tagBbox.height);

      tag.attr('x', commitPosition.posWithOffset - tagBbox.width / 2);

      tagElements.push({
        tag,
        hole,
        rect,
        yOffset,
      });

      yOffset += 20;
    }

    for (const { tag, hole, rect, yOffset } of tagElements) {
      const h2 = maxTagBboxHeight / 2;
      const ly = cy - 19.2 - yOffset;
      rect.attr('class', 'tag-label-bkg').attr(
        'points',
        `
      ${pos - maxTagBboxWidth / 2 - PX / 2},${ly + PY}
      ${pos - maxTagBboxWidth / 2 - PX / 2},${ly - PY}
      ${commitPosition.posWithOffset - maxTagBboxWidth / 2 - PX},${ly - h2 - PY}
      ${commitPosition.posWithOffset + maxTagBboxWidth / 2 + PX},${ly - h2 - PY}
      ${commitPosition.posWithOffset + maxTagBboxWidth / 2 + PX},${ly + h2 + PY}
      ${commitPosition.posWithOffset - maxTagBboxWidth / 2 - PX},${ly + h2 + PY}`
      );

      hole
        .attr('cy', ly)
        .attr('cx', pos - maxTagBboxWidth / 2 + PX / 2)
        .attr('r', 1.5)
        .attr('class', 'tag-hole');

      if (dir === 'TB' || dir === 'BT') {
        const yOrigin = pos + yOffset;

        rect
          .attr('class', 'tag-label-bkg')
          .attr(
            'points',
            `
        ${commitPosition.x},${yOrigin + 2}
        ${commitPosition.x},${yOrigin - 2}
        ${commitPosition.x + LAYOUT_OFFSET},${yOrigin - h2 - 2}
        ${commitPosition.x + LAYOUT_OFFSET + maxTagBboxWidth + 4},${yOrigin - h2 - 2}
        ${commitPosition.x + LAYOUT_OFFSET + maxTagBboxWidth + 4},${yOrigin + h2 + 2}
        ${commitPosition.x + LAYOUT_OFFSET},${yOrigin + h2 + 2}`
          )
          .attr('transform', 'translate(12,12) rotate(45, ' + commitPosition.x + ',' + pos + ')');
        hole
          .attr('cx', commitPosition.x + PX / 2)
          .attr('cy', yOrigin)
          .attr('transform', 'translate(12,12) rotate(45, ' + commitPosition.x + ',' + pos + ')');
        tag
          .attr('x', commitPosition.x + 5)
          .attr('y', yOrigin + 3)
          .attr('transform', 'translate(14,14) rotate(45, ' + commitPosition.x + ',' + pos + ')');
      }
    }
  }
};

const getCommitClassType = (commit: Commit): string => {
  const commitSymbolType = commit.customType ?? commit.type;
  switch (commitSymbolType) {
    case commitType.NORMAL:
      return 'commit-normal';
    case commitType.REVERSE:
      return 'commit-reverse';
    case commitType.HIGHLIGHT:
      return 'commit-highlight';
    case commitType.MERGE:
      return 'commit-merge';
    case commitType.CHERRY_PICK:
      return 'commit-cherry-pick';
    default:
      return 'commit-normal';
  }
};

const calculatePosition = (
  commit: Commit,
  dir: string,
  pos: number,
  commitPos: Map<string, CommitPosition>
): number => {
  const defaultCommitPosition = { x: 0, y: 0 }; // Default position if commit is not found

  if (commit.parents.length > 0) {
    const closestParent = findClosestParent(commit.parents);
    if (closestParent) {
      const parentPosition = commitPos.get(closestParent) ?? defaultCommitPosition;

      if (dir === 'TB') {
        return parentPosition.y + COMMIT_STEP;
      } else if (dir === 'BT') {
        const currentPosition = commitPos.get(commit.id) ?? defaultCommitPosition;
        return currentPosition.y - COMMIT_STEP;
      } else {
        return parentPosition.x + COMMIT_STEP;
      }
    }
  } else {
    if (dir === 'TB') {
      return defaultPos;
    } else if (dir === 'BT') {
      const currentPosition = commitPos.get(commit.id) ?? defaultCommitPosition;
      return currentPosition.y - COMMIT_STEP;
    } else {
      return 0;
    }
  }
  return 0;
};

const getCommitPosition = (
  commit: Commit,
  pos: number,
  isParallelCommits: boolean
): CommitPositionOffset => {
  const posWithOffset = dir === 'BT' && isParallelCommits ? pos : pos + LAYOUT_OFFSET;
  const x = branchPos.get(commit.branch)?.pos;
  if (x === undefined) {
    throw new Error(`Position were undefined for commit ${commit.id}`);
  }
  const y = posWithOffset;
  return { x, y, posWithOffset };
};

const drawCommits = (
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  commits: Map<string, Commit>,
  modifyGraph: boolean,
  gitGraphConfig: GitGraphDiagramConfig
) => {
  const gBullets = svg.append('g').attr('class', 'commit-bullets');
  const gLabels = svg.append('g').attr('class', 'commit-labels');
  let pos = dir === 'TB' || dir === 'BT' ? defaultPos : 0;
  const keys = [...commits.keys()];
  const isParallelCommits = gitGraphConfig.parallelCommits ?? false;

  const sortKeys = (a: string, b: string) => {
    const seqA = commits.get(a)?.seq;
    const seqB = commits.get(b)?.seq;
    return seqA !== undefined && seqB !== undefined ? seqA - seqB : 0;
  };

  let sortedKeys = keys.sort(sortKeys);
  if (dir === 'BT') {
    if (isParallelCommits) {
      setParallelBTPos(sortedKeys, commits, pos);
    }
    sortedKeys = sortedKeys.reverse();
  }

  sortedKeys.forEach((key) => {
    const commit = commits.get(key);
    if (!commit) {
      throw new Error(`Commit not found for key ${key}`);
    }
    if (isParallelCommits) {
      pos = calculatePosition(commit, dir, pos, commitPos);
    }

    const commitPosition = getCommitPosition(commit, pos, isParallelCommits);
    // Don't draw the commits now but calculate the positioning which is used by the branch lines etc.
    if (modifyGraph) {
      const typeClass = getCommitClassType(commit);
      const commitSymbolType = commit.customType ?? commit.type;
      const branchIndex = branchPos.get(commit.branch)?.index ?? 0;
      drawCommitBullet(gBullets, commit, commitPosition, typeClass, branchIndex, commitSymbolType);
      drawCommitLabel(gLabels, commit, commitPosition, pos, gitGraphConfig);
      drawCommitTags(gLabels, commit, commitPosition, pos);
    }

    if (dir === 'TB') {
      maxPos = Math.max(maxPos, commitPosition.y + 35);
    } else if (dir === 'BT') {
      maxPos = Math.max(maxPos, commitPosition.y + 40);
    } else {
      maxPos = Math.max(maxPos, commitPosition.posWithOffset + 35);
    }

    if (!isParallelCommits) {
      pos += COMMIT_STEP + LAYOUT_OFFSET;
    }
    if (dir === 'TB' || dir === 'BT') {
      commitPos.set(commit.id, { x: commitPosition.x, y: commitPosition.y });
    } else {
      const { theme } = getConfig();
      const useReduxGeometry = REDUX_GEOMETRY_THEMES.has(theme ?? '');
      commitPos.set(commit.id, {
        x: commitPosition.posWithOffset,
        y: commitPosition.x + (useReduxGeometry ? REDUX_BRANCH_LABEL_PADDING_Y / 2 + 1 : -2),
      });
    }
  });
};

const shouldRerouteArrow = (
  commitA: Commit,
  commitB: Commit,
  p1: CommitPosition,
  p2: CommitPosition,
  allCommits: Map<string, Commit>
): boolean => {
  const commitBIsDirectMerge =
    commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0];

  if (commitBIsDirectMerge) {
    return false;
  }

  const branchA = commitA.branch;
  const branchB = commitB.branch;

  const isCrossing = [...allCommits.values()].some((commit) => {
    if (commit.branch === branchA || commit.branch === branchB) {
      return false;
    }

    const pos = commitPos.get(commit.id);
    if (!pos) {
      return false;
    }

    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    return pos.x > minX && pos.x < maxX && pos.y > minY && pos.y < maxY;
  });

  return isCrossing;
};

const findLane = (y1: number, y2: number, depth = 0): number => {
  const candidate = y1 + Math.abs(y1 - y2) / 2;
  if (depth > 5) {
    return candidate;
  }

  const ok = lanes.every((lane) => Math.abs(lane - candidate) >= 10);
  if (ok) {
    lanes.push(candidate);
    return candidate;
  }
  const diff = Math.abs(y1 - y2);
  return findLane(y1, y2 - diff / 5, depth + 1);
};

const drawArrow = (
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  commitA: Commit,
  commitB: Commit,
  allCommits: Map<string, Commit>
) => {
  const { theme: arrowTheme } = getConfig();
  const useColorTheme = COLOR_THEMES.has(arrowTheme ?? '');
  const p1 = commitPos.get(commitA.id); // arrowStart
  const p2 = commitPos.get(commitB.id); // arrowEnd
  if (p1 === undefined || p2 === undefined) {
    throw new Error(`Commit positions not found for commits ${commitA.id} and ${commitB.id}`);
  }
  const arrowNeedsRerouting = shouldRerouteArrow(commitA, commitB, p1, p2, allCommits);
  // log.debug('drawArrow', p1, p2, arrowNeedsRerouting, commitA.id, commitB.id);

  // Lower-right quadrant logic; top-left is 0,0

  let arc = '';
  let arc2 = '';
  let radius = 0;
  let offset = 0;

  let colorClassNum = branchPos.get(commitB.branch)?.index;
  if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
    colorClassNum = branchPos.get(commitA.branch)?.index;
  }

  let lineDef;
  if (arrowNeedsRerouting) {
    arc = 'A 10 10, 0, 0, 0,';
    arc2 = 'A 10 10, 0, 0, 1,';
    radius = 10;
    offset = 10;

    const lineY = p1.y < p2.y ? findLane(p1.y, p2.y) : findLane(p2.y, p1.y);

    const lineX = p1.x < p2.x ? findLane(p1.x, p2.x) : findLane(p2.x, p1.x);

    if (dir === 'TB') {
      if (p1.x < p2.x) {
        // Source commit is on branch position left of destination commit
        // so render arrow rightward with colour of destination branch

        lineDef = `M ${p1.x} ${p1.y} L ${lineX - radius} ${p1.y} ${arc2} ${lineX} ${
          p1.y + offset
        } L ${lineX} ${p2.y - radius} ${arc} ${lineX + offset} ${p2.y} L ${p2.x} ${p2.y}`;
      } else {
        // Source commit is on branch position right of destination commit
        // so render arrow leftward with colour of source branch

        colorClassNum = branchPos.get(commitA.branch)?.index;

        lineDef = `M ${p1.x} ${p1.y} L ${lineX + radius} ${p1.y} ${arc} ${lineX} ${p1.y + offset} L ${lineX} ${p2.y - radius} ${arc2} ${lineX - offset} ${p2.y} L ${p2.x} ${p2.y}`;
      }
    } else if (dir === 'BT') {
      if (p1.x < p2.x) {
        // Source commit is on branch position left of destination commit
        // so render arrow rightward with colour of destination branch

        lineDef = `M ${p1.x} ${p1.y} L ${lineX - radius} ${p1.y} ${arc} ${lineX} ${p1.y - offset} L ${lineX} ${p2.y + radius} ${arc2} ${lineX + offset} ${p2.y} L ${p2.x} ${p2.y}`;
      } else {
        // Source commit is on branch position right of destination commit
        // so render arrow leftward with colour of source branch

        colorClassNum = branchPos.get(commitA.branch)?.index;

        lineDef = `M ${p1.x} ${p1.y} L ${lineX + radius} ${p1.y} ${arc2} ${lineX} ${p1.y - offset} L ${lineX} ${p2.y + radius} ${arc} ${lineX - offset} ${p2.y} L ${p2.x} ${p2.y}`;
      }
    } else {
      if (p1.y < p2.y) {
        // Source commit is on branch positioned above destination commit
        // so render arrow downward with colour of destination branch

        lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${lineY - radius} ${arc} ${
          p1.x + offset
        } ${lineY} L ${p2.x - radius} ${lineY} ${arc2} ${p2.x} ${lineY + offset} L ${p2.x} ${p2.y}`;
      } else {
        // Source commit is on branch positioned below destination commit
        // so render arrow upward with colour of source branch

        colorClassNum = branchPos.get(commitA.branch)?.index;

        lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${lineY + radius} ${arc2} ${
          p1.x + offset
        } ${lineY} L ${p2.x - radius} ${lineY} ${arc} ${p2.x} ${lineY - offset} L ${p2.x} ${p2.y}`;
      }
    }
  } else {
    arc = 'A 20 20, 0, 0, 0,';
    arc2 = 'A 20 20, 0, 0, 1,';
    radius = 20;
    offset = 20;

    if (dir === 'TB') {
      if (p1.x < p2.x) {
        if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
          lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y - radius} ${arc} ${p1.x + offset} ${
            p2.y
          } L ${p2.x} ${p2.y}`;
        } else {
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x - radius} ${p1.y} ${arc2} ${p2.x} ${
            p1.y + offset
          } L ${p2.x} ${p2.y}`;
        }
      }

      if (p1.x > p2.x) {
        arc = 'A 20 20, 0, 0, 0,';
        arc2 = 'A 20 20, 0, 0, 1,';
        radius = 20;
        offset = 20;
        if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
          lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y - radius} ${arc2} ${p1.x - offset} ${
            p2.y
          } L ${p2.x} ${p2.y}`;
        } else {
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x + radius} ${p1.y} ${arc} ${p2.x} ${
            p1.y + offset
          } L ${p2.x} ${p2.y}`;
        }
      }
      if (p1.x === p2.x) {
        lineDef = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
      }
    } else if (dir === 'BT') {
      if (p1.x < p2.x) {
        if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
          lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y + radius} ${arc2} ${p1.x + offset} ${
            p2.y
          } L ${p2.x} ${p2.y}`;
        } else {
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x - radius} ${p1.y} ${arc} ${p2.x} ${
            p1.y - offset
          } L ${p2.x} ${p2.y}`;
        }
      }
      if (p1.x > p2.x) {
        arc = 'A 20 20, 0, 0, 0,';
        arc2 = 'A 20 20, 0, 0, 1,';
        radius = 20;
        offset = 20;

        if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
          lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y + radius} ${arc} ${p1.x - offset} ${
            p2.y
          } L ${p2.x} ${p2.y}`;
        } else {
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x + radius} ${p1.y} ${arc2} ${p2.x} ${
            p1.y - offset
          } L ${p2.x} ${p2.y}`;
        }
      }

      if (p1.x === p2.x) {
        lineDef = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
      }
    } else {
      if (p1.y < p2.y) {
        if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x - radius} ${p1.y} ${arc2} ${p2.x} ${
            p1.y + offset
          } L ${p2.x} ${p2.y}`;
        } else {
          lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y - radius} ${arc} ${p1.x + offset} ${
            p2.y
          } L ${p2.x} ${p2.y}`;
        }
      }
      if (p1.y > p2.y) {
        if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x - radius} ${p1.y} ${arc} ${p2.x} ${
            p1.y - offset
          } L ${p2.x} ${p2.y}`;
        } else {
          lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y + radius} ${arc2} ${p1.x + offset} ${
            p2.y
          } L ${p2.x} ${p2.y}`;
        }
      }

      if (p1.y === p2.y) {
        lineDef = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
      }
    }
  }
  if (lineDef === undefined) {
    throw new Error('Line definition not found');
  }
  svg
    .append('path')
    .attr('d', lineDef)
    .attr(
      'class',
      'arrow arrow' + calcColorIndex(colorClassNum!, THEME_COLOR_LIMIT, useColorTheme)
    );
};

const drawArrows = (
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  commits: Map<string, Commit>
) => {
  const gArrows = svg.append('g').attr('class', 'commit-arrows');
  [...commits.keys()].forEach((key) => {
    const commit = commits.get(key);

    if (commit!.parents && commit!.parents.length > 0) {
      commit!.parents.forEach((parent) => {
        drawArrow(gArrows, commits.get(parent)!, commit!, commits);
      });
    }
  });
};

const drawBranchLines = (
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  branches: { name: string }[],
  allocatedLanes?: LaneInfo[]
) => {
  const { theme, themeVariables } = getConfig();
  const { THEME_COLOR_LIMIT: themeColorLimit } = themeVariables;
  const useReduxGeometry = REDUX_GEOMETRY_THEMES.has(theme ?? '');
  const useColorTheme = COLOR_THEMES.has(theme ?? '');
  const gLines = svg.append('g').attr('class', 'branch-lines');

  branches.forEach((branch, index) => {
    const pos = branchPos.get(branch.name)?.pos;
    if (pos === undefined) {
      throw new Error(`Position not found for branch ${branch.name}`);
    }
    const branchIndex = branchPos.get(branch.name)?.index ?? index;
    const adjustIndexForTheme = calcColorIndex(
      branchIndex,
      useReduxGeometry ? themeColorLimit : THEME_COLOR_LIMIT,
      useColorTheme
    );

    const lane = allocatedLanes?.find((l) => l.branches.includes(branch.name));
    const isSharedLane = (lane?.branches.length ?? 0) > 1;
    const isFirstBranchOnLane = !lane || lane.branches[0] === branch.name;

    // LR spine Y: bkg rect center, dotted line, and commits all sit here.
    // TB/BT use pos directly (their line attrs are overridden below).
    const spineY =
      dir === 'TB' || dir === 'BT'
        ? pos
        : useReduxGeometry
          ? pos + REDUX_BRANCH_LABEL_PADDING_Y / 2 + 1
          : pos - 2;

    lanes.push(spineY);

    const bCommits = [...allCommitsDict.values()].filter((c) => c.branch === branch.name);
    const bMerges = [...allCommitsDict.values()].filter(
      (c) =>
        c.branch !== branch.name &&
        c.parents?.some((p: string) => allCommitsDict.get(p)?.branch === branch.name)
    );

    const line = gLines.append('line');
    line.attr('class', 'branch branch' + adjustIndexForTheme);

    if (dir === 'TB') {
      const yCoords = bCommits
        .map((c) => commitPos.get(c.id)?.y)
        .filter((y): y is number => y !== undefined);
      const mergeYCoords = bMerges
        .map((c) => commitPos.get(c.id)?.y)
        .filter((y): y is number => y !== undefined);
      const allY = [...yCoords, ...mergeYCoords];

      if (!isSharedLane) {
        line.attr('x1', pos);
        line.attr('y1', defaultPos);
        line.attr('x2', pos);
        line.attr('y2', maxPos);
      } else if (isFirstBranchOnLane) {
        const lastY = allY.length > 0 ? Math.max(...allY) : maxPos;
        line.attr('x1', pos);
        line.attr('y1', defaultPos);
        line.attr('x2', pos);
        line.attr('y2', lastY);
      } else {
        const firstY =
          yCoords.length > 0
            ? Math.min(...yCoords)
            : allY.length > 0
              ? Math.min(...allY)
              : defaultPos;
        const lastY = allY.length > 0 ? Math.max(...allY) : maxPos;
        line.attr('x1', pos);
        line.attr('y1', firstY);
        line.attr('x2', pos);
        line.attr('y2', lastY);
      }
    } else if (dir === 'BT') {
      const yCoords = bCommits
        .map((c) => commitPos.get(c.id)?.y)
        .filter((y): y is number => y !== undefined);
      const mergeYCoords = bMerges
        .map((c) => commitPos.get(c.id)?.y)
        .filter((y): y is number => y !== undefined);
      const allY = [...yCoords, ...mergeYCoords];

      if (!isSharedLane) {
        line.attr('x1', pos);
        line.attr('y1', maxPos);
        line.attr('x2', pos);
        line.attr('y2', defaultPos);
      } else if (isFirstBranchOnLane) {
        const minY = allY.length > 0 ? Math.min(...allY) : defaultPos;
        line.attr('x1', pos);
        line.attr('y1', maxPos);
        line.attr('x2', pos);
        line.attr('y2', minY);
      } else {
        const firstY =
          yCoords.length > 0 ? Math.max(...yCoords) : allY.length > 0 ? Math.max(...allY) : maxPos;
        const minY = allY.length > 0 ? Math.min(...allY) : defaultPos;
        line.attr('x1', pos);
        line.attr('y1', firstY);
        line.attr('x2', pos);
        line.attr('y2', minY);
      }
    } else {
      // LR direction
      const xCoords = bCommits
        .map((c) => commitPos.get(c.id)?.x)
        .filter((x): x is number => x !== undefined);
      const mergeXCoords = bMerges
        .map((c) => commitPos.get(c.id)?.x)
        .filter((x): x is number => x !== undefined);
      const allX = [...xCoords, ...mergeXCoords];

      if (!isSharedLane) {
        line.attr('x1', 0);
        line.attr('y1', spineY);
        line.attr('x2', maxPos);
        line.attr('y2', spineY);
      } else if (isFirstBranchOnLane) {
        const lastX = allX.length > 0 ? Math.max(...allX) : maxPos;
        line.attr('x1', 0);
        line.attr('y1', spineY);
        line.attr('x2', lastX);
        line.attr('y2', spineY);
      } else {
        const firstX =
          xCoords.length > 0 ? Math.min(...xCoords) : allX.length > 0 ? Math.min(...allX) : 0;
        const lastX = allX.length > 0 ? Math.max(...allX) : maxPos;
        line.attr('x1', firstX);
        line.attr('y1', spineY);
        line.attr('x2', lastX);
        line.attr('y2', spineY);
      }
    }
  });
};

const drawBranchLabels = (
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  branches: { name: string }[],
  gitGraphConfig: GitGraphDiagramConfig,
  id: string,
  allocatedLanes?: LaneInfo[]
) => {
  const { look, theme, themeVariables } = getConfig();
  const { dropShadow, THEME_COLOR_LIMIT: themeColorLimit } = themeVariables;
  const useReduxGeometry = REDUX_GEOMETRY_THEMES.has(theme ?? '');
  const useColorTheme = COLOR_THEMES.has(theme ?? '');
  const gLabels = svg.append('g').attr('class', 'branch-labels');

  branches.forEach((branch, index) => {
    const pos = branchPos.get(branch.name)?.pos;
    if (pos === undefined) {
      throw new Error(`Position not found for branch ${branch.name}`);
    }
    const branchIndex = branchPos.get(branch.name)?.index ?? index;
    const adjustIndexForTheme = calcColorIndex(
      branchIndex,
      useReduxGeometry ? themeColorLimit : THEME_COLOR_LIMIT,
      useColorTheme
    );

    const lane = allocatedLanes?.find((l) => l.branches.includes(branch.name));
    const isSharedLane = (lane?.branches.length ?? 0) > 1;
    const isFirstBranchOnLane = !lane || lane.branches[0] === branch.name;

    const spineY =
      dir === 'TB' || dir === 'BT'
        ? pos
        : useReduxGeometry
          ? pos + REDUX_BRANCH_LABEL_PADDING_Y / 2 + 1
          : pos - 2;

    const name = branch.name;

    // Create the actual text element
    const labelElement = drawText(name);
    // Create outer g, edgeLabel, this will be positioned after graph layout
    const bkg = gLabels.append('rect');
    const branchLabel = gLabels.append('g').attr('class', 'branchLabel');

    // Create inner g, label, this will be positioned now for centering the text
    const label = branchLabel.append('g').attr('class', 'label branch-label' + adjustIndexForTheme);

    label.node()!.appendChild(labelElement);
    const bbox = labelElement.getBBox();
    const borderRadius = useReduxGeometry ? 0 : 4;
    const labelPaddingX = useReduxGeometry ? 16 : 0;
    const labelPaddingY = useReduxGeometry ? REDUX_BRANCH_LABEL_PADDING_Y : 0;
    if (look === 'neo') {
      bkg.attr('data-look', `neo`);
    }

    const bCommits = [...allCommitsDict.values()].filter((c) => c.branch === branch.name);
    const bMerges = [...allCommitsDict.values()].filter(
      (c) =>
        c.branch !== branch.name &&
        c.parents?.some((p: string) => allCommitsDict.get(p)?.branch === branch.name)
    );

    if (dir === 'TB') {
      const yCoords = bCommits
        .map((c) => commitPos.get(c.id)?.y)
        .filter((y): y is number => y !== undefined);
      const mergeYCoords = bMerges
        .map((c) => commitPos.get(c.id)?.y)
        .filter((y): y is number => y !== undefined);
      const allY = [...yCoords, ...mergeYCoords];

      if (!isSharedLane || isFirstBranchOnLane) {
        bkg.attr('x', pos - bbox.width / 2 - 10).attr('y', 0);
        label.attr('transform', 'translate(' + (pos - bbox.width / 2 - 5) + ', ' + 0 + ')');
        if (useReduxGeometry) {
          bkg.attr('transform', `translate(${-labelPaddingX / 2 - 3}, ${-labelPaddingY - 10})`);
          label.attr(
            'transform',
            'translate(' + (pos - bbox.width / 2 - 5) + ', ' + (-labelPaddingY * 2 + 7) + ')'
          );
        }
      } else {
        const firstY =
          yCoords.length > 0
            ? Math.min(...yCoords)
            : allY.length > 0
              ? Math.min(...allY)
              : defaultPos;
        const badgeY = firstY - 35;
        bkg.attr('x', pos - bbox.width / 2 - 10).attr('y', badgeY);
        label.attr('transform', 'translate(' + (pos - bbox.width / 2 - 5) + ', ' + badgeY + ')');
        if (useReduxGeometry) {
          bkg.attr('transform', `translate(${-labelPaddingX / 2 - 3}, ${-labelPaddingY - 10})`);
          label.attr(
            'transform',
            'translate(' +
              (pos - bbox.width / 2 - 5) +
              ', ' +
              (badgeY - labelPaddingY * 2 + 7) +
              ')'
          );
        }
      }
    } else if (dir === 'BT') {
      const yCoords = bCommits
        .map((c) => commitPos.get(c.id)?.y)
        .filter((y): y is number => y !== undefined);
      const mergeYCoords = bMerges
        .map((c) => commitPos.get(c.id)?.y)
        .filter((y): y is number => y !== undefined);
      const allY = [...yCoords, ...mergeYCoords];

      if (!isSharedLane || isFirstBranchOnLane) {
        bkg.attr('x', pos - bbox.width / 2 - 10).attr('y', maxPos);
        label.attr('transform', 'translate(' + (pos - bbox.width / 2 - 5) + ', ' + maxPos + ')');
        if (useReduxGeometry) {
          bkg.attr('transform', `translate(${-labelPaddingX / 2 - 3}, ${labelPaddingY + 10})`);
          label.attr(
            'transform',
            'translate(' +
              (pos - bbox.width / 2 - 5) +
              ', ' +
              (maxPos + labelPaddingY * 2 + 4) +
              ')'
          );
        }
      } else {
        const firstY =
          yCoords.length > 0 ? Math.max(...yCoords) : allY.length > 0 ? Math.max(...allY) : maxPos;
        const badgeY = firstY + 15;
        bkg.attr('x', pos - bbox.width / 2 - 10).attr('y', badgeY);
        label.attr('transform', 'translate(' + (pos - bbox.width / 2 - 5) + ', ' + badgeY + ')');
        if (useReduxGeometry) {
          bkg.attr('transform', `translate(${-labelPaddingX / 2 - 3}, ${labelPaddingY + 10})`);
          label.attr(
            'transform',
            'translate(' +
              (pos - bbox.width / 2 - 5) +
              ', ' +
              (badgeY + labelPaddingY * 2 + 4) +
              ')'
          );
        }
      }
    } else {
      // LR direction
      const xCoords = bCommits
        .map((c) => commitPos.get(c.id)?.x)
        .filter((x): x is number => x !== undefined);
      const mergeXCoords = bMerges
        .map((c) => commitPos.get(c.id)?.x)
        .filter((x): x is number => x !== undefined);
      const allX = [...xCoords, ...mergeXCoords];

      if (!isSharedLane || isFirstBranchOnLane) {
        bkg
          .attr('x', -bbox.width - 4 - (gitGraphConfig.rotateCommitLabel === true ? 30 : 0))
          .attr('y', -bbox.height / 2 + 10)
          .attr('transform', 'translate(-19, ' + (spineY - 12 - labelPaddingY / 2) + ')');

        label.attr(
          'transform',
          'translate(' +
            (-bbox.width -
              14 -
              (gitGraphConfig.rotateCommitLabel === true ? 30 : 0) +
              labelPaddingX / 2) +
            ', ' +
            (spineY - bbox.height / 2 - 2) +
            ')'
        );
      } else {
        const firstX =
          xCoords.length > 0 ? Math.min(...xCoords) : allX.length > 0 ? Math.min(...allX) : 0;
        const badgeWidth = bbox.width + 18 + labelPaddingX;
        const badgeX = Math.max(0, firstX - badgeWidth - 15);

        bkg
          .attr('x', badgeX)
          .attr('y', -bbox.height / 2 + 10)
          .attr('transform', 'translate(0, ' + (spineY - 12 - labelPaddingY / 2) + ')');

        label.attr(
          'transform',
          'translate(' +
            (badgeX + 10 + labelPaddingX / 2) +
            ', ' +
            (spineY - bbox.height / 2 - 2) +
            ')'
        );
      }
    }

    bkg
      .attr('class', 'branchLabelBkg label' + adjustIndexForTheme)
      .attr(
        'style',
        look === 'neo' ? `filter:${useReduxGeometry ? `url(#${id}-drop-shadow)` : dropShadow}` : ''
      )
      .attr('rx', borderRadius)
      .attr('ry', borderRadius)
      .attr('width', bbox.width + 18 + labelPaddingX)
      .attr('height', bbox.height + 4 + labelPaddingY);
  });
};

export const setBranchPosition = function (
  name: string,
  pos: number,
  index: number,
  bbox: DOMRect,
  rotateCommitLabel: boolean
): number {
  branchPos.set(name, { pos, index });
  pos += 50 + (rotateCommitLabel ? 40 : 0) + (dir === 'TB' || dir === 'BT' ? bbox.width / 2 : 0);
  return pos;
};

export const draw: DrawDefinition = function (txt, id, ver, diagObj) {
  clear();

  log.debug('in gitgraph renderer', txt + '\n', 'id:', id, ver);
  const db = diagObj.db as GitGraphDBRenderProvider;
  if (!db.getConfig) {
    log.error('getConfig method is not available on db');
    return;
  }
  const gitGraphConfig = db.getConfig();
  const rotateCommitLabel = gitGraphConfig.rotateCommitLabel ?? false;
  allCommitsDict = db.getCommits();
  const branches = db.getBranchesAsObjArray();
  dir = db.getDirection();
  const diagram = select(`[id="${id}"]`);

  // Add linearGradient for neo look — render.ts does this for layout-based diagrams,
  // but gitGraph uses its own draw function so we must define it here.
  const { look, theme, themeVariables } = getConfig();
  const { useGradient, gradientStart, gradientStop, filterColor } = themeVariables;
  if (useGradient) {
    const gradient = diagram
      .append('defs')
      .append('linearGradient')
      .attr('id', id + '-gradient')
      .attr('gradientUnits', 'objectBoundingBox')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', gradientStart)
      .attr('stop-opacity', 1);
    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', gradientStop)
      .attr('stop-opacity', 1);
  }

  // Add drop-shadow SVG filter for neo+redux look. Defined once on the root <svg>
  // with a diagram-unique ID to avoid collisions when multiple diagrams share the page.
  if (look === 'neo' && REDUX_GEOMETRY_THEMES.has(theme ?? '')) {
    diagram
      .append('defs')
      .append('filter')
      .attr('id', id + '-drop-shadow')
      .attr('height', '130%')
      .attr('width', '130%')
      .append('feDropShadow')
      .attr('dx', '4')
      .attr('dy', '4')
      .attr('stdDeviation', 0)
      .attr('flood-opacity', '0.06')
      .attr('flood-color', filterColor);
  }

  const branchBBoxes = new Map<string, DOMRect>();
  branches.forEach((branch) => {
    const labelElement = drawText(branch.name);
    const g = diagram.append('g');
    const branchLabel = g.insert('g').attr('class', 'branchLabel');
    const label = branchLabel.insert('g').attr('class', 'label branch-label');
    label.node()?.appendChild(labelElement);
    const bbox = labelElement.getBBox();
    branchBBoxes.set(branch.name, bbox);
    label.remove();
    branchLabel.remove();
    g.remove();
  });

  const mainBranchName = gitGraphConfig.mainBranchName ?? 'main';
  const reuseBranchLanes = gitGraphConfig.reuseBranchLanes ?? false;
  const { branchPosMap, allocatedLanes } = allocateBranchPositions(
    branches,
    allCommitsDict,
    branchBBoxes,
    rotateCommitLabel,
    mainBranchName,
    reuseBranchLanes
  );

  branchPosMap.forEach((val, key) => {
    branchPos.set(key, val);
  });

  drawCommits(diagram, allCommitsDict, false, gitGraphConfig);
  if (gitGraphConfig.showBranches) {
    drawBranchLines(diagram, branches, allocatedLanes);
  }
  drawArrows(diagram, allCommitsDict);
  if (gitGraphConfig.showBranches) {
    // draw branch labels after arrows so they're shown on top of the arrow
    drawBranchLabels(diagram, branches, gitGraphConfig, id, allocatedLanes);
  }
  drawCommits(diagram, allCommitsDict, true, gitGraphConfig);

  utils.insertTitle(
    diagram,
    'gitTitleText',
    gitGraphConfig.titleTopMargin ?? 0,
    db.getDiagramTitle()
  );

  // Setup the view box and size of the svg element
  setupGraphViewbox(undefined, diagram, gitGraphConfig.diagramPadding, gitGraphConfig.useMaxWidth);
};

export const allocateBranchPositions = (
  branches: { name: string }[],
  commits: Map<string, Commit>,
  branchBBoxes: Map<string, DOMRect>,
  rotateCommitLabel: boolean,
  mainBranchName = 'main',
  reuseBranchLanes = false
): { branchPosMap: Map<string, BranchPosition>; allocatedLanes: LaneInfo[] } => {
  const branchPosMap = new Map<string, BranchPosition>();
  const allocatedLanes: LaneInfo[] = [];

  // Calculate spans for all branches
  const branchSpans = new Map<string, { startSeq: number; endSeq: number }>();
  branches.forEach((branch) => {
    if (branch.name === mainBranchName) {
      branchSpans.set(branch.name, { startSeq: 0, endSeq: Infinity });
    } else {
      const branchCommits = [...commits.values()].filter((c) => c.branch === branch.name);
      const mergeCommits = [...commits.values()].filter(
        (commit) =>
          commit.branch !== branch.name &&
          commit.parents?.some((pId) => commits.get(pId)?.branch === branch.name)
      );
      const allInvolved = [...branchCommits, ...mergeCommits];
      if (allInvolved.length > 0) {
        const startSeq =
          branchCommits.length > 0
            ? Math.min(...branchCommits.map((c) => c.seq))
            : Math.min(...allInvolved.map((c) => c.seq));
        const endSeq = Math.max(...allInvolved.map((c) => c.seq));
        branchSpans.set(branch.name, { startSeq, endSeq });
      } else {
        branchSpans.set(branch.name, { startSeq: 0, endSeq: 0 });
      }
    }
  });

  let currentPos = 0;

  // place branches in lanes
  branches.forEach((b) => {
    const name = b.name;
    const span = branchSpans.get(name) ?? { startSeq: 0, endSeq: 0 };
    const bbox = branchBBoxes.get(name) ?? ({ width: 0, height: 0 } as DOMRect);

    if (name === mainBranchName) {
      const lane0: LaneInfo = {
        pos: 0,
        index: 0,
        branches: [name],
        spans: [span],
      };
      allocatedLanes.push(lane0);
      branchPosMap.set(name, { pos: 0, index: 0 });
      currentPos +=
        50 + (rotateCommitLabel ? 40 : 0) + (dir === 'TB' || dir === 'BT' ? bbox.width / 2 : 0);
      return;
    }

    // Try to find an existing lane (excluding lane 0) where this branch fits without overlap
    let targetLane: LaneInfo | undefined;
    if (reuseBranchLanes) {
      for (let l = 1; l < allocatedLanes.length; l++) {
        const candidateLane = allocatedLanes[l];
        const hasOverlap = candidateLane.spans.some(
          (s) => !(span.endSeq < s.startSeq || span.startSeq > s.endSeq)
        );
        if (!hasOverlap) {
          targetLane = candidateLane;
          break;
        }
      }
    }

    if (targetLane) {
      targetLane.branches.push(name);
      targetLane.spans.push(span);
      branchPosMap.set(name, { pos: targetLane.pos, index: targetLane.index });
    } else {
      const laneIndex = allocatedLanes.length;
      const newLane: LaneInfo = {
        pos: currentPos,
        index: laneIndex,
        branches: [name],
        spans: [span],
      };
      allocatedLanes.push(newLane);
      branchPosMap.set(name, { pos: currentPos, index: laneIndex });
      currentPos +=
        50 + (rotateCommitLabel ? 40 : 0) + (dir === 'TB' || dir === 'BT' ? bbox.width / 2 : 0);
    }
  });

  return { branchPosMap, allocatedLanes };
};

export default {
  draw,
};

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;

  describe('drawText', () => {
    it('should drawText', () => {
      const svgLabel = drawText('main');
      expect(svgLabel).toBeDefined();
      expect(svgLabel.children[0].innerHTML).toBe('main');
    });
  });

  describe('branchPosition', () => {
    const bbox: DOMRect = {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => '',
    };

    it('should setBranchPositions LR with two branches', () => {
      dir = 'LR';

      const pos = setBranchPosition('main', 0, 0, bbox, true);
      expect(pos).toBe(90);
      expect(branchPos.get('main')).toEqual({ pos: 0, index: 0 });
      const posNext = setBranchPosition('develop', pos, 1, bbox, true);
      expect(posNext).toBe(180);
      expect(branchPos.get('develop')).toEqual({ pos: pos, index: 1 });
    });

    it('should setBranchPositions TB with two branches', () => {
      dir = 'TB';
      bbox.width = 34.9921875;

      const pos = setBranchPosition('main', 0, 0, bbox, true);
      expect(pos).toBe(107.49609375);
      expect(branchPos.get('main')).toEqual({ pos: 0, index: 0 });

      bbox.width = 56.421875;
      const posNext = setBranchPosition('develop', pos, 1, bbox, true);
      expect(posNext).toBe(225.70703125);
      expect(branchPos.get('develop')).toEqual({ pos: pos, index: 1 });
    });
  });

  describe('allocateBranchPositions', () => {
    const bbox: DOMRect = {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => '',
    };
    const branchBBoxes = new Map<string, DOMRect>([
      ['main', bbox],
      ['b1', bbox],
      ['b2', bbox],
      ['b3', bbox],
    ]);

    it('should NOT reuse lanes when reuseBranchLanes is false (default)', () => {
      const branches = [{ name: 'main' }, { name: 'b1' }, { name: 'b2' }];
      const commits = new Map<string, Commit>([
        ['c0', { id: 'c0', message: '', seq: 0, type: 0, tags: [], parents: [], branch: 'main' }],
        ['c1', { id: 'c1', message: '', seq: 1, type: 0, tags: [], parents: ['c0'], branch: 'b1' }],
        [
          'c2',
          {
            id: 'c2',
            message: '',
            seq: 2,
            type: 3,
            tags: [],
            parents: ['c0', 'c1'],
            branch: 'main',
          },
        ],
        [
          'c3',
          { id: 'c3', message: '', seq: 3, type: 0, tags: [], parents: ['c2'], branch: 'main' },
        ],
        ['c4', { id: 'c4', message: '', seq: 4, type: 0, tags: [], parents: ['c3'], branch: 'b2' }],
        [
          'c5',
          {
            id: 'c5',
            message: '',
            seq: 5,
            type: 3,
            tags: [],
            parents: ['c3', 'c4'],
            branch: 'main',
          },
        ],
      ]);

      const { branchPosMap, allocatedLanes } = allocateBranchPositions(
        branches,
        commits,
        branchBBoxes,
        false,
        'main',
        false
      );
      expect(branchPosMap.get('b1')?.index).toBe(1);
      expect(branchPosMap.get('b2')?.index).toBe(2);
      expect(branchPosMap.get('b2')!.pos).toBeGreaterThan(branchPosMap.get('b1')!.pos);
      expect(allocatedLanes.length).toBe(3);
    });

    it('should reuse lane and color index for sequential non-overlapping branches', () => {
      const branches = [{ name: 'main' }, { name: 'b1' }, { name: 'b2' }];
      const commits = new Map<string, Commit>([
        ['c0', { id: 'c0', message: '', seq: 0, type: 0, tags: [], parents: [], branch: 'main' }],
        ['c1', { id: 'c1', message: '', seq: 1, type: 0, tags: [], parents: ['c0'], branch: 'b1' }],
        [
          'c2',
          {
            id: 'c2',
            message: '',
            seq: 2,
            type: 3,
            tags: [],
            parents: ['c0', 'c1'],
            branch: 'main',
          },
        ],
        [
          'c3',
          { id: 'c3', message: '', seq: 3, type: 0, tags: [], parents: ['c2'], branch: 'main' },
        ],
        ['c4', { id: 'c4', message: '', seq: 4, type: 0, tags: [], parents: ['c3'], branch: 'b2' }],
        [
          'c5',
          {
            id: 'c5',
            message: '',
            seq: 5,
            type: 3,
            tags: [],
            parents: ['c3', 'c4'],
            branch: 'main',
          },
        ],
      ]);

      const { branchPosMap, allocatedLanes } = allocateBranchPositions(
        branches,
        commits,
        branchBBoxes,
        false,
        'main',
        true
      );

      expect(branchPosMap.get('main')).toEqual({ pos: 0, index: 0 });
      expect(branchPosMap.get('b1')?.index).toBe(1);
      expect(branchPosMap.get('b2')?.index).toBe(1);
      expect(branchPosMap.get('b1')?.pos).toBe(branchPosMap.get('b2')?.pos);
      expect(allocatedLanes.length).toBe(2);
      expect(allocatedLanes[1].branches).toEqual(['b1', 'b2']);
    });

    it('should allocate a separate lane and index when branch lifespans overlap', () => {
      const branches = [{ name: 'main' }, { name: 'b1' }, { name: 'b2' }];
      const commits = new Map<string, Commit>([
        ['c0', { id: 'c0', message: '', seq: 0, type: 0, tags: [], parents: [], branch: 'main' }],
        ['c1', { id: 'c1', message: '', seq: 1, type: 0, tags: [], parents: ['c0'], branch: 'b1' }],
        [
          'c2',
          {
            id: 'c2',
            message: '',
            seq: 2,
            type: 3,
            tags: [],
            parents: ['c0', 'c1'],
            branch: 'main',
          },
        ],
        [
          'c3',
          { id: 'c3', message: '', seq: 3, type: 0, tags: [], parents: ['c2'], branch: 'main' },
        ],
        ['c4', { id: 'c4', message: '', seq: 4, type: 0, tags: [], parents: ['c3'], branch: 'b2' }],
        [
          'c5',
          {
            id: 'c5',
            message: '',
            seq: 5,
            type: 3,
            tags: [],
            parents: ['c3', 'c4'],
            branch: 'main',
          },
        ],
        ['c6', { id: 'c6', message: '', seq: 6, type: 0, tags: [], parents: ['c1'], branch: 'b1' }],
        [
          'c7',
          {
            id: 'c7',
            message: '',
            seq: 7,
            type: 3,
            tags: [],
            parents: ['c5', 'c6'],
            branch: 'main',
          },
        ],
      ]);

      const { branchPosMap, allocatedLanes } = allocateBranchPositions(
        branches,
        commits,
        branchBBoxes,
        false,
        'main',
        true
      );

      expect(branchPosMap.get('main')).toEqual({ pos: 0, index: 0 });
      expect(branchPosMap.get('b1')?.index).toBe(1);
      expect(branchPosMap.get('b2')?.index).toBe(2);
      expect(branchPosMap.get('b2')!.pos).toBeGreaterThan(branchPosMap.get('b1')!.pos);
      expect(allocatedLanes.length).toBe(3);
    });

    it('should handle greedy first-fit lane reuse with 3 non-overlapping branches', () => {
      const branches = [{ name: 'main' }, { name: 'b1' }, { name: 'b2' }, { name: 'b3' }];
      const commits = new Map<string, Commit>([
        ['c0', { id: 'c0', message: '', seq: 0, type: 0, tags: [], parents: [], branch: 'main' }],
        ['c1', { id: 'c1', message: '', seq: 1, type: 0, tags: [], parents: ['c0'], branch: 'b1' }],
        ['c2', { id: 'c2', message: '', seq: 2, type: 0, tags: [], parents: ['c0'], branch: 'b2' }],
        [
          'c3',
          {
            id: 'c3',
            message: '',
            seq: 3,
            type: 3,
            tags: [],
            parents: ['c0', 'c1'],
            branch: 'main',
          },
        ],
        ['c4', { id: 'c4', message: '', seq: 4, type: 0, tags: [], parents: ['c3'], branch: 'b3' }],
        [
          'c5',
          {
            id: 'c5',
            message: '',
            seq: 5,
            type: 3,
            tags: [],
            parents: ['c3', 'c4'],
            branch: 'main',
          },
        ],
      ]);

      const { branchPosMap, allocatedLanes } = allocateBranchPositions(
        branches,
        commits,
        branchBBoxes,
        false,
        'main',
        true
      );

      expect(branchPosMap.get('b1')?.index).toBe(1);
      expect(branchPosMap.get('b2')?.index).toBe(2);
      // b3 span [4, 5] does not overlap b1 span [1, 3], so b3 reuses lane 1!
      expect(branchPosMap.get('b3')?.index).toBe(1);
      expect(branchPosMap.get('b3')?.pos).toBe(branchPosMap.get('b1')?.pos);
      expect(allocatedLanes.length).toBe(3);
    });
  });

  describe('commitPosition', () => {
    const commits = new Map<string, Commit>([
      [
        'commitZero',
        {
          id: 'ZERO',
          message: '',
          seq: 0,
          type: commitType.NORMAL,
          tags: [],
          parents: [],
          branch: 'main',
        },
      ],
      [
        'commitA',
        {
          id: 'A',
          message: '',
          seq: 1,
          type: commitType.NORMAL,
          tags: [],
          parents: ['ZERO'],
          branch: 'feature',
        },
      ],
      [
        'commitB',
        {
          id: 'B',
          message: '',
          seq: 2,
          type: commitType.NORMAL,
          tags: [],
          parents: ['A'],
          branch: 'feature',
        },
      ],
      [
        'commitM',
        {
          id: 'M',
          message: 'merged branch feature into main',
          seq: 3,
          type: commitType.MERGE,
          tags: [],
          parents: ['ZERO', 'B'],
          branch: 'main',
          customId: true,
        },
      ],
      [
        'commitC',
        {
          id: 'C',
          message: '',
          seq: 4,
          type: commitType.NORMAL,
          tags: [],
          parents: ['ZERO'],
          branch: 'release',
        },
      ],
      [
        'commit5_8928ea0',
        {
          id: '5-8928ea0',
          message: 'cherry-picked [object Object] into release',
          seq: 5,
          type: commitType.CHERRY_PICK,
          tags: [],
          parents: ['C', 'M'],
          branch: 'release',
        },
      ],
      [
        'commitD',
        {
          id: 'D',
          message: '',
          seq: 6,
          type: commitType.NORMAL,
          tags: [],
          parents: ['5-8928ea0'],
          branch: 'release',
        },
      ],
      [
        'commit7_ed848ba',
        {
          id: '7-ed848ba',
          message: 'cherry-picked [object Object] into release',
          seq: 7,
          type: commitType.CHERRY_PICK,
          tags: [],
          parents: ['D', 'M'],
          branch: 'release',
        },
      ],
    ]);
    let pos = 0;
    branchPos.set('main', { pos: 0, index: 0 });
    branchPos.set('feature', { pos: 107.49609375, index: 1 });
    branchPos.set('release', { pos: 224.03515625, index: 2 });

    describe('TB', () => {
      pos = 30;
      dir = 'TB';
      const expectedCommitPositionTB = new Map<string, CommitPositionOffset>([
        ['commitZero', { x: 0, y: 40, posWithOffset: 40 }],
        ['commitA', { x: 107.49609375, y: 90, posWithOffset: 90 }],
        ['commitB', { x: 107.49609375, y: 140, posWithOffset: 140 }],
        ['commitM', { x: 0, y: 190, posWithOffset: 190 }],
        ['commitC', { x: 224.03515625, y: 240, posWithOffset: 240 }],
        ['commit5_8928ea0', { x: 224.03515625, y: 290, posWithOffset: 290 }],
        ['commitD', { x: 224.03515625, y: 340, posWithOffset: 340 }],
        ['commit7_ed848ba', { x: 224.03515625, y: 390, posWithOffset: 390 }],
      ]);
      commits.forEach((commit, key) => {
        it(`should give the correct position for commit ${key}`, () => {
          const position = getCommitPosition(commit, pos, false);
          expect(position).toEqual(expectedCommitPositionTB.get(key));
          pos += 50;
        });
      });
    });
    describe('LR', () => {
      let pos = 30;
      dir = 'LR';
      const expectedCommitPositionLR = new Map<string, CommitPositionOffset>([
        ['commitZero', { x: 0, y: 40, posWithOffset: 40 }],
        ['commitA', { x: 107.49609375, y: 90, posWithOffset: 90 }],
        ['commitB', { x: 107.49609375, y: 140, posWithOffset: 140 }],
        ['commitM', { x: 0, y: 190, posWithOffset: 190 }],
        ['commitC', { x: 224.03515625, y: 240, posWithOffset: 240 }],
        ['commit5_8928ea0', { x: 224.03515625, y: 290, posWithOffset: 290 }],
        ['commitD', { x: 224.03515625, y: 340, posWithOffset: 340 }],
        ['commit7_ed848ba', { x: 224.03515625, y: 390, posWithOffset: 390 }],
      ]);
      commits.forEach((commit, key) => {
        it(`should give the correct position for commit ${key}`, () => {
          const position = getCommitPosition(commit, pos, false);
          expect(position).toEqual(expectedCommitPositionLR.get(key));
          pos += 50;
        });
      });
    });
    describe('getCommitClassType', () => {
      const expectedCommitClassType = new Map<string, string>([
        ['commitZero', 'commit-normal'],
        ['commitA', 'commit-normal'],
        ['commitB', 'commit-normal'],
        ['commitM', 'commit-merge'],
        ['commitC', 'commit-normal'],
        ['commit5_8928ea0', 'commit-cherry-pick'],
        ['commitD', 'commit-normal'],
        ['commit7_ed848ba', 'commit-cherry-pick'],
      ]);
      commits.forEach((commit, key) => {
        it(`should give the correct class type for commit ${key}`, () => {
          const classType = getCommitClassType(commit);
          expect(classType).toBe(expectedCommitClassType.get(key));
        });
      });
    });
  });
  describe('building BT parallel commit diagram', () => {
    const commits = new Map<string, Commit>([
      [
        '1-abcdefg',
        {
          id: '1-abcdefg',
          message: '',
          seq: 0,
          type: 0,
          tags: [],
          parents: [],
          branch: 'main',
        },
      ],
      [
        '2-abcdefg',
        {
          id: '2-abcdefg',
          message: '',
          seq: 1,
          type: 0,
          tags: [],
          parents: ['1-abcdefg'],
          branch: 'main',
        },
      ],
      [
        '3-abcdefg',
        {
          id: '3-abcdefg',
          message: '',
          seq: 2,
          type: 0,
          tags: [],
          parents: ['2-abcdefg'],
          branch: 'develop',
        },
      ],
      [
        '4-abcdefg',
        {
          id: '4-abcdefg',
          message: '',
          seq: 3,
          type: 0,
          tags: [],
          parents: ['3-abcdefg'],
          branch: 'develop',
        },
      ],
      [
        '5-abcdefg',
        {
          id: '5-abcdefg',
          message: '',
          seq: 4,
          type: 0,
          tags: [],
          parents: ['2-abcdefg'],
          branch: 'feature',
        },
      ],
      [
        '6-abcdefg',
        {
          id: '6-abcdefg',
          message: '',
          seq: 5,
          type: 0,
          tags: [],
          parents: ['5-abcdefg'],
          branch: 'feature',
        },
      ],
      [
        '7-abcdefg',
        {
          id: '7-abcdefg',
          message: '',
          seq: 6,
          type: 0,
          tags: [],
          parents: ['2-abcdefg'],
          branch: 'main',
        },
      ],
      [
        '8-abcdefg',
        {
          id: '8-abcdefg',
          message: '',
          seq: 7,
          type: 0,
          tags: [],
          parents: ['7-abcdefg'],
          branch: 'main',
        },
      ],
    ]);
    const expectedCommitPosition = new Map<string, CommitPosition>([
      ['1-abcdefg', { x: 0, y: 40 }],
      ['2-abcdefg', { x: 0, y: 90 }],
      ['3-abcdefg', { x: 107.49609375, y: 140 }],
      ['4-abcdefg', { x: 107.49609375, y: 190 }],
      ['5-abcdefg', { x: 225.70703125, y: 140 }],
      ['6-abcdefg', { x: 225.70703125, y: 190 }],
      ['7-abcdefg', { x: 0, y: 140 }],
      ['8-abcdefg', { x: 0, y: 190 }],
    ]);

    const expectedCommitPositionAfterParallel = new Map<string, CommitPosition>([
      ['1-abcdefg', { x: 0, y: 210 }],
      ['2-abcdefg', { x: 0, y: 160 }],
      ['3-abcdefg', { x: 107.49609375, y: 110 }],
      ['4-abcdefg', { x: 107.49609375, y: 60 }],
      ['5-abcdefg', { x: 225.70703125, y: 110 }],
      ['6-abcdefg', { x: 225.70703125, y: 60 }],
      ['7-abcdefg', { x: 0, y: 110 }],
      ['8-abcdefg', { x: 0, y: 60 }],
    ]);

    const expectedCommitCurrentPosition = new Map<string, number>([
      ['1-abcdefg', 30],
      ['2-abcdefg', 80],
      ['3-abcdefg', 130],
      ['4-abcdefg', 180],
      ['5-abcdefg', 130],
      ['6-abcdefg', 180],
      ['7-abcdefg', 130],
      ['8-abcdefg', 180],
    ]);
    const sortedKeys = [...expectedCommitPosition.keys()];
    it('should get the correct commit position and current position', () => {
      dir = 'BT';
      let curPos = 30;
      commitPos.clear();
      branchPos.clear();
      branchPos.set('main', { pos: 0, index: 0 });
      branchPos.set('develop', { pos: 107.49609375, index: 1 });
      branchPos.set('feature', { pos: 225.70703125, index: 2 });
      commits.forEach((commit, key) => {
        if (commit.parents.length > 0) {
          curPos = calculateCommitPosition(commit);
        }
        const position = setCommitPosition(commit, curPos);
        expect(position).toEqual(expectedCommitPosition.get(key));
        expect(curPos).toEqual(expectedCommitCurrentPosition.get(key));
      });
    });

    it('should get the correct commit position after parallel commits', () => {
      commitPos.clear();
      branchPos.clear();
      dir = 'BT';
      const curPos = 30;
      commitPos.clear();
      branchPos.clear();
      branchPos.set('main', { pos: 0, index: 0 });
      branchPos.set('develop', { pos: 107.49609375, index: 1 });
      branchPos.set('feature', { pos: 225.70703125, index: 2 });
      setParallelBTPos(sortedKeys, commits, curPos);
      sortedKeys.forEach((commit) => {
        const position = commitPos.get(commit);
        expect(position).toEqual(expectedCommitPositionAfterParallel.get(commit));
      });
    });
  });
  it('add', () => {
    commitPos.set('parent1', { x: 1, y: 1 });
    commitPos.set('parent2', { x: 2, y: 2 });
    commitPos.set('parent3', { x: 3, y: 3 });
    dir = 'LR';
    const parents = ['parent1', 'parent2', 'parent3'];
    const closestParent = findClosestParent(parents);

    expect(closestParent).toBe('parent3');
    commitPos.clear();
  });
}
