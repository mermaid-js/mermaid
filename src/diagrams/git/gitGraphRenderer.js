import { curveBasis, line, select } from 'd3';
import { interpolateToCurve, getStylesFromArray, configureSvgSize } from '../../utils';
import db from './gitGraphAst';
import gitGraphParser from './parser/gitGraph';
import { log } from '../../logger';
import { getConfig } from '../../config';
import addSVGAccessibilityFields from '../../accessibility';

let allCommitsDict = {};
let branchNum;

const commitType = {
  NORMAL: 0,
  REVERSE: 1,
  HIGHLIGHT: 2,
  MERGE: 3,
};

let branchPos = {};
let commitPos = {};
let lanes = [];
let maxPos = 0;
const clear = () => {
  branchPos = {};
  commitPos = {};
  allCommitsDict = {};
  maxPos = 0;
  lanes = [];
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

  for (let j = 0; j < rows.length; j++) {
    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    tspan.setAttribute('dy', '1em');
    tspan.setAttribute('x', '0');
    tspan.setAttribute('class', 'row');
    tspan.textContent = rows[j].trim();
    svgLabel.appendChild(tspan);
  }
  /**
   * @param svg
   * @param selector
   */
  return svgLabel;
};

/**
 * Draws the commits with its symbol and labels. The function has tywo modes, one which only
 * calculates the positions and one that does the actual drawing. This for a simple way getting the
 * vertical leyering rcorrect in the graph.
 *
 * @param {any} svg
 * @param {any} commits
 * @param {any} modifyGraph
 */
const drawCommits = (svg, commits, modifyGraph) => {
  const gitGraphConfig = getConfig().gitGraph;
  const gBullets = svg.append('g').attr('class', 'commit-bullets');
  const gLabels = svg.append('g').attr('class', 'commit-labels');
  let pos = 0;

  const keys = Object.keys(commits);
  const sortedKeys = keys.sort((a, b) => {
    return commits[a].seq - commits[b].seq;
  });
  sortedKeys.forEach((key, index) => {
    const commit = commits[key];

    const y = branchPos[commit.branch].pos;
    const x = pos + 10;
    // Don't draw the commits now but calculate the positioning which is used by the branch lines etc.
    if (modifyGraph) {
      let typeClass;
      switch (commit.type) {
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
        default:
          typeClass = 'commit-normal';
      }

      if (commit.type === commitType.HIGHLIGHT) {
        const circle = gBullets.append('rect');
        circle.attr('x', x - 10);
        circle.attr('y', y - 10);
        circle.attr('height', 20);
        circle.attr('width', 20);
        circle.attr(
          'class',
          'commit ' +
            commit.id +
            ' commit-highlight' +
            branchPos[commit.branch].index +
            ' ' +
            typeClass +
            '-outer'
        );
        gBullets
          .append('rect')
          .attr('x', x - 6)
          .attr('y', y - 6)
          .attr('height', 12)
          .attr('width', 12)
          .attr(
            'class',
            'commit ' +
              commit.id +
              ' commit' +
              branchPos[commit.branch].index +
              ' ' +
              typeClass +
              '-inner'
          );
      } else {
        const circle = gBullets.append('circle');
        circle.attr('cx', x);
        circle.attr('cy', y);
        circle.attr('r', commit.type === commitType.MERGE ? 9 : 10);
        circle.attr('class', 'commit ' + commit.id + ' commit' + branchPos[commit.branch].index);
        if (commit.type === commitType.MERGE) {
          const circle2 = gBullets.append('circle');
          circle2.attr('cx', x);
          circle2.attr('cy', y);
          circle2.attr('r', 6);
          circle2.attr(
            'class',
            'commit ' + typeClass + ' ' + commit.id + ' commit' + branchPos[commit.branch].index
          );
        }
        if (commit.type === commitType.REVERSE) {
          const cross = gBullets.append('path');
          cross
            .attr('d', `M ${x - 5},${y - 5}L${x + 5},${y + 5}M${x - 5},${y + 5}L${x + 5},${y - 5}`)
            .attr(
              'class',
              'commit ' + typeClass + ' ' + commit.id + ' commit' + branchPos[commit.branch].index
            );
        }
      }
    }
    commitPos[commit.id] = { x: pos + 10, y: y };

    // The first iteration over the commits are for positioning purposes, this
    // is required for drawing the lines. The circles and labels is drawn after the labels
    // placing them on top of the lines.
    if (modifyGraph) {
      const px = 4;
      const py = 2;
      // Draw the commit label
      if (commit.type !== commitType.MERGE && gitGraphConfig.showCommitLabel) {
        const labelBkg = gLabels.insert('rect').attr('class', 'commit-label-bkg');

        const text = gLabels
          .append('text')
          .attr('x', pos)
          .attr('y', y + 25)
          .attr('class', 'commit-label')
          .text(commit.id);
        let bbox = text.node().getBBox();

        // Now we have the label, lets position the background
        labelBkg
          .attr('x', pos + 10 - bbox.width / 2 - py)
          .attr('y', y + 13.5)
          .attr('width', bbox.width + 2 * py)
          .attr('height', bbox.height + 2 * py);
        text.attr('x', pos + 10 - bbox.width / 2);
      }
      if (commit.tag) {
        const rect = gLabels.insert('polygon');
        const hole = gLabels.append('circle');
        const tag = gLabels
          .append('text')
          // Note that we are delaying setting the x position until we know the width of the text
          .attr('y', y - 16)
          .attr('class', 'tag-label')
          .text(commit.tag);
        let tagBbox = tag.node().getBBox();
        tag.attr('x', pos + 10 - tagBbox.width / 2);

        const h2 = tagBbox.height / 2;
        const ly = y - 19.2;
        rect.attr('class', 'tag-label-bkg').attr(
          'points',
          `
          ${pos - tagBbox.width / 2 - px / 2},${ly + py}
          ${pos - tagBbox.width / 2 - px / 2},${ly - py}
          ${pos + 10 - tagBbox.width / 2 - px},${ly - h2 - py}
          ${pos + 10 + tagBbox.width / 2 + px},${ly - h2 - py}
          ${pos + 10 + tagBbox.width / 2 + px},${ly + h2 + py}
          ${pos + 10 - tagBbox.width / 2 - px},${ly + h2 + py}`
        );

        hole
          .attr('cx', pos - tagBbox.width / 2 + px / 2)
          .attr('cy', ly)
          .attr('r', 1.5)
          .attr('class', 'tag-hole');
      }
    }
    pos += 50;
    if (pos > maxPos) {
      maxPos = pos;
    }
  });
};

