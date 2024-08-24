import { select } from 'd3';
import { getConfig, setupGraphViewbox } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import utils from '../../utils.js';
import type { DrawDefinition } from '../../diagram-api/types.js';
import type d3 from 'd3';
import type { Commit, GitGraphDBRenderProvider, DiagramOrientation } from './gitGraphTypes.js';
import { commitType } from './gitGraphTypes.js';

interface BranchPosition {
  pos: number;
  index: number;
}

interface CommitPosition {
  x: number;
  y: number;
}

interface CommitPositionOffset extends CommitPosition {
  posWithOffset: number;
}

const DEFAULT_CONFIG = getConfig();
const DEFAULT_GITGRAPH_CONFIG = DEFAULT_CONFIG?.gitGraph;
const LAYOUT_OFFSET = 10;
const COMMIT_STEP = 40;
const PX = 4;
const PY = 2;

const THEME_COLOR_LIMIT = 8;
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
  if (commitSymbolType === commitType.HIGHLIGHT) {
    gBullets
      .append('rect')
      .attr('x', commitPosition.x - 10)
      .attr('y', commitPosition.y - 10)
      .attr('width', 20)
      .attr('height', 20)
      .attr(
        'class',
        `commit ${commit.id} commit-highlight${branchIndex % THEME_COLOR_LIMIT} ${typeClass}-outer`
      );
    gBullets
      .append('rect')
      .attr('x', commitPosition.x - 6)
      .attr('y', commitPosition.y - 6)
      .attr('width', 12)
      .attr('height', 12)
      .attr(
        'class',
        `commit ${commit.id} commit${branchIndex % THEME_COLOR_LIMIT} ${typeClass}-inner`
      );
  } else if (commitSymbolType === commitType.CHERRY_PICK) {
    gBullets
      .append('circle')
      .attr('cx', commitPosition.x)
      .attr('cy', commitPosition.y)
      .attr('r', 10)
      .attr('class', `commit ${commit.id} ${typeClass}`);
    gBullets
      .append('circle')
      .attr('cx', commitPosition.x - 3)
      .attr('cy', commitPosition.y + 2)
      .attr('r', 2.75)
      .attr('fill', '#fff')
      .attr('class', `commit ${commit.id} ${typeClass}`);
    gBullets
      .append('circle')
      .attr('cx', commitPosition.x + 3)
      .attr('cy', commitPosition.y + 2)
      .attr('r', 2.75)
      .attr('fill', '#fff')
      .attr('class', `commit ${commit.id} ${typeClass}`);
    gBullets
      .append('line')
      .attr('x1', commitPosition.x + 3)
      .attr('y1', commitPosition.y + 1)
      .attr('x2', commitPosition.x)
      .attr('y2', commitPosition.y - 5)
      .attr('stroke', '#fff')
      .attr('class', `commit ${commit.id} ${typeClass}`);
    gBullets
      .append('line')
      .attr('x1', commitPosition.x - 3)
      .attr('y1', commitPosition.y + 1)
      .attr('x2', commitPosition.x)
      .attr('y2', commitPosition.y - 5)
      .attr('stroke', '#fff')
      .attr('class', `commit ${commit.id} ${typeClass}`);
  } else {
    const circle = gBullets.append('circle');
    circle.attr('cx', commitPosition.x);
    circle.attr('cy', commitPosition.y);
    circle.attr('r', commit.type === commitType.MERGE ? 9 : 10);
    circle.attr('class', `commit ${commit.id} commit${branchIndex % THEME_COLOR_LIMIT}`);
    if (commitSymbolType === commitType.MERGE) {
      const circle2 = gBullets.append('circle');
      circle2.attr('cx', commitPosition.x);
      circle2.attr('cy', commitPosition.y);
      circle2.attr('r', 6);
      circle2.attr(
        'class',
        `commit ${typeClass} ${commit.id} commit${branchIndex % THEME_COLOR_LIMIT}`
      );
    }
    if (commitSymbolType === commitType.REVERSE) {
      const cross = gBullets.append('path');
      cross
        .attr(
          'd',
          `M ${commitPosition.x - 5},${commitPosition.y - 5}L${commitPosition.x + 5},${commitPosition.y + 5}M${commitPosition.x - 5},${commitPosition.y + 5}L${commitPosition.x + 5},${commitPosition.y - 5}`
        )
        .attr('class', `commit ${typeClass} ${commit.id} commit${branchIndex % THEME_COLOR_LIMIT}`);
    }
  }
};

