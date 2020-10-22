import { curveBasis, line, select } from 'd3';
import { interpolateToCurve, getStylesFromArray, configureSvgSize } from '../../utils';
// import db from './gitGraphAst';
import * as db from './mockDb';
import gitGraphParser from './parser/gitGraph';
import { logger } from '../../logger';
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