/**
 * Detect if there are other commits between commit1s x-position and commit2s x-position on the same
 * branch as commit2.
 *
 * @param {any} commit1
 * @param {any} commit2
 * @param allCommits
 * @returns
 */
const hasOverlappingCommits = (commit1, commit2, allCommits) => {
  const commit1Pos = commitPos[commit2.id];
  const commit2Pos = commitPos[commit1.id];

  // Find commits on the same branch as commit2
  const keys = Object.keys(allCommits);
  const overlappingComits = keys.filter((key) => {
    return (
      allCommits[key].branch === commit2.branch &&
      allCommits[key].seq > commit1.seq &&
      allCommits[key].seq < commit2.seq
    );
  });

  return overlappingComits.length > 0;
};

/**
 * This function find a lane in the y-axis that is not overlapping with any other lanes. This is
 * used for drawing the lines between commits.
 *
 * @param {any} y1
 * @param {any} y2
 * @param {any} _depth
 * @returns
 */
const findLane = (y1, y2, _depth) => {
  const depth = _depth || 0;

  const candidate = y1 + Math.abs(y1 - y2) / 2;
  if (depth > 5) {
    return candidate;
  }

  let ok = true;
  for (let i = 0; i < lanes.length; i++) {
    if (Math.abs(lanes[i] - candidate) < 10) {
      ok = false;
    }
  }
  if (ok) {
    lanes.push(candidate);
    return candidate;
  }
  const diff = Math.abs(y1 - y2);
  return findLane(y1, y2 - diff / 5, depth);
};

/**
 * This function draw trhe lines between the commits. They were arrows initially.
 *
 * @param {any} svg
 * @param {any} commit1
 * @param {any} commit2
 * @param {any} allCommits
 */
const drawArrow = (svg, commit1, commit2, allCommits) => {
  const conf = getConfig();

  const p1 = commitPos[commit1.id];
  const p2 = commitPos[commit2.id];
  const overlappingCommits = hasOverlappingCommits(commit1, commit2, allCommits);
  // log.debug('drawArrow', p1, p2, overlappingCommits, commit1.id, commit2.id);

  let url = '';
  if (conf.arrowMarkerAbsolute) {
    url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  let arc = '';
  let arc2 = '';
  let radius = 0;
  let offset = 0;
  let colorClassNum = branchPos[commit2.branch].index;
  let lineDef;
  if (overlappingCommits) {
    arc = 'A 10 10, 0, 0, 0,';
    arc2 = 'A 10 10, 0, 0, 1,';
    radius = 10;
    offset = 10;
    // Figure out the color of the arrow,arrows going down take the color from the destination branch
    colorClassNum = branchPos[commit2.branch].index;

    const lineY = p1.y < p2.y ? findLane(p1.y, p2.y) : findLane(p2.y, p1.y);

    if (p1.y < p2.y) {
      lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${lineY - radius} ${arc} ${p1.x + offset} ${lineY} L ${
        p2.x - radius
      } ${lineY} ${arc2} ${p2.x} ${lineY + offset} L ${p2.x} ${p2.y}`;
    } else {
      lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${lineY + radius} ${arc2} ${
        p1.x + offset
      } ${lineY} L ${p2.x - radius} ${lineY} ${arc} ${p2.x} ${lineY - offset} L ${p2.x} ${p2.y}`;
    }
  } else {
    if (p1.y < p2.y) {
      arc = 'A 20 20, 0, 0, 0,';
      radius = 20;
      offset = 20;

      // Figure out the color of the arrow,arrows going down take the color from the destination branch
      colorClassNum = branchPos[commit2.branch].index;

      lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y - radius} ${arc} ${p1.x + offset} ${p2.y} L ${
        p2.x
      } ${p2.y}`;
    }
    if (p1.y > p2.y) {
      arc = 'A 20 20, 0, 0, 0,';
      radius = 20;
      offset = 20;

      // Arrows going up take the color from the source branch
      colorClassNum = branchPos[commit1.branch].index;
      lineDef = `M ${p1.x} ${p1.y} L ${p2.x - radius} ${p1.y} ${arc} ${p2.x} ${p1.y - offset} L ${
        p2.x
      } ${p2.y}`;
    }

    if (p1.y === p2.y) {
      colorClassNum = branchPos[commit1.branch].index;
      lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y - radius} ${arc} ${p1.x + offset} ${p2.y} L ${
        p2.x
      } ${p2.y}`;
    }
  }
  const arrow = svg
    .append('path')
    .attr('d', lineDef)
    .attr('class', 'arrow arrow' + colorClassNum);
};

