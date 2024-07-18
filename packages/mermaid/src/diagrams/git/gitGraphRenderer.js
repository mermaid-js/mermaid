import { select } from 'd3';
import { getConfig, setupGraphViewbox } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import utils from '../../utils.js';

/**
 * @typedef {Map<string, { id: string, message: string, seq: number, type: number, tag: string, parents: string[], branch: string }>} CommitMap
 */

/** @type {CommitMap} */
let allCommitsDict = new Map();

const commitType = {
  NORMAL: 0,
  REVERSE: 1,
  HIGHLIGHT: 2,
  MERGE: 3,
  CHERRY_PICK: 4,
};

const THEME_COLOR_LIMIT = 8;

let branchPos = {};
let commitPos = {};
let lanes = [];
let maxPos = 0;
let dir = 'LR';
let defaultPos = 30;
const clear = () => {
  branchPos = new Map();
  commitPos = new Map();
  allCommitsDict = new Map();
  maxPos = 0;
  lanes = [];
  dir = 'LR';
};

/**
 * Draws a text, used for labels of the branches
 *
 * @param {string} txt The text
 * @returns {SVGElement}
 */
const drawText = (txt) => {
  const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  let rows = [];

  // Handling of new lines in the label
  if (typeof txt === 'string') {
    rows = txt.split(/\\n|\n|<br\s*\/?>/gi);
  } else if (Array.isArray(txt)) {
    rows = txt;
  } else {
    rows = [];
  }

  for (const row of rows) {
    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    tspan.setAttribute('dy', '1em');
    tspan.setAttribute('x', '0');
    tspan.setAttribute('class', 'row');
    tspan.textContent = row.trim();
    svgLabel.appendChild(tspan);
  }
  /**
   * @param svg
   * @param selector
   */
  return svgLabel;
};

/**
 * Searches for the closest parent from the parents list passed as argument.
 * The parents list comes from an individual commit. The closest parent is actually
 * the one farther down the graph, since that means it is closer to its child.
 *
 * @param {string[]} parents
 * @returns {string | undefined}
 */
const findClosestParent = (parents) => {
  let closestParent = '';
  let maxPosition = 0;

  parents.forEach((parent) => {
    const parentPosition =
      dir === 'TB' || dir === 'BT' ? commitPos.get(parent).y : commitPos.get(parent).x;
    if (parentPosition >= maxPosition) {
      closestParent = parent;
      maxPosition = parentPosition;
    }
  });

  return closestParent || undefined;
};

/**
 * Searches for the closest parent from the parents list passed as argument for Bottom-to-Top orientation.
 * The parents list comes from an individual commit. The closest parent is actually
 * the one farther down the graph, since that means it is closer to its child.
 *
 * @param {string[]} parents
 * @returns {string | undefined}
 */
const findClosestParentBT = (parents) => {
  let closestParent = '';
  let maxPosition = Infinity;

  parents.forEach((parent) => {
    const parentPosition = commitPos.get(parent).y;
    if (parentPosition <= maxPosition) {
      closestParent = parent;
      maxPosition = parentPosition;
    }
  });

  return closestParent || undefined;
};

/**
 * Sets the position of the commit elements when the orientation is set to BT-Parallel.
 * This is needed to render the chart in Bottom-to-Top mode while keeping the parallel
 * commits in the correct position. First, it finds the correct position of the root commit
 * using the findClosestParent method. Then, it uses the findClosestParentBT to set the position
 * of the remaining commits.
 *
 * @param {any} sortedKeys
 * @param {CommitMap} commits
 * @param {any} defaultPos
 * @param {any} commitStep
 * @param {any} layoutOffset
 */
const setParallelBTPos = (sortedKeys, commits, defaultPos, commitStep, layoutOffset) => {
  let curPos = defaultPos;
  let maxPosition = defaultPos;
  let roots = [];
  sortedKeys.forEach((key) => {
    const commit = commits.get(key);
    if (commit.parents.length) {
      const closestParent = findClosestParent(commit.parents);
      curPos = commitPos.get(closestParent).y + commitStep;
      if (curPos >= maxPosition) {
        maxPosition = curPos;
      }
    } else {
      roots.push(commit);
    }
    const x = branchPos.get(commit.branch).pos;
    const y = curPos + layoutOffset;
    commitPos.set(commit.id, { x: x, y: y });
  });
  curPos = maxPosition;
  roots.forEach((commit) => {
    const posWithOffset = curPos + defaultPos;
    const y = posWithOffset;
    const x = branchPos.get(commit.branch).pos;
    commitPos.set(commit.id, { x: x, y: y });
  });
  sortedKeys.forEach((key) => {
    const commit = commits.get(key);
    if (commit.parents.length) {
      const closestParent = findClosestParentBT(commit.parents);
      curPos = commitPos.get(closestParent).y - commitStep;
      if (curPos <= maxPosition) {
        maxPosition = curPos;
      }
      const x = branchPos.get(commit.branch).pos;
      const y = curPos - layoutOffset;
      commitPos.set(commit.id, { x: x, y: y });
    }
  });
};

