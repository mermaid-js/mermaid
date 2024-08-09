import { select } from 'd3';
import { getConfig, setupGraphViewbox } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import utils from '../../utils.js';
import type { DrawDefinition } from '../../diagram-api/types.js';
import type d3 from 'd3';
import type { CommitType, Commit, GitGraphDB, DiagramOrientation } from './gitGraphTypes.js';
import type { GitGraphDiagramConfig } from '../../config.type.js';

let allCommitsDict = new Map();

const commitType: CommitType = {
  NORMAL: 0,
  REVERSE: 1,
  HIGHLIGHT: 2,
  MERGE: 3,
  CHERRY_PICK: 4,
};

const THEME_COLOR_LIMIT = 8;

interface BranchPosition {
  pos: number;
  index: number;
}

interface CommitPosition {
  x: number;
  y: number;
}

const branchPos = new Map<string, BranchPosition>();
const commitPos = new Map<string, CommitPosition>();
let lanes: number[] = [];
let maxPos = 0;
let dir: DiagramOrientation = 'LR';
const defaultPos = 30;

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

const findClosestParent = (parents: string[], useBTLogic = false): string | undefined => {
  let closestParent: string | undefined;
  let comparisonFunc;
  let targetPosition: number;

  if (dir === 'BT' || useBTLogic) {
    comparisonFunc = (a: number, b: number) => a <= b;
    targetPosition = Infinity;
  } else {
    comparisonFunc = (a: number, b: number) => a >= b;
    targetPosition = 0;
  }

  parents.forEach((parent) => {
    const parentPosition =
      dir === 'TB' || dir == 'BT' || useBTLogic
        ? commitPos.get(parent)?.y
        : commitPos.get(parent)?.x;

    if (parentPosition !== undefined && comparisonFunc(parentPosition, targetPosition)) {
      closestParent = parent;
      targetPosition = parentPosition;
    }
  });

  return closestParent;
};

const setParallelBTPos = (
  sortedKeys: string[],
  commits: Map<string, Commit>,
  defaultPos: number,
  commitStep: number,
  layoutOffset: number
) => {
  let curPos = defaultPos;
  let maxPosition = defaultPos;
  const roots: Commit[] = [];

  sortedKeys.forEach((key) => {
    const commit = commits.get(key);
    if (!commit) {
      throw new Error(`Commit not found for key ${key}`);
    }

    if (hasParents(commit)) {
      curPos = calculateCommitPosition(commit, commitStep, maxPosition);
      maxPosition = Math.max(curPos, maxPosition);
    } else {
      roots.push(commit);
    }
    setCommitPosition(commit, curPos, layoutOffset);
  });

  curPos = maxPosition;
  roots.forEach((commit) => {
    setRootPosition(commit, curPos, defaultPos);
  });
};

const hasParents = (commit: Commit): boolean => commit.parents?.length > 0;

const findClosestParentPos = (commit: Commit): number => {
  const closestParent = findClosestParent(commit.parents.filter((p) => p !== null) as string[]);
  if (!closestParent) {
    throw new Error(`Closest parent not found for commit ${commit.id}`);
  }

  const closestParentPos = commitPos.get(closestParent)?.y;
  if (closestParentPos === undefined) {
    throw new Error(`Closest parent position not found for commit ${commit.id}`);
  }
  return closestParentPos;
};

const calculateCommitPosition = (commit: Commit, commitStep: number): number => {
  const closestParentPos = findClosestParentPos(commit);
  return closestParentPos + commitStep;
};