const drawArrows = (svg, commits) => {
  const gArrows = svg.append('g').attr('class', 'commit-arrows');
  let pos = 0;

  const k = Object.keys(commits);
  k.forEach((key, index) => {
    const commit = commits[key];
    if (commit.parents && commit.parents.length > 0) {
      commit.parents.forEach((parent) => {
        drawArrow(gArrows, commits[parent], commit, commits);
      });
    }
  });
};

/**
 * This function adds the branches and the branches' labels to the svg.
 *
 * @param svg
 * @param commitid
 * @param branches
 * @param direction
 */
const drawBranches = (svg, branches) => {
  const gitGraphConfig = getConfig().gitGraph;
  const g = svg.append('g');
  branches.forEach((branch, index) => {
    const pos = branchPos[branch.name].pos;
    const line = g.append('line');
    line.attr('x1', 0);
    line.attr('y1', pos);
    line.attr('x2', maxPos);
    line.attr('y2', pos);
    line.attr('class', 'branch branch' + index);

    lanes.push(pos);

    let name = branch.name;

    // Create the actual text element
    const labelElement = drawText(name);
    // Create outer g, edgeLabel, this will be positioned after graph layout
    const bkg = g.insert('rect');
    const branchLabel = g.insert('g').attr('class', 'branchLabel');

    // Create inner g, label, this will be positioned now for centering the text
    const label = branchLabel.insert('g').attr('class', 'label branch-label' + index);
    label.node().appendChild(labelElement);
    let bbox = labelElement.getBBox();
    bkg
      .attr('class', 'branchLabelBkg label' + index)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('x', -bbox.width - 4)
      .attr('y', -bbox.height / 2 + 8)
      .attr('width', bbox.width + 18)
      .attr('height', bbox.height + 4);

    label.attr(
      'transform',
      'translate(' + (-bbox.width - 14) + ', ' + (pos - bbox.height / 2 - 1) + ')'
    );
    bkg.attr('transform', 'translate(' + -19 + ', ' + (pos - bbox.height / 2) + ')');
  });
};

/**
 * @param svg
 * @param commit
 * @param direction
 * @param branchColor
 * @param txt
 * @param id
 * @param ver
 */
export const draw = function (txt, id, ver) {
  clear();
  const conf = getConfig();
  const gitGraphConfig = getConfig().gitGraph;
  // try {
  const parser = gitGraphParser.parser;
  parser.yy = db;
  parser.yy.clear();

  log.debug('in gitgraph renderer', txt + '\n', 'id:', id, ver);
  // // Parse the graph definition
  parser.parse(txt + '\n');

  const direction = db.getDirection();
  allCommitsDict = db.getCommits();
  const branches = db.getBranchesAsObjArray();

  // Position branches vertically
  let pos = 0;
  branches.forEach((branch, index) => {
    branchPos[branch.name] = { pos, index };
    pos += 50;
  });

  const diagram = select(`[id="${id}"]`);

  // Adds title and description to the flow chart
  addSVGAccessibilityFields(parser.yy, diagram, id);

  drawCommits(diagram, allCommitsDict, false);
  if (gitGraphConfig.showBranches) {
    drawBranches(diagram, branches);
  }
  drawArrows(diagram, allCommitsDict);
  drawCommits(diagram, allCommitsDict, true);

  const padding = gitGraphConfig.diagramPadding;
  const svgBounds = diagram.node().getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;

  configureSvgSize(diagram, height, width, conf.useMaxWidth);
  const vBox = `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`;
  diagram.attr('viewBox', vBox);
};

export default {
  draw,
};
