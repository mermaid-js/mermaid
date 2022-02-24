/* eslint-disable */
import { curveBasis, line, select } from 'd3';
import { interpolateToCurve, getStylesFromArray, configureSvgSize } from '../../utils';
// import db from './gitGraphAst';
import * as db from './mockDb';
import gitGraphParser from './parser/gitGraph';
import { log } from '../../logger';
/* eslint-disable */
import { getConfig } from '../../config';
let allCommitsDict = {};
let branchNum;

let branchPos = {};
let commitPos = {};
let maxPos = 0;
const clear = () => {
  branchPos = {};
  commitPos = {};
  allCommitsDict = {};
  maxPos = 0;
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


const drawCommits = (svg, commits) => {
  const gBullets = svg.append('g').attr('class', 'commit-bullets');
  const gLabels = svg.append('g').attr('class', 'commit-labels');
  let pos = 0;

  const keys = Object.keys(commits);
  keys.forEach((key, index) => {
    const commit = commits[key];

    // log.debug('drawCommits (commit branchPos)', commit, branchPos);
    const y = branchPos[commit.branch].pos;
    const line = gBullets.append('circle');
    line.attr('cx', pos + 10);
    line.attr('cy', y);
    line.attr('r', 10);
    line.attr('class', 'commit commit-'+commit.type + ' ' + commit.id + ' commit' + branchPos[commit.branch].index);
    commitPos[commit.id] = {x: pos + 10, y: y};

    const text = gLabels.append('text')
      // .attr('x', pos + 10)
      .attr('y', y + 25)
      .attr('class', 'commit-label')
      .text(commit.id);
    let bbox = text.node().getBBox();
    text.attr('x', pos + 10 - bbox.width / 2);
    pos +=50;
    if(pos>maxPos) {
      maxPos = pos;
    }
  });
}

const drawArrow = (svg, commit1, commit2) => {
  const conf = getConfig();
  // const config = getConfig().gitGraph;
  // const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  // line.setAttribute('x1', commitPos[commit1.id].x);
  // line.setAttribute('y1', commitPos[commit1.id].y);
  // line.setAttribute('x2', commitPos[commit2.id].x);
  // line.setAttribute('y2', commitPos[commit2.id].y);
  // line.setAttribute('class', 'commit-line');
  // line.setAttribute('stroke-width', config.arrow.strokeWidth);
  // line.setAttribute('stroke', config.arrow.stroke);
  // line.setAttribute('marker-end', 'url(#arrowhead)');
  // return line;

  const p1 = commitPos[commit1.id];
  const p2 = commitPos[commit2.id];
  log.debug('drawArrow', p1, p2);

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

  const arrow = svg.append('line').attr('x1', p1.x)
      .attr('y1', p1.y)
      .attr('x2', p2.x)
      .attr('y2', p2.y)
      .attr('class', 'arrow')
      .attr('marker-end', 'url(' + url + '#arrowhead)');
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
        drawArrow(gArrows, commits[parent], commit);
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

      // Create the actual text element
      const labelElement = drawText(branch.name);
      // Create outer g, edgeLabel, this will be positioned after graph layout
      const bkg = g.insert('rect');
      const branchLabel = g.insert('g').attr('class', 'branchLabel');

      // Create inner g, label, this will be positioned now for centering the text
      const label = branchLabel.insert('g').attr('class', 'label');
      label.node().appendChild(labelElement);
      let bbox = labelElement.getBBox();
      //logger.info(bbox);
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
  // parser.parse(txt + '\n');

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
    // .attr('stroke', 'red')
    // .attr('fill', 'red')
    .append('path')
    .attr('d', 'M 0 0 L 20 10 L 0 20 z'); // this is actual shape for arrowhead

  drawCommits(diagram, allCommitsDict);
  drawBranches(diagram, branches);
  drawArrows(diagram, allCommitsDict);

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
