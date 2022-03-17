/* eslint-disable */
import { curveBasis, line, select } from 'd3';
import { interpolateToCurve, getStylesFromArray, configureSvgSize } from '../../utils';
import db from './gitGraphAst';
//import * as db from './mockDb';
import gitGraphParser from './parser/gitGraph';
import { log } from '../../logger';
/* eslint-disable */
import { getConfig } from '../../config';
let allCommitsDict = {};
let branchNum;

const commitType = db.commitType;

let branchPos = {};
let commitPos = {};
let lanes = [];
let maxPos = 0;
const clear = () => {
  branchPos = {};
  commitPos = {};
  allCommitsDict = {};
  maxPos = 0;
  lanes = []
};

// let apiConfig = {};
// export const setConf = function(c) {
//   apiConfig = c;
// };
/** @param svg */
function svgCreateDefs(svg) {
  const config = getConfig().gitGraph;
  svg
    .append('defs')
    .append('g')
    .attr('id', 'def-commit')
    .append('circle')
    .attr('r', config.nodeRadius)
    .attr('cx', 0)
    .attr('cy', 0);
  svg
    .select('#def-commit')
    .append('foreignObject')
    .attr('width', config.nodeLabel.width)
    .attr('height', config.nodeLabel.height)
    .attr('x', config.nodeLabel.x)
    .attr('y', config.nodeLabel.y)
    .attr('class', 'node-label')
    .attr('requiredFeatures', 'http://www.w3.org/TR/SVG11/feature#Extensibility')
    .append('p')
    .html('');
}

/**
 * @param svg
 * @param points
 * @param colorIdx
 * @param interpolate
 */
/**
// Pass in the element and its pre-transform coords
 *
 * @param element
 * @param coords
 */

/**
 * @param svg
 * @param fromId
 * @param toId
 * @param direction
 * @param color
 */

const drawText = (txt) => {
  const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    // svgLabel.setAttribute('style', style.replace('color:', 'fill:'));
    let rows = [];

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
}


const drawCommits = (svg, commits, modifyGraph) => {
  const gBullets = svg.append('g').attr('class', 'commit-bullets');
  const gLabels = svg.append('g').attr('class', 'commit-labels');
  let pos = 0;

  const keys = Object.keys(commits);
  const sortedKeys = keys.sort((a, b) => {
    return commits[a].seq - commits[b].seq;
  })
  sortedKeys.forEach((key, index) => {
    const commit = commits[key];

    // log.debug('drawCommits (commit branchPos)', commit, branchPos);
    const y = branchPos[commit.branch].pos;
    const x  = pos + 10;
    // Don't draw the commits now but calculate the positioning which is used by the branmch lines etc.
    if (modifyGraph) {
      let typeClass;
      switch(commit.type) {
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
        circle.attr('x', x-10);
        circle.attr('y', y-10);
        circle.attr('height', 20);
        circle.attr('width', 20);
        circle.attr('class', 'commit ' + commit.id  + ' commit-highlight' + branchPos[commit.branch].index + ' ' + typeClass+'-outer');
        gBullets.append('rect')
        .attr('x', x-6)
        .attr('y', y-6)
        .attr('height', 12)
        .attr('width', 12)
        .attr('class', 'commit ' + commit.id  + ' commit' + branchPos[commit.branch].index + ' ' + typeClass+'-inner');
      } else {
        const circle = gBullets.append('circle');
        circle.attr('cx', x);
        circle.attr('cy', y);
        circle.attr('r', commit.type === commitType.MERGE ? 9:10);
        circle.attr('class', 'commit ' + commit.id  + ' commit' + branchPos[commit.branch].index);
        if(commit.type === commitType.MERGE) {
          const circle2 = gBullets.append('circle');
          circle2.attr('cx', x);
          circle2.attr('cy', y);
          circle2.attr('r', 6);
          circle2.attr('class', 'commit '+typeClass + ' ' + commit.id  + ' commit' + branchPos[commit.branch].index);
        }
        if(commit.type === commitType.REVERSE) {
          const cross = gBullets.append('path');
          cross
            .attr('d', `M ${x-5},${y-5}L${x+5},${y+5}M${x-5},${y+5}L${x+5},${y-5}`)
            .attr('class', 'commit '+typeClass + ' ' + commit.id  + ' commit' + branchPos[commit.branch].index);
        }
      }
    }
    commitPos[commit.id] = {x: pos + 10, y: y};

    if (modifyGraph) {
      const text = gLabels.append('text')
        // .attr('x', pos + 10)
        .attr('y', y + 25)
        .attr('class', 'commit-label')
        .text(commit.id);
      let bbox = text.node().getBBox();
      text.attr('x', pos + 10 - bbox.width / 2);
    }
    pos +=50;
    if(pos>maxPos) {
      maxPos = pos;
    }
  });
}