const setCommitPosition = (commit: Commit, curPos: number, layoutOffset: number) => {
  const branch = branchPos.get(commit.branch);
  if (!branch) {
    throw new Error(`Branch not found for commit ${commit.id}`);
  }

  const x = branch.pos;
  const y = curPos + layoutOffset;
  commitPos.set(commit.id, { x, y });
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
  x: number,
  y: number,
  typeClass: string,
  branchIndex: number,
  commitSymbolType: number
) => {
  if (commitSymbolType === commitType.HIGHLIGHT) {
    gBullets
      .append('rect')
      .attr('x', x - 10)
      .attr('y', y - 10)
      .attr('width', 20)
      .attr('height', 20)
      .attr(
        'class',
        `commit ${commit.id} commit-highlights${branchIndex % THEME_COLOR_LIMIT} ${typeClass}-outer`
      );
    gBullets
      .append('rect')
      .attr('x', x - 6)
      .attr('y', y - 6)
      .attr('width', 12)
      .attr('height', 12)
      .attr(
        'class',
        `commit ${commit.id} commit${branchIndex % THEME_COLOR_LIMIT} ${typeClass}-inner`
      );
  } else if (commitSymbolType === commitType.CHERRY_PICK) {
    gBullets
      .append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', 10)
      .attr('class', `commit ${commit.id} ${typeClass}`);
    gBullets
      .append('circle')
      .attr('cx', x - 3)
      .attr('cy', y + 2)
      .attr('r', 2.75)
      .attr('fill', '#fff')
      .attr('class', `commit ${commit.id} ${typeClass}`);
    gBullets
      .append('circle')
      .attr('cx', x + 3)
      .attr('cy', y + 2)
      .attr('r', 2.75)
      .attr('fill', '#fff')
      .attr('class', `commit ${commit.id} ${typeClass}`);
    gBullets
      .append('line')
      .attr('x1', x + 3)
      .attr('y1', y + 1)
      .attr('x2', x)
      .attr('y2', y - 5)
      .attr('stroke', '#fff')
      .attr('class', `commit ${commit.id} ${typeClass}`);
    gBullets
      .append('line')
      .attr('x1', x - 3)
      .attr('y1', y + 1)
      .attr('x2', x)
      .attr('y2', y - 5)
      .attr('stroke', '#fff')
      .attr('class', `commit ${commit.id} ${typeClass}`);
  } else {
    const circle = gBullets.append('circle');
    circle.attr('cx', x);
    circle.attr('cy', y);
    circle.attr('r', commit.type === commitType.MERGE ? 9 : 10);
    circle.attr('class', `commit ${commit.id} commit${branchIndex % THEME_COLOR_LIMIT}`);
    if (commit.type === commitType.MERGE) {
      const circle2 = gBullets.append('circle');
      circle2.attr('cx', x);
      circle2.attr('cy', y);
      circle2.attr('r', 6);
      circle2.attr(
        'class',
        `commit ${typeClass} ${commit.id} commit${branchIndex % THEME_COLOR_LIMIT}`
      );
    }
    if (commitSymbolType === commitType.REVERSE) {
      const cross = gBullets.append('path');
      cross
        .attr('d', `M ${x - 5},${y - 5}L${x + 5},${y + 5}M${x - 5},${y + 5}L${x + 5},${y - 5}`)
        .attr('class', `commit ${typeClass} ${commit.id} commit${branchIndex % THEME_COLOR_LIMIT}`);
    }
  }
};

const drawCommitLabel = (
  gLabels: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  commit: Commit,
  x: number,
  y: number,
  pos: number,
  posWithOffset: number,
  gitGraphConfig: GitGraphDiagramConfig
) => {
  if (
    commit.type !== commitType.CHERRY_PICK &&
    ((commit.customId && commit.type === commitType.MERGE) || commit.type !== commitType.MERGE) &&
    gitGraphConfig.showCommitLabel
  ) {
    const wrapper = gLabels.append('g');
    const labelBkg = wrapper.insert('rect').attr('class', 'commit-label-bkg');
    const text = wrapper
      .append('text')
      .attr('x', x)
      .attr('y', y + 25)
      .attr('class', 'commit-label')
      .text(commit.id);
    const bbox = text.node()?.getBBox();

    if (bbox) {
      labelBkg
        .attr('x', posWithOffset - bbox.width / 2 - 2)
        .attr('y', y + 13.5)
        .attr('width', bbox.width + 4)
        .attr('height', bbox.height + 4);

      if (dir === 'TB' || dir === 'BT') {
        labelBkg.attr('x', x - (bbox.width + 4)).attr('y', y - 12);
        text.attr('x', x - (bbox.width + 2)).attr('y', y + bbox.height - 12);
      }

      if (gitGraphConfig.rotateCommitLabel) {
        if (dir === 'TB' || dir === 'BT') {
          text.attr('transform', 'rotate(' + -45 + ', ' + x + ', ' + y + ')');
          labelBkg.attr('transform', 'rotate(' + -45 + ', ' + x + ', ' + y + ')');
        } else {
          const r_x = -7.5 - ((bbox.width + 10) / 25) * 9.5;
          const r_y = 10 + (bbox.width / 25) * 8.5;
          wrapper.attr(
            'transform',
            'translate(' + r_x + ', ' + r_y + ') rotate(' + -45 + ', ' + pos + ', ' + y + ')'
          );
        }
      }
    }
  }
};