/**
 * Draws the commits with its symbol and labels. The function has two modes, one which only
 * calculates the positions and one that does the actual drawing. This for a simple way getting the
 * vertical layering correct in the graph.
 *
 * @param {any} svg
 * @param {CommitMap} commits
 * @param {any} modifyGraph
 */
const drawCommits = (svg, commits, modifyGraph) => {
  const gitGraphConfig = getConfig().gitGraph;
  const gBullets = svg.append('g').attr('class', 'commit-bullets');
  const gLabels = svg.append('g').attr('class', 'commit-labels');
  let pos = 0;

  if (dir === 'TB' || dir === 'BT') {
    pos = defaultPos;
  }
  const keys = [...commits.keys()];
  const isParallelCommits = gitGraphConfig.parallelCommits;
  const layoutOffset = 10;
  const commitStep = 40;
  let sortedKeys =
    dir !== 'BT' || (dir === 'BT' && isParallelCommits)
      ? keys.sort((a, b) => {
          return commits.get(a).seq - commits.get(b).seq;
        })
      : keys
          .sort((a, b) => {
            return commits.get(a).seq - commits.get(b).seq;
          })
          .reverse();

  if (dir === 'BT' && isParallelCommits) {
    setParallelBTPos(sortedKeys, commits, pos, commitStep, layoutOffset);
    sortedKeys = sortedKeys.reverse();
  }
  sortedKeys.forEach((key) => {
    const commit = commits.get(key);
    if (isParallelCommits) {
      if (commit.parents.length) {
        const closestParent =
          dir === 'BT' ? findClosestParentBT(commit.parents) : findClosestParent(commit.parents);
        if (dir === 'TB') {
          pos = commitPos.get(closestParent).y + commitStep;
        } else if (dir === 'BT') {
          pos = commitPos.get(key).y - commitStep;
        } else {
          pos = commitPos.get(closestParent).x + commitStep;
        }
      } else {
        if (dir === 'TB') {
          pos = defaultPos;
        } else if (dir === 'BT') {
          pos = commitPos.get(key).y - commitStep;
        } else {
          pos = 0;
        }
      }
    }
    const posWithOffset = dir === 'BT' && isParallelCommits ? pos : pos + layoutOffset;
    const y = dir === 'TB' || dir === 'BT' ? posWithOffset : branchPos.get(commit.branch).pos;
    const x = dir === 'TB' || dir === 'BT' ? branchPos.get(commit.branch).pos : posWithOffset;

    // Don't draw the commits now but calculate the positioning which is used by the branch lines etc.
    if (modifyGraph) {
      let typeClass;
      let commitSymbolType =
        commit.customType !== undefined && commit.customType !== ''
          ? commit.customType
          : commit.type;
      switch (commitSymbolType) {
        case commitType.NORMAL:
          typeClass = 'commit-normal';
          break;
        case commitType.REVERSE:
          typeClass = 'commit-reverse';
          break;
        case commitType.HIGHLIGHT:
          typeClass = 'commit-highlight';
          break;
        case commitType.MERGE:
          typeClass = 'commit-merge';
          break;
        case commitType.CHERRY_PICK:
          typeClass = 'commit-cherry-pick';
          break;
        default:
          typeClass = 'commit-normal';
      }

      if (commitSymbolType === commitType.HIGHLIGHT) {
        const circle = gBullets.append('rect');
        circle.attr('x', x - 10);
        circle.attr('y', y - 10);
        circle.attr('height', 20);
        circle.attr('width', 20);
        circle.attr(
          'class',
          `commit ${commit.id} commit-highlight${
            branchPos.get(commit.branch).index % THEME_COLOR_LIMIT
          } ${typeClass}-outer`
        );
        gBullets
          .append('rect')
          .attr('x', x - 6)
          .attr('y', y - 6)
          .attr('height', 12)
          .attr('width', 12)
          .attr(
            'class',
            `commit ${commit.id} commit${
              branchPos.get(commit.branch).index % THEME_COLOR_LIMIT
            } ${typeClass}-inner`
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
        circle.attr(
          'class',
          `commit ${commit.id} commit${branchPos.get(commit.branch).index % THEME_COLOR_LIMIT}`
        );
        if (commitSymbolType === commitType.MERGE) {
          const circle2 = gBullets.append('circle');
          circle2.attr('cx', x);
          circle2.attr('cy', y);
          circle2.attr('r', 6);
          circle2.attr(
            'class',
            `commit ${typeClass} ${commit.id} commit${
              branchPos.get(commit.branch).index % THEME_COLOR_LIMIT
            }`
          );
        }
        if (commitSymbolType === commitType.REVERSE) {
          const cross = gBullets.append('path');
          cross
            .attr('d', `M ${x - 5},${y - 5}L${x + 5},${y + 5}M${x - 5},${y + 5}L${x + 5},${y - 5}`)
            .attr(
              'class',
              `commit ${typeClass} ${commit.id} commit${
                branchPos.get(commit.branch).index % THEME_COLOR_LIMIT
              }`
            );
        }
      }
    }
    if (dir === 'TB' || dir === 'BT') {
      commitPos.set(commit.id, { x: x, y: posWithOffset });
    } else {
      commitPos.set(commit.id, { x: posWithOffset, y: y });
    }

    // The first iteration over the commits are for positioning purposes, this
    // is required for drawing the lines. The circles and labels is drawn after the labels
    // placing them on top of the lines.
    if (modifyGraph) {
      const px = 4;
      const py = 2;
      // Draw the commit label
      if (
        commit.type !== commitType.CHERRY_PICK &&
        ((commit.customId && commit.type === commitType.MERGE) ||
          commit.type !== commitType.MERGE) &&
        gitGraphConfig.showCommitLabel
      ) {
        const wrapper = gLabels.append('g');
        const labelBkg = wrapper.insert('rect').attr('class', 'commit-label-bkg');

        const text = wrapper
          .append('text')
          .attr('x', pos)
          .attr('y', y + 25)
          .attr('class', 'commit-label')
          .text(commit.id);
        let bbox = text.node().getBBox();

        // Now we have the label, lets position the background
        labelBkg
          .attr('x', posWithOffset - bbox.width / 2 - py)
          .attr('y', y + 13.5)
          .attr('width', bbox.width + 2 * py)
          .attr('height', bbox.height + 2 * py);

        if (dir === 'TB' || dir === 'BT') {
          labelBkg.attr('x', x - (bbox.width + 4 * px + 5)).attr('y', y - 12);
          text.attr('x', x - (bbox.width + 4 * px)).attr('y', y + bbox.height - 12);
        } else {
          text.attr('x', posWithOffset - bbox.width / 2);
        }
        if (gitGraphConfig.rotateCommitLabel) {
          if (dir === 'TB' || dir === 'BT') {
            text.attr('transform', 'rotate(' + -45 + ', ' + x + ', ' + y + ')');
            labelBkg.attr('transform', 'rotate(' + -45 + ', ' + x + ', ' + y + ')');
          } else {
            let r_x = -7.5 - ((bbox.width + 10) / 25) * 9.5;
            let r_y = 10 + (bbox.width / 25) * 8.5;
            wrapper.attr(
              'transform',
              'translate(' + r_x + ', ' + r_y + ') rotate(' + -45 + ', ' + pos + ', ' + y + ')'
            );
          }
        }
      }
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
            // Note that we are delaying setting the x position until we know the width of the text
            .attr('y', y - 16 - yOffset)
            .attr('class', 'tag-label')
            .text(tagValue);
          let tagBbox = tag.node().getBBox();
          maxTagBboxWidth = Math.max(maxTagBboxWidth, tagBbox.width);
          maxTagBboxHeight = Math.max(maxTagBboxHeight, tagBbox.height);

          // We don't use the max over here to center the text within the tags
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
            ${pos - maxTagBboxWidth / 2 - px / 2},${ly + py}
            ${pos - maxTagBboxWidth / 2 - px / 2},${ly - py}
            ${posWithOffset - maxTagBboxWidth / 2 - px},${ly - h2 - py}
            ${posWithOffset + maxTagBboxWidth / 2 + px},${ly - h2 - py}
            ${posWithOffset + maxTagBboxWidth / 2 + px},${ly + h2 + py}
            ${posWithOffset - maxTagBboxWidth / 2 - px},${ly + h2 + py}`
          );

          hole
            .attr('cy', ly)
            .attr('cx', pos - maxTagBboxWidth / 2 + px / 2)
            .attr('r', 1.5)
            .attr('class', 'tag-hole');

          if (dir === 'TB' || dir === 'BT') {
            const yOrigin = pos + yOffset;

            rect
              .attr('class', 'tag-label-bkg')
              .attr(
                'points',
                `
              ${x},${yOrigin + py}
              ${x},${yOrigin - py}
              ${x + layoutOffset},${yOrigin - h2 - py}
              ${x + layoutOffset + maxTagBboxWidth + px},${yOrigin - h2 - py}
              ${x + layoutOffset + maxTagBboxWidth + px},${yOrigin + h2 + py}
              ${x + layoutOffset},${yOrigin + h2 + py}`
              )
              .attr('transform', 'translate(12,12) rotate(45, ' + x + ',' + pos + ')');
            hole
              .attr('cx', x + px / 2)
              .attr('cy', yOrigin)
              .attr('transform', 'translate(12,12) rotate(45, ' + x + ',' + pos + ')');
            tag
              .attr('x', x + 5)
              .attr('y', yOrigin + 3)
              .attr('transform', 'translate(14,14) rotate(45, ' + x + ',' + pos + ')');
          }
        }
      }
    }
    pos = dir === 'BT' && isParallelCommits ? pos + commitStep : pos + commitStep + layoutOffset;
    if (pos > maxPos) {
      maxPos = pos;
    }
  });
};

/**
 * Detect if there are commits
 * between commitA's x-position
 * and commitB's x-position on the
 * same branch as commitA, where
 * commitA isn't main
 *
 * @param {any} commitA
 * @param {any} commitB
 * @param p1
 * @param p2
 * @param {CommitMap} allCommits
 * @returns {boolean}
 * If there are commits between
 * commitA's x-position
 * and commitB's x-position
 * on the source branch, where
 * source branch is not main
 * return true
 */
const shouldRerouteArrow = (commitA, commitB, p1, p2, allCommits) => {
  const commitBIsFurthest = dir === 'TB' || dir === 'BT' ? p1.x < p2.x : p1.y < p2.y;
  const branchToGetCurve = commitBIsFurthest ? commitB.branch : commitA.branch;
  const isOnBranchToGetCurve = (x) => x.branch === branchToGetCurve;
  const isBetweenCommits = (x) => x.seq > commitA.seq && x.seq < commitB.seq;
  return [...allCommits.values()].some((commitX) => {
    return isBetweenCommits(commitX) && isOnBranchToGetCurve(commitX);
  });
};

/**
 * This function find a lane in the y-axis that is not overlapping with any other lanes. This is
 * used for drawing the lines between commits.
 *
 * @param {any} y1
 * @param {any} y2
 * @param {any} depth
 * @returns {number} Y value between y1 and y2
 */
const findLane = (y1, y2, depth = 0) => {
  const candidate = y1 + Math.abs(y1 - y2) / 2;
  if (depth > 5) {
    return candidate;
  }

  let ok = lanes.every((lane) => Math.abs(lane - candidate) >= 10);
  if (ok) {
    lanes.push(candidate);
    return candidate;
  }
  const diff = Math.abs(y1 - y2);
  return findLane(y1, y2 - diff / 5, depth + 1);
};

/**
 * Draw the lines between the commits. They were arrows initially.
 *
 * @param {any} svg
 * @param {any} commitA
 * @param {any} commitB
 * @param {CommitMap} allCommits
 */
const drawArrow = (svg, commitA, commitB, allCommits) => {
  const p1 = commitPos.get(commitA.id); // arrowStart
  const p2 = commitPos.get(commitB.id); // arrowEnd
  const arrowNeedsRerouting = shouldRerouteArrow(commitA, commitB, p1, p2, allCommits);
  // log.debug('drawArrow', p1, p2, arrowNeedsRerouting, commitA.id, commitB.id);

  // Lower-right quadrant logic; top-left is 0,0

  let arc = '';
  let arc2 = '';
  let radius = 0;
  let offset = 0;
  let colorClassNum = branchPos.get(commitB.branch).index;
  if (commitB.type === commitType.MERGE && commitA.id !== commitB.parents[0]) {
    colorClassNum = branchPos.get(commitA.branch).index;
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
        colorClassNum = branchPos.get(commitA.branch).index;
        lineDef = `M ${p1.x} ${p1.y} L ${lineX + radius} ${p1.y} ${arc} ${lineX} ${
          p1.y + offset
        } L ${lineX} ${p2.y - radius} ${arc2} ${lineX - offset} ${p2.y} L ${p2.x} ${p2.y}`;
      }
    } else if (dir === 'BT') {
      if (p1.x < p2.x) {
        // Source commit is on branch position left of destination commit
        // so render arrow rightward with colour of destination branch
        lineDef = `M ${p1.x} ${p1.y} L ${lineX - radius} ${p1.y} ${arc} ${lineX} ${
          p1.y - offset
        } L ${lineX} ${p2.y + radius} ${arc2} ${lineX + offset} ${p2.y} L ${p2.x} ${p2.y}`;
      } else {
        // Source commit is on branch position right of destination commit
        // so render arrow leftward with colour of source branch
        colorClassNum = branchPos.get(commitA.branch).index;
        lineDef = `M ${p1.x} ${p1.y} L ${lineX + radius} ${p1.y} ${arc2} ${lineX} ${
          p1.y - offset
        } L ${lineX} ${p2.y + radius} ${arc} ${lineX - offset} ${p2.y} L ${p2.x} ${p2.y}`;
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
        colorClassNum = branchPos.get(commitA.branch).index;
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
  svg
    .append('path')
    .attr('d', lineDef)
    .attr('class', 'arrow arrow' + (colorClassNum % THEME_COLOR_LIMIT));
};

/**
 * @param {*} svg
 * @param {CommitMap} commits
 */
const drawArrows = (svg, commits) => {
  const gArrows = svg.append('g').attr('class', 'commit-arrows');
  [...commits.keys()].forEach((key) => {
    const commit = commits.get(key);
    if (commit.parents && commit.parents.length > 0) {
      commit.parents.forEach((parent) => {
        drawArrow(gArrows, commits.get(parent), commit, commits);
      });
    }
  });
};

/**
 * Adds the branches and the branches' labels to the svg.
 *
 * @param svg
 * @param branches
 */
const drawBranches = (svg, branches) => {
  const gitGraphConfig = getConfig().gitGraph;
  const g = svg.append('g');
  branches.forEach((branch, index) => {
    const adjustIndexForTheme = index % THEME_COLOR_LIMIT;

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

    let name = branch.name;

    // Create the actual text element
    const labelElement = drawText(name);
    // Create outer g, edgeLabel, this will be positioned after graph layout
    const bkg = g.insert('rect');
    const branchLabel = g.insert('g').attr('class', 'branchLabel');

    // Create inner g, label, this will be positioned now for centering the text
    const label = branchLabel.insert('g').attr('class', 'label branch-label' + adjustIndexForTheme);
    label.node().appendChild(labelElement);
    let bbox = labelElement.getBBox();
    bkg
      .attr('class', 'branchLabelBkg label' + adjustIndexForTheme)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('x', -bbox.width - 4 - (gitGraphConfig.rotateCommitLabel === true ? 30 : 0))
      .attr('y', -bbox.height / 2 + 8)
      .attr('width', bbox.width + 18)
      .attr('height', bbox.height + 4);
    label.attr(
      'transform',
      'translate(' +
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

/**
 * @param txt
 * @param id
 * @param ver
 * @param diagObj
 */
export const draw = function (txt, id, ver, diagObj) {
  clear();
  const conf = getConfig();
  const gitGraphConfig = conf.gitGraph;
  // try {
  log.debug('in gitgraph renderer', txt + '\n', 'id:', id, ver);

  allCommitsDict = diagObj.db.getCommits();
  const branches = diagObj.db.getBranchesAsObjArray();
  dir = diagObj.db.getDirection();
  const diagram = select(`[id="${id}"]`);
  // Position branches
  let pos = 0;
  branches.forEach((branch, index) => {
    const labelElement = drawText(branch.name);
    const g = diagram.append('g');
    const branchLabel = g.insert('g').attr('class', 'branchLabel');
    const label = branchLabel.insert('g').attr('class', 'label branch-label');
    label.node().appendChild(labelElement);
    let bbox = labelElement.getBBox();

    branchPos.set(branch.name, { pos, index });
    pos +=
      50 +
      (gitGraphConfig.rotateCommitLabel ? 40 : 0) +
      (dir === 'TB' || dir === 'BT' ? bbox.width / 2 : 0);
    label.remove();
    branchLabel.remove();
    g.remove();
  });

  drawCommits(diagram, allCommitsDict, false);
  if (gitGraphConfig.showBranches) {
    drawBranches(diagram, branches);
  }
  drawArrows(diagram, allCommitsDict);
  drawCommits(diagram, allCommitsDict, true);
  utils.insertTitle(
    diagram,
    'gitTitleText',
    gitGraphConfig.titleTopMargin,
    diagObj.db.getDiagramTitle()
  );

  // Setup the view box and size of the svg element
  setupGraphViewbox(
    undefined,
    diagram,
    gitGraphConfig.diagramPadding,
    gitGraphConfig.useMaxWidth ?? conf.useMaxWidth
  );
};

export default {
  draw,
};