/**
 * Detect if there are other commits between commit1s x-position and commit2s x-position on the same branch as commit2.
 * @param {*} commit1
 * @param {*} commit2
 * @returns
 */
const hasOverlappingCommits = (commit1, commit2, allCommits) => {
  const commit1Pos = commitPos[commit2.id];
  const commit2Pos = commitPos[commit1.id];
    // if(commit1.id.match('4-')) {
    //   log.info('Ugge 1', commit1, commit2);
    // }

  // Find commits on the same branch as commit2
  const keys = Object.keys(allCommits);
  const overlappingComits = keys.filter((key) => {
    // if(commit1.id.match('4-') && allCommits[key].branch === commit2.branch) {
    //   log.info('Ugge seq of the commit', allCommits[key].seq, ' commit 1 seq', commit1.seq ,' commit2 seq' ,commit2.seq);
    // }
    return allCommits[key].branch === commit2.branch && allCommits[key].seq > commit1.seq && allCommits[key].seq < commit2.seq
  });



  // if (commit1Pos.x === commit2Pos.x) {
  //   return commit1Pos.y === commit2Pos.y;
  // }
  return overlappingComits.length > 0;
}
/**
 *
 */
const findLane = (y1, y2, _depth) => {
  const depth = _depth || 0;

  const candidate =  y1 + Math.abs(y1 - y2) / 2;
  if(depth > 5) {
    return candidate;
  }

  let ok = true;
  for(let i = 0; i < lanes.length; i++) {
    if(Math.abs(lanes[i] - candidate) < 10) {
      ok = false;
    }
  }
  if(ok) {
    lanes.push(candidate);
    return candidate;
  }
  const diff = Math.abs(y1 - y2);
  return findLane(y1, y2-(diff/5), depth);
}

const drawArrow = (svg, commit1, commit2, allCommits) => {
  const conf = getConfig();

  const p1 = commitPos[commit1.id];
  const p2 = commitPos[commit2.id];
  const overlappingCommits = hasOverlappingCommits(commit1, commit2, allCommits);
  log.debug('drawArrow', p1, p2, overlappingCommits, commit1.id, commit2.id);

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
  let offset = 0
  let colorClassNum = branchPos[commit2.branch].index
  let lineDef;
  if(overlappingCommits) {
      arc = 'A 10 10, 0, 0, 0,';
      arc2 = 'A 10 10, 0, 0, 1,';
      radius = 10;
      offset = 10;
    // Figure out the color of the arrow,arrows going down take the color from the destination branch
      colorClassNum = branchPos[commit2.branch].index;

      const lineY = p1.y < p2.y ? findLane(p1.y, p2.y):findLane(p2.y, p1.y);

      if(p1.y < p2.y) {
        lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${lineY-radius} ${arc} ${p1.x + offset} ${lineY} L ${p2.x-radius} ${lineY} ${arc2} ${p2.x} ${lineY+offset} L ${p2.x} ${p2.y}`;
      } else {
        lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${lineY+radius} ${arc2} ${p1.x + offset} ${lineY} L ${p2.x-radius} ${lineY} ${arc} ${p2.x} ${lineY-offset} L ${p2.x} ${p2.y}`;
      }

  } else {

    if(p1.y < p2.y) {
      arc = 'A 20 20, 0, 0, 0,';
      radius = 20;
      offset = 20;
    // Figure out the color of the arrow,arrows going down take the color from the destination branch
      colorClassNum = branchPos[commit2.branch].index;

      lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y-radius} ${arc} ${p1.x + offset} ${p2.y} L ${p2.x} ${p2.y}`;
    }
    if(p1.y > p2.y) {
      arc = 'A 20 20, 0, 0, 0,';
      radius = 20;
      offset = 20;
    // Arrows going up take the color from the source branch
      colorClassNum = branchPos[commit1.branch].index;
      lineDef = `M ${p1.x} ${p1.y} L ${p2.x-radius} ${p1.y} ${arc} ${p2.x} ${p1.y-offset} L ${p2.x} ${p2.y}`;
    }

    if(p1.y === p2.y) {
      colorClassNum = branchPos[commit1.branch].index
      lineDef = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y-radius} ${arc} ${p1.x + offset} ${p2.y} L ${p2.x} ${p2.y}`;
    }
  }
  const arrow = svg.append('path').attr('d', lineDef)
      .attr('class', 'arrow arrow' +  colorClassNum)
      // .attr('marker-end', 'url(' + url + '#arrowhead)');
}