const drawCommitTags = (
  gLabels: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  commit: Commit,
  x: number,
  y: number,
  pos: number,
  posWithOffset: number,
  layoutOffset: number
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
        .attr('y', y - 16 - yOffset)
        .attr('class', 'tag-label')
        .text(tagValue);
      const tagBbox = tag.node()?.getBBox();
      if (!tagBbox) {
        throw new Error('Tag bbox not found');
      }
      maxTagBboxWidth = Math.max(maxTagBboxWidth, tagBbox.width);
      maxTagBboxHeight = Math.max(maxTagBboxHeight, tagBbox.height);

      tag.attr('x', posWithOffset - tagBbox.width / 2);

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
      const ly = y - 19.2 - yOffset;
      rect.attr('class', 'tag-label-bkg').attr(
        'points',
        `
      ${pos - maxTagBboxWidth / 2 - 2},${ly + 2}  
      ${pos - maxTagBboxWidth / 2 - 2},${ly - 2}
      ${posWithOffset - maxTagBboxWidth / 2 - 4},${ly - h2 - 2}
      ${posWithOffset + maxTagBboxWidth / 2 + 4},${ly - h2 - 2}
      ${posWithOffset + maxTagBboxWidth / 2 + 4},${ly + h2 + 2}
      ${posWithOffset - maxTagBboxWidth / 2 - 4},${ly + h2 + 2}`
      );

      hole
        .attr('cy', ly)
        .attr('cx', pos - maxTagBboxWidth / 2 + 2)
        .attr('r', 1.5)
        .attr('class', 'tag-hole');

      if (dir === 'TB' || dir === 'BT') {
        const yOrigin = pos + yOffset;

        rect
          .attr('class', 'tag-label-bkg')
          .attr(
            'points',
            `
        ${x},${yOrigin + 2}
        ${x},${yOrigin - 2}
        ${x + layoutOffset},${yOrigin - h2 - 2}
        ${x + layoutOffset + maxTagBboxWidth + 4},${yOrigin - h2 - 2}
        ${x + layoutOffset + maxTagBboxWidth + 4},${yOrigin + h2 + 2}
        ${x + layoutOffset},${yOrigin + h2 + 2}`
          )
          .attr('transform', 'translate(12,12) rotate(45, ' + x + ',' + pos + ')');
        hole
          .attr('cx', x + 2)
          .attr('cy', yOrigin)
          .attr('transform', 'translate(12,12) rotate(45, ' + x + ',' + pos + ')');
        tag
          .attr('x', x + 5)
          .attr('y', yOrigin + 3)
          .attr('transform', 'translate(14,14) rotate(45, ' + x + ',' + pos + ')');
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
  isParallelCommits: boolean,
  pos: number,
  commitStep: number,
  layoutOffset: number,
  commitPos: Map<string, CommitPosition>
): number => {
  const defaultCommitPosition = { x: 0, y: defaultPos }; // Default position if commit is not found

  if (isParallelCommits) {
    if (commit.parents.length > 0) {
      const closestParent =
        dir === 'BT' ? findClosestParent(commit.parents) : findClosestParent(commit.parents);

      // Check if closestParent is defined
      if (closestParent) {
        const parentPosition = commitPos.get(closestParent) ?? defaultCommitPosition;

        if (dir === 'TB') {
          return parentPosition.y + commitStep;
        } else if (dir === 'BT') {
          const currentPosition = commitPos.get(commit.id) ?? defaultCommitPosition;
          return currentPosition.y - commitStep;
        } else {
          return parentPosition.x + commitStep;
        }
      }
    } else {
      if (dir === 'TB') {
        return defaultPos;
      } else if (dir === 'BT') {
        const currentPosition = commitPos.get(commit.id) ?? defaultCommitPosition;
        return currentPosition.y - commitStep;
      } else {
        return 0;
      }
    }
  }

  return dir === 'TB' && isParallelCommits ? pos : pos + layoutOffset;
};

const drawCommits = (
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  commits: Map<string, Commit>,
  modifyGraph: boolean
) => {
  const gitGraphConfig = getConfig().gitGraph;
  if (!gitGraphConfig) {
    throw new Error('GitGraph config not found');
  }
  const gBullets = svg.append('g').attr('class', 'commit-bullets');
  const gLabels = svg.append('g').attr('class', 'commit-labels');
  let pos = dir === 'TB' || dir === 'BT' ? defaultPos : 0;
  const keys = [...commits.keys()];
  const isParallelCommits = gitGraphConfig?.parallelCommits ?? false;
  const layoutOffset = 10;
  const commitStep = 40;

  const sortKeys = (a: string, b: string) => {
    const seqA = commits.get(a)?.seq;
    const seqB = commits.get(b)?.seq;
    return seqA !== undefined && seqB !== undefined ? seqA - seqB : 0;
  };

  let sortedKeys = keys.sort(sortKeys);

  if (dir === 'BT' && !isParallelCommits) {
    sortedKeys = sortedKeys.reverse();
  }

  if (dir === 'BT' && isParallelCommits) {
    setParallelBTPos(sortedKeys, commits, pos, commitStep, layoutOffset);
    sortedKeys = sortedKeys.reverse();
  }

  sortedKeys.forEach((key) => {
    const commit = commits.get(key);
    if (!commit) {
      throw new Error(`Commit not found for key ${key}`);
    } else {
      pos = calculatePosition(
        commit,
        dir,
        isParallelCommits,
        pos,
        commitStep,
        layoutOffset,
        commitPos
      );
      const posWithOffset = dir === 'BT' && isParallelCommits ? pos : pos + layoutOffset;
      const y = dir === 'TB' || dir === 'BT' ? posWithOffset : branchPos.get(commit.branch)?.pos;
      const x = dir === 'TB' || dir === 'BT' ? branchPos.get(commit.branch)?.pos : posWithOffset;
      if (x === undefined || y === undefined) {
        throw new Error(`Position were undefined for commit ${commit.id}`);
      }
      // Don't draw the commits now but calculate the positioning which is used by the branch lines etc.
      if (modifyGraph) {
        const typeClass = getCommitClassType(commit);
        const commitSymbolType = commit.customType ?? commit.type;
        const branchIndex = branchPos.get(commit.branch)?.index ?? 0;
        drawCommitBullet(gBullets, commit, x, y, typeClass, branchIndex, commitSymbolType);
        drawCommitLabel(gLabels, commit, x, y, pos, posWithOffset, gitGraphConfig);
        drawCommitTags(gLabels, commit, x, y, pos, posWithOffset, layoutOffset);
      }
      if (dir === 'TB' || dir === 'BT') {
        commitPos.set(commit.id, { x: x, y: posWithOffset });
      } else {
        commitPos.set(commit.id, { x: posWithOffset, y: y });
      }
      pos = dir === 'BT' && isParallelCommits ? pos + commitStep : pos + commitStep + layoutOffset;
      if (pos > maxPos) {
        maxPos = pos;
      }
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
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  commitA: Commit,
  commitB: Commit,
  allCommits: Map<string, Commit>
) => {
  const p1 = commitPos.get(commitA.id); // arrowStart
  const p2 = commitPos.get(commitB.id); // arrowEnd
  // @ts-ignore: TODO Fix ts errors
  const arrowNeedsRerouting = shouldRerouteArrow(commitA, commitB, p1, p2, allCommits);
  // log.debug('drawArrow', p1, p2, arrowNeedsRerouting, commitA.id, commitB.id);

  // Lower-right quadrant logic; top-left is 0,0

  let arc = '';
  let arc2 = '';
  let radius = 0;
  let offset = 0;
  // @ts-ignore: TODO Fix ts errors
  let colorClassNum = branchPos.get(commitB.branch).index;
  if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
    // @ts-ignore: TODO Fix ts errors
    colorClassNum = branchPos.get(commitA.branch).index;
  }

  let lineDef;
  if (arrowNeedsRerouting) {
    arc = 'A 10 10, 0, 0, 0,';
    arc2 = 'A 10 10, 0, 0, 1,';
    radius = 10;
    offset = 10;
    // @ts-ignore: TODO Fix ts errors
    const lineY = p1.y < p2.y ? findLane(p1.y, p2.y) : findLane(p2.y, p1.y);
    // @ts-ignore: TODO Fix ts errors
    const lineX = p1.x < p2.x ? findLane(p1.x, p2.x) : findLane(p2.x, p1.x);

    if (dir === 'TB') {
      // @ts-ignore: TODO Fix ts errors
      if (p1.x < p2.x) {
        // Source commit is on branch position left of destination commit
        // so render arrow rightward with colour of destination branch
        // @ts-ignore: TODO Fix ts errors
        lineDef = `M ${p1.x} ${p1.y} L ${lineX - radius} ${p1.y} ${arc2} ${lineX} ${
          // @ts-ignore: TODO Fix ts errors
          p1.y + offset
          // @ts-ignore: TODO Fix ts errors
        } L ${lineX} ${p2.y - radius} ${arc} ${lineX + offset} ${p2.y} L ${p2.x} ${p2.y}`;
      } else {
        // Source commit is on branch position right of destination commit
        // so render arrow leftward with colour of source branch
        // @ts-ignore: TODO Fix ts errors
        colorClassNum = branchPos.get(commitA.branch).index;
        // @ts-ignore: TODO Fix ts errors
        lineDef = `M ${p1.x} ${p1.y} L ${lineX + radius} ${p1.y} ${arc} ${lineX} ${p1.y + offset} L ${lineX} ${p2.y - radius} ${arc2} ${lineX - offset} ${p2.y} L ${p2.x} ${p2.y}`;
      }
    } else if (dir === 'BT') {
      // @ts-ignore: TODO Fix ts errors
      if (p1.x < p2.x) {
        // Source commit is on branch position left of destination commit
        // so render arrow rightward with colour of destination branch
        // @ts-ignore: TODO Fix ts errors
        lineDef = `M ${p1.x} ${p1.y} L ${lineX - radius} ${p1.y} ${arc} ${lineX} ${p1.y - offset} L ${lineX} ${p2.y + radius} ${arc2} ${lineX + offset} ${p2.y} L ${p2.x} ${p2.y}`;
      } else {
        // Source commit is on branch position right of destination commit
        // so render arrow leftward with colour of source branch
        // @ts-ignore: TODO Fix ts errors
        colorClassNum = branchPos.get(commitA.branch).index;
        // @ts-ignore: TODO Fix ts errors
        lineDef = `M ${p1.x} ${p1.y} L ${lineX + radius} ${p1.y} ${arc2} ${lineX} ${p1.y - offset} L ${lineX} ${p2.y + radius} ${arc} ${lineX - offset} ${p2.y} L ${p2.x} ${p2.y}`;
      }
    } else {
      // @ts-ignore: TODO Fix ts errors
      if (p1.y < p2.y) {
        // Source commit is on branch positioned above destination commit
        // so render arrow downward with colour of destination branch
        // @ts-ignore: TODO Fix ts errors
        lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${lineY - radius} ${arc} ${
          // @ts-ignore: TODO Fix ts errors
          p1.x + offset
          // @ts-ignore: TODO Fix ts errors
        } ${lineY} L ${p2.x - radius} ${lineY} ${arc2} ${p2.x} ${lineY + offset} L ${p2.x} ${p2.y}`;
      } else {
        // Source commit is on branch positioned below destination commit
        // so render arrow upward with colour of source branch
        // @ts-ignore: TODO Fix ts errors
        colorClassNum = branchPos.get(commitA.branch).index;
        // @ts-ignore: TODO Fix ts errors
        lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${lineY + radius} ${arc2} ${
          // @ts-ignore: TODO Fix ts errors
          p1.x + offset
          // @ts-ignore: TODO Fix ts errors
        } ${lineY} L ${p2.x - radius} ${lineY} ${arc} ${p2.x} ${lineY - offset} L ${p2.x} ${p2.y}`;
      }
    }
  } else {
    arc = 'A 20 20, 0, 0, 0,';
    arc2 = 'A 20 20, 0, 0, 1,';
    radius = 20;
    offset = 20;

    if (dir === 'TB') {
      // @ts-ignore: TODO Fix ts errors
      if (p1.x < p2.x) {
        if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
          // @ts-ignore: TODO Fix ts errors
          lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y - radius} ${arc} ${p1.x + offset} ${
            // @ts-ignore: TODO Fix ts errors
            p2.y
            // @ts-ignore: TODO Fix ts errors
          } L ${p2.x} ${p2.y}`;
        } else {
          // @ts-ignore: TODO Fix ts errors
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x - radius} ${p1.y} ${arc2} ${p2.x} ${
            // @ts-ignore: TODO Fix ts errors
            p1.y + offset
            // @ts-ignore: TODO Fix ts errors
          } L ${p2.x} ${p2.y}`;
        }
      }
      // @ts-ignore: TODO Fix ts errors
      if (p1.x > p2.x) {
        arc = 'A 20 20, 0, 0, 0,';
        arc2 = 'A 20 20, 0, 0, 1,';
        radius = 20;
        offset = 20;
        if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
          // @ts-ignore: TODO Fix ts errors
          lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y - radius} ${arc2} ${p1.x - offset} ${
            // @ts-ignore: TODO Fix ts errors
            p2.y
            // @ts-ignore: TODO Fix ts errors
          } L ${p2.x} ${p2.y}`;
        } else {
          // @ts-ignore: TODO Fix ts errors
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x + radius} ${p1.y} ${arc} ${p2.x} ${
            // @ts-ignore: TODO Fix ts errors
            p1.y + offset
            // @ts-ignore: TODO Fix ts errors
          } L ${p2.x} ${p2.y}`;
        }
      }
      // @ts-ignore: TODO Fix ts errors
      if (p1.x === p2.x) {
        // @ts-ignore: TODO Fix ts errors
        lineDef = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
      }
    } else if (dir === 'BT') {
      // @ts-ignore: TODO Fix ts errors
      if (p1.x < p2.x) {
        if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
          // @ts-ignore: TODO Fix ts errors
          lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y + radius} ${arc2} ${p1.x + offset} ${
            // @ts-ignore: TODO Fix ts errors
            p2.y
            // @ts-ignore: TODO Fix ts errors
          } L ${p2.x} ${p2.y}`;
        } else {
          // @ts-ignore: TODO Fix ts errors
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x - radius} ${p1.y} ${arc} ${p2.x} ${
            // @ts-ignore: TODO Fix ts errors
            p1.y - offset
            // @ts-ignore: TODO Fix ts errors
          } L ${p2.x} ${p2.y}`;
        }
      }
      // @ts-ignore: TODO Fix ts errors
      if (p1.x > p2.x) {
        arc = 'A 20 20, 0, 0, 0,';
        arc2 = 'A 20 20, 0, 0, 1,';
        radius = 20;
        offset = 20;

        if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
          // @ts-ignore: TODO Fix ts errors
          lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y + radius} ${arc} ${p1.x - offset} ${
            // @ts-ignore: TODO Fix ts errors
            p2.y
            // @ts-ignore: TODO Fix ts errors
          } L ${p2.x} ${p2.y}`;
        } else {
          // @ts-ignore: TODO Fix ts errors
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x - radius} ${p1.y} ${arc} ${p2.x} ${
            // @ts-ignore: TODO Fix ts errors
            p1.y - offset
            // @ts-ignore: TODO Fix ts errors
          } L ${p2.x} ${p2.y}`;
        }
      }
      // @ts-ignore: TODO Fix ts errors
      if (p1.x === p2.x) {
        // @ts-ignore: TODO Fix ts errors
        lineDef = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
      }
    } else {
      // @ts-ignore: TODO Fix ts errors
      if (p1.y < p2.y) {
        if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
          // @ts-ignore: TODO Fix ts errors
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x - radius} ${p1.y} ${arc2} ${p2.x} ${
            // @ts-ignore: TODO Fix ts errors
            p1.y + offset
            // @ts-ignore: TODO Fix ts errors
          } L ${p2.x} ${p2.y}`;
        } else {
          // @ts-ignore: TODO Fix ts errors
          lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y - radius} ${arc} ${p1.x + offset} ${
            // @ts-ignore: TODO Fix ts errors
            p2.y
            // @ts-ignore: TODO Fix ts errors
          } L ${p2.x} ${p2.y}`;
        }
      } // @ts-ignore: TODO Fix ts errors
      if (p1.y > p2.y) {
        if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
          // @ts-ignore: TODO Fix ts errors
          lineDef = `M ${p1.x} ${p1.y} L ${p2.x - radius} ${p1.y} ${arc} ${p2.x} ${
            // @ts-ignore: TODO Fix ts errors
            p1.y - offset
            // @ts-ignore: TODO Fix ts errors
          } L ${p2.x} ${p2.y}`;
        } else {
          // @ts-ignore: TODO Fix ts errors
          lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y + radius} ${arc2} ${p1.x + offset} ${
            // @ts-ignore: TODO Fix ts errors
            p2.y
            // @ts-ignore: TODO Fix ts errors
          } L ${p2.x} ${p2.y}`;
        }
      }
      // @ts-ignore: TODO Fix ts errors
      if (p1.y === p2.y) {
        // @ts-ignore: TODO Fix ts errors
        lineDef = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
      }
    }
  }
  svg
    .append('path')
    // @ts-ignore: TODO Fix ts errors
    .attr('d', lineDef)
    .attr('class', 'arrow arrow' + (colorClassNum % THEME_COLOR_LIMIT));
};

const drawArrows = (
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  commits: Map<string, Commit>
) => {
  const gArrows = svg.append('g').attr('class', 'commit-arrows');
  [...commits.keys()].forEach((key) => {
    const commit = commits.get(key);
    // @ts-ignore: TODO Fix ts errors
    if (commit.parents && commit.parents.length > 0) {
      // @ts-ignore: TODO Fix ts errors
      commit.parents.forEach((parent) => {
        // @ts-ignore: TODO Fix ts errors
        drawArrow(gArrows, commits.get(parent), commit, commits);
      });
    }
  });
};

const drawBranches = (
  svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  branches: { name: string }[]
) => {
  const gitGraphConfig = getConfig().gitGraph;
  const g = svg.append('g');
  branches.forEach((branch, index) => {
    // @ts-ignore: TODO Fix ts errors
    const adjustIndexForTheme = index % THEME_COLOR_LIMIT;
    // @ts-ignore: TODO Fix ts errors
    const pos = branchPos.get(branch.name).pos;
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
    // @ts-ignore: TODO Fix ts errors
    label.node().appendChild(labelElement);
    const bbox = labelElement.getBBox();
    bkg
      .attr('class', 'branchLabelBkg label' + adjustIndexForTheme)
      .attr('rx', 4)
      .attr('ry', 4)
      // @ts-ignore: TODO Fix ts errors
      .attr('x', -bbox.width - 4 - (gitGraphConfig.rotateCommitLabel === true ? 30 : 0))
      .attr('y', -bbox.height / 2 + 8)
      .attr('width', bbox.width + 18)
      .attr('height', bbox.height + 4);
    label.attr(
      'transform',
      'translate(' +
        // @ts-ignore: TODO Fix ts errors
        (-bbox.width - 14 - (gitGraphConfig.rotateCommitLabel === true ? 30 : 0)) +
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

export const draw: DrawDefinition = function (txt, id, ver, diagObj) {
  clear();
  const conf = getConfig();
  const gitGraphConfig = conf.gitGraph;
  // try {
  log.debug('in gitgraph renderer', txt + '\n', 'id:', id, ver);
  const db = diagObj.db as GitGraphDB;
  allCommitsDict = db.getCommits();
  const branches = db.getBranchesAsObjArray();
  dir = db.getDirection();
  const diagram = select(`[id="${id}"]`);
  // Position branches
  let pos = 0;
  branches.forEach((branch, index) => {
    const labelElement = drawText(branch.name);
    const g = diagram.append('g');
    const branchLabel = g.insert('g').attr('class', 'branchLabel');
    const label = branchLabel.insert('g').attr('class', 'label branch-label');
    // @ts-ignore: TODO Fix ts errors
    label.node().appendChild(labelElement);
    const bbox = labelElement.getBBox();

    branchPos.set(branch.name, { pos, index });
    pos +=
      50 +
      // @ts-ignore: TODO Fix ts errors
      (gitGraphConfig.rotateCommitLabel ? 40 : 0) +
      (dir === 'TB' || dir === 'BT' ? bbox.width / 2 : 0);
    label.remove();
    branchLabel.remove();
    g.remove();
  });

  drawCommits(diagram, allCommitsDict, false);
  // @ts-ignore: TODO Fix ts errors
  if (gitGraphConfig.showBranches) {
    drawBranches(diagram, branches);
  }
  drawArrows(diagram, allCommitsDict);
  drawCommits(diagram, allCommitsDict, true);
  utils.insertTitle(
    diagram,
    'gitTitleText',
    // @ts-ignore: TODO Fix ts errors
    gitGraphConfig.titleTopMargin,
    db.getDiagramTitle()
  );

  // Setup the view box and size of the svg element
  setupGraphViewbox(
    undefined,
    diagram,
    // @ts-ignore: TODO Fix ts errors
    gitGraphConfig.diagramPadding,
    // @ts-ignore: TODO Fix ts errors
    gitGraphConfig.useMaxWidth ?? conf.useMaxWidth
  );
};

export default {
  draw,
};