const drawCommitLabel = (
  gLabels: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  commit: Commit,
  commitPosition: CommitPositionOffset,
  pos: number
) => {
  if (
    commit.type !== commitType.CHERRY_PICK &&
    ((commit.customId && commit.type === commitType.MERGE) || commit.type !== commitType.MERGE) &&
    DEFAULT_GITGRAPH_CONFIG?.showCommitLabel
  ) {
    const wrapper = gLabels.append('g');
    const labelBkg = wrapper.insert('rect').attr('class', 'commit-label-bkg');
    const text = wrapper
      .append('text')
      .attr('x', pos)
      .attr('y', commitPosition.y + 25)
      .attr('class', 'commit-label')
      .text(commit.id);
    const bbox = text.node()?.getBBox();

    if (bbox) {
      labelBkg
        .attr('x', commitPosition.posWithOffset - bbox.width / 2 - PY)
        .attr('y', commitPosition.y + 13.5)
        .attr('width', bbox.width + 2 * PY)
        .attr('height', bbox.height + 2 * PY);

      if (dir === 'TB' || dir === 'BT') {
        labelBkg
          .attr('x', commitPosition.x - (bbox.width + 4 * PX + 5))
          .attr('y', commitPosition.y - 12);
        text
          .attr('x', commitPosition.x - (bbox.width + 4 * PX))
          .attr('y', commitPosition.y + bbox.height - 12);
      } else {
        text.attr('x', commitPosition.posWithOffset - bbox.width / 2);
      }

      if (DEFAULT_GITGRAPH_CONFIG.rotateCommitLabel) {
        if (dir === 'TB' || dir === 'BT') {
          text.attr(
            'transform',
            'rotate(' + -45 + ', ' + commitPosition.x + ', ' + commitPosition.y + ')'
          );
          labelBkg.attr(
            'transform',
            'rotate(' + -45 + ', ' + commitPosition.x + ', ' + commitPosition.y + ')'
          );
        } else {
          const r_x = -7.5 - ((bbox.width + 10) / 25) * 9.5;
          const r_y = 10 + (bbox.width / 25) * 8.5;
          wrapper.attr(
            'transform',
            'translate(' +
              r_x +
              ', ' +
              r_y +
              ') rotate(' +
              -45 +
              ', ' +
              pos +
              ', ' +
              commitPosition.y +
              ')'
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
    let yOffset = 0;
    let maxTagBboxWidth = 0;
    let maxTagBboxHeight = 0;
    const tagElements = [];

    for (const tagValue of commit.tags.reverse()) {
      const rect = gLabels.insert('polygon');
      const hole = gLabels.append('circle');
      const tag = gLabels
        .append('text')
        .attr('y', commitPosition.y - 16 - yOffset)
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
      const ly = commitPosition.y - 19.2 - yOffset;
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
  const y = dir === 'TB' || dir === 'BT' ? posWithOffset : branchPos.get(commit.branch)?.pos;
  const x = dir === 'TB' || dir === 'BT' ? branchPos.get(commit.branch)?.pos : posWithOffset;
  if (x === undefined || y === undefined) {
    throw new Error(`Position were undefined for commit ${commit.id}`);
  }
  return { x, y, posWithOffset };
};

const drawCommits = (
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  commits: Map<string, Commit>,
  modifyGraph: boolean
) => {
  if (!DEFAULT_GITGRAPH_CONFIG) {
    throw new Error('GitGraph config not found');
  }
  const gBullets = svg.append('g').attr('class', 'commit-bullets');
  const gLabels = svg.append('g').attr('class', 'commit-labels');
  let pos = dir === 'TB' || dir === 'BT' ? defaultPos : 0;
  const keys = [...commits.keys()];
  const isParallelCommits = DEFAULT_GITGRAPH_CONFIG?.parallelCommits ?? false;

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
      drawCommitLabel(gLabels, commit, commitPosition, pos);
      drawCommitTags(gLabels, commit, commitPosition, pos);
    }
    if (dir === 'TB' || dir === 'BT') {
      commitPos.set(commit.id, { x: commitPosition.x, y: commitPosition.posWithOffset });
    } else {
      commitPos.set(commit.id, { x: commitPosition.posWithOffset, y: commitPosition.y });
    }
    pos = dir === 'BT' && isParallelCommits ? pos + COMMIT_STEP : pos + COMMIT_STEP + LAYOUT_OFFSET;
    if (pos > maxPos) {
      maxPos = pos;
    }
  });
};

const shouldRerouteArrow = (
  commitA: Commit,
  commitB: Commit,
  p1: CommitPosition,
  p2: CommitPosition,
  allCommits: Map<string, Commit>
) => {
  const commitBIsFurthest = dir === 'TB' || dir === 'BT' ? p1.x < p2.x : p1.y < p2.y;
  const branchToGetCurve = commitBIsFurthest ? commitB.branch : commitA.branch;
  const isOnBranchToGetCurve = (x: Commit) => x.branch === branchToGetCurve;
  const isBetweenCommits = (x: Commit) => x.seq > commitA.seq && x.seq < commitB.seq;
  return [...allCommits.values()].some((commitX) => {
    return isBetweenCommits(commitX) && isOnBranchToGetCurve(commitX);
  });
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
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x - radius} ${p1.y} ${arc} ${p2.x} ${
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
    .attr('class', 'arrow arrow' + (colorClassNum! % THEME_COLOR_LIMIT));
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

const drawBranches = (
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  branches: { name: string }[]
) => {
  const g = svg.append('g');
  branches.forEach((branch, index) => {
    const adjustIndexForTheme = index % THEME_COLOR_LIMIT;

    const pos = branchPos.get(branch.name)?.pos;
    if (pos === undefined) {
      throw new Error(`Position not found for branch ${branch.name}`);
    }
    const line = g.append('line');
    line.attr('x1', 0);
    line.attr('y1', pos);
    line.attr('x2', maxPos);
    line.attr('y2', pos);
    line.attr('class', 'branch branch' + adjustIndexForTheme);

    if (dir === 'TB') {
      line.attr('y1', defaultPos);
      line.attr('x1', pos);
      line.attr('y2', maxPos);
      line.attr('x2', pos);
    } else if (dir === 'BT') {
      line.attr('y1', maxPos);
      line.attr('x1', pos);
      line.attr('y2', defaultPos);
      line.attr('x2', pos);
    }
    lanes.push(pos);

    const name = branch.name;

    // Create the actual text element
    const labelElement = drawText(name);
    // Create outer g, edgeLabel, this will be positioned after graph layout
    const bkg = g.insert('rect');
    const branchLabel = g.insert('g').attr('class', 'branchLabel');

    // Create inner g, label, this will be positioned now for centering the text
    const label = branchLabel.insert('g').attr('class', 'label branch-label' + adjustIndexForTheme);

    label.node()!.appendChild(labelElement);
    const bbox = labelElement.getBBox();
    bkg
      .attr('class', 'branchLabelBkg label' + adjustIndexForTheme)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('x', -bbox.width - 4 - (DEFAULT_GITGRAPH_CONFIG?.rotateCommitLabel === true ? 30 : 0))
      .attr('y', -bbox.height / 2 + 8)
      .attr('width', bbox.width + 18)
      .attr('height', bbox.height + 4);
    label.attr(
      'transform',
      'translate(' +
        (-bbox.width - 14 - (DEFAULT_GITGRAPH_CONFIG?.rotateCommitLabel === true ? 30 : 0)) +
        ', ' +
        (pos - bbox.height / 2 - 1) +
        ')'
    );
    if (dir === 'TB') {
      bkg.attr('x', pos - bbox.width / 2 - 10).attr('y', 0);
      label.attr('transform', 'translate(' + (pos - bbox.width / 2 - 5) + ', ' + 0 + ')');
    } else if (dir === 'BT') {
      bkg.attr('x', pos - bbox.width / 2 - 10).attr('y', maxPos);
      label.attr('transform', 'translate(' + (pos - bbox.width / 2 - 5) + ', ' + maxPos + ')');
    } else {
      bkg.attr('transform', 'translate(' + -19 + ', ' + (pos - bbox.height / 2) + ')');
    }
  });
};

const setBranchPosition = function (
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
  if (!DEFAULT_GITGRAPH_CONFIG) {
    throw new Error('GitGraph config not found');
  }
  const rotateCommitLabel = DEFAULT_GITGRAPH_CONFIG.rotateCommitLabel ?? false;
  const db = diagObj.db as GitGraphDBRenderProvider;
  allCommitsDict = db.getCommits();
  const branches = db.getBranchesAsObjArray();
  dir = db.getDirection();
  const diagram = select(`[id="${id}"]`);
  let pos = 0;

  branches.forEach((branch, index) => {
    const labelElement = drawText(branch.name);
    const g = diagram.append('g');
    const branchLabel = g.insert('g').attr('class', 'branchLabel');
    const label = branchLabel.insert('g').attr('class', 'label branch-label');
    label.node()?.appendChild(labelElement);
    const bbox = labelElement.getBBox();

    pos = setBranchPosition(branch.name, pos, index, bbox, rotateCommitLabel);
    label.remove();
    branchLabel.remove();
    g.remove();
  });

  drawCommits(diagram, allCommitsDict, false);
  if (DEFAULT_GITGRAPH_CONFIG.showBranches) {
    drawBranches(diagram, branches);
  }
  drawArrows(diagram, allCommitsDict);
  drawCommits(diagram, allCommitsDict, true);

  utils.insertTitle(
    diagram,
    'gitTitleText',
    DEFAULT_GITGRAPH_CONFIG.titleTopMargin ?? 0,
    db.getDiagramTitle()
  );

  // Setup the view box and size of the svg element
  setupGraphViewbox(
    undefined,
    diagram,
    DEFAULT_GITGRAPH_CONFIG.diagramPadding,
    DEFAULT_GITGRAPH_CONFIG.useMaxWidth
  );
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
      DEFAULT_GITGRAPH_CONFIG!.parallelCommits = true;
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
  DEFAULT_GITGRAPH_CONFIG!.parallelCommits = false;
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