const drawArrows = (svg, commits) => {
  const gArrows = svg.append('g').attr('class', 'commit-arrows');
  let pos = 0;

  const k = Object.keys(commits);
  console.log('drawArrows', k);
  k.forEach((key, index) => {
    const commit = commits[key];
    if(commit.parents && commit.parents.length>0) {
      commit.parents.forEach((parent) => {
        drawArrow(gArrows, commits[parent], commit, commits);
      });
    }
  });
}

/**
 * @param svg
 * @param commitid
 * @param branches
 * @param direction
 */
const drawBranches = (svg, branches) => {
  const g = svg.append('g')
    branches.forEach((branch, index) => {
      const pos = branchPos[branch.name].pos;
      const line = g.append('line');
      line.attr('x1', 0);
      line.attr('y1', pos);
      line.attr('x2', maxPos);
      line.attr('y2', pos);
      line.attr('class', 'branch branch'+index)

      lanes.push(pos);

      // Create the actual text element
      const labelElement = drawText(branch.name);
      // Create outer g, edgeLabel, this will be positioned after graph layout
      const bkg = g.insert('rect');
      const branchLabel = g.insert('g').attr('class', 'branchLabel');

      // Create inner g, label, this will be positioned now for centering the text
      const label = branchLabel.insert('g').attr('class', 'label branch-label'+index);
      label.node().appendChild(labelElement);
      let bbox = labelElement.getBBox();
      bkg.attr('class', 'branchLabelBkg label' + index)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('x', -bbox.width -4)
        .attr('y', -bbox.height / 2 +8 )
        .attr('width', bbox.width + 18)
        .attr('height', bbox.height + 4);

      label.attr('transform', 'translate(' + (-bbox.width -14) + ', ' + (pos - bbox.height/2-1) + ')');
      bkg.attr('transform', 'translate(' + -19 + ', ' + (pos - bbox.height/2) + ')');
    })

}

/**
 * @param svg
 * @param commit
 * @param direction
 * @param branchColor
 */
export const draw = function (txt, id, ver) {
  clear();
  const config = getConfig().gitGraph;

  // try {
  const parser = gitGraphParser.parser;
  parser.yy = db;
  parser.yy.clear();

    log.debug('in gitgraph renderer', txt + '\n', 'id:', id, ver);
  // // Parse the graph definition
  parser.parse(txt + '\n');

  // config = Object.assign(config, apiConfig, db.getOptions());
  const direction = db.getDirection();
  allCommitsDict = db.getCommits();
  const branches = db.getBranchesAsObjArray();

  // Position branches vertically
  let pos=0;
  branches.forEach((branch, index) => {
    branchPos[branch.name] = {pos, index};
    pos+=50;
  });



  log.debug('brach pos ', branchPos);
  log.debug('effective options', config, branches);
  log.debug('commits', allCommitsDict);

  const diagram = select(`[id="${id}"]`);
  svgCreateDefs(diagram);

    diagram
    .append('defs')
    .append('marker')
    .attr('id', 'arrowhead')
    .attr('refX',24)
    .attr('refY', 10)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 24)
    .attr('markerHeight', 24)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 20 10 L 0 20 z'); // this is actual shape for arrowhead

  drawCommits(diagram, allCommitsDict, false);
  drawBranches(diagram, branches);
  drawArrows(diagram, allCommitsDict);
  drawCommits(diagram, allCommitsDict, true);

  const padding = config.diagramPadding;
  const svgBounds = diagram.node().getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;

  configureSvgSize(diagram, height, width, config.useMaxWidth);
  const vBox = `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`;
 // logger.debug(`viewBox ${vBox}`);
  diagram.attr('viewBox', vBox);
};

export default {
  draw,
};
