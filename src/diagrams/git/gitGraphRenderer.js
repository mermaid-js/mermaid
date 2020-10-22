/* eslint-disable */
import { curveBasis, line, select } from 'd3';
import { interpolateToCurve, getStylesFromArray, configureSvgSize } from '../../utils';
import { logger } from '../../logger'; // eslint-disable-line
// import db from './gitGraphAst';
import * as db from './mockDb';
import gitGraphParser from './parser/gitGraph';
import { getConfig } from '../../config';
/* eslint-disable */

let allCommitsDict = {};
let branchNum;
// let apiConfig = {};
// export const setConf = function(c) {
//   apiConfig = c;
// };
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
  return svgLabel;
}

const drawBranches = (svg, branches) => {
  const g = svg.append('g')
  let pos = 0;
    branches.forEach((branch, index) => {
      const line = g.append('line');
      line.attr('x1', 0);
      line.attr('y1', pos);
      line.attr('x2', 500);
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
      logger.info(bbox);
      bkg.attr('class', 'branchLabelBkg label' + index)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('x', -bbox.width -4)
        .attr('y', -bbox.height / 2 +8 )
        .attr('width', bbox.width + 18)
        .attr('height', bbox.height + 4);

      label.attr('transform', 'translate(' + (-bbox.width -14) + ', ' + (pos - bbox.height/2-1) + ')');
      bkg.attr('transform', 'translate(' + -19 + ', ' + (pos - bbox.height/2) + ')');
      pos += 50;
    })
}

export const draw = function(txt, id, ver) {
  const config = getConfig().gitGraph;

  // try {
  const parser = gitGraphParser.parser;
  parser.yy = db;
  parser.yy.clear();

  logger.debug('in gitgraph renderer', txt + '\n', 'id:', id, ver);
  // // Parse the graph definition
  // parser.parse(txt + '\n');

  // config = Object.assign(config, apiConfig, db.getOptions());
  const direction = db.getDirection();
  allCommitsDict = db.getCommits();
  const branches = db.getBranchesAsObjArray();
  logger.debug('effective options', config, branches);

  const diagram = select(`[id="${id}"]`);
  svgCreateDefs(diagram);

  drawBranches(diagram, branches);

  const padding = config.diagramPadding;
  const svgBounds = diagram.node().getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;

  configureSvgSize(diagram, height, width, config.useMaxWidth);
  const vBox = `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`;
  logger.debug(`viewBox ${vBox}`);
  diagram.attr('viewBox', vBox);
};

export default {
  draw
};
