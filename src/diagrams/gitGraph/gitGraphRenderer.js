import _ from 'lodash'

import db from './gitGraphAst'
import gitGraphParser from './parser/gitGraph'
import d3 from '../../d3'
import { logger } from '../../logger'

let allCommitsDict = {}
let branchNum
let config = {
  nodeSpacing: 150,
  nodeFillColor: 'yellow',
  nodeStrokeWidth: 2,
  nodeStrokeColor: 'grey',
  lineStrokeWidth: 4,
  branchOffset: 50,
  lineColor: 'grey',
  leftMargin: 50,
  branchColors: ['#442f74', '#983351', '#609732', '#AA9A39'],
  nodeRadius: 10,
  nodeLabel: {
    width: 75,
    height: 100,
    x: -25,
    y: 0
  }
}
let apiConfig = {}
export const setConf = function (c) {
  apiConfig = c
}

function svgCreateDefs (svg) {
  svg
    .append('defs')
    .append('g')
    .attr('id', 'def-commit')
    .append('circle')
    .attr('r', config.nodeRadius)
    .attr('cx', 0)
    .attr('cy', 0)
  svg.select('#def-commit')
    .append('foreignObject')
    .attr('width', config.nodeLabel.width)
    .attr('height', config.nodeLabel.height)
    .attr('x', config.nodeLabel.x)
    .attr('y', config.nodeLabel.y)
    .attr('class', 'node-label')
    .attr('requiredFeatures', 'http://www.w3.org/TR/SVG11/feature#Extensibility')
    .append('xhtml:p')
    .html('')
}

function svgDrawLine (svg, points, colorIdx, interpolate) {
  interpolate = interpolate || 'basis'
  const color = config.branchColors[colorIdx % config.branchColors.length]
  const lineGen = d3.svg.line()
    .x(function (d) {
      return Math.round(d.x)
    })
    .y(function (d) {
      return Math.round(d.y)
    })
    .interpolate(interpolate)

  svg
    .append('svg:path')
    .attr('d', lineGen(points))
    .style('stroke', color)
    .style('stroke-width', config.lineStrokeWidth)
    .style('fill', 'none')
}
// Pass in the element and its pre-transform coords
function getElementCoords (element, coords) {
  coords = coords || element.node().getBBox()
  const ctm = element.node().getCTM()
  const xn = ctm.e + coords.x * ctm.a
  const yn = ctm.f + coords.y * ctm.d
  return {
    left: xn,
    top: yn,
    width: coords.width,
    height: coords.height
  }
}

function svgDrawLineForCommits (svg, fromId, toId, direction, color) {
  logger.debug('svgDrawLineForCommits: ', fromId, toId)
  const fromBbox = getElementCoords(svg.select('#node-' + fromId + ' circle'))
  const toBbox = getElementCoords(svg.select('#node-' + toId + ' circle'))
  switch (direction) {
    case 'LR':
      // (toBbox)
      //  +--------
      //          + (fromBbox)
      if (fromBbox.left - toBbox.left > config.nodeSpacing) {
        const lineStart = { x: fromBbox.left - config.nodeSpacing, y: toBbox.top + toBbox.height / 2 }
        const lineEnd = { x: toBbox.left + toBbox.width, y: toBbox.top + toBbox.height / 2 }
        svgDrawLine(svg, [lineStart, lineEnd], color, 'linear')
        svgDrawLine(svg, [
          { x: fromBbox.left, y: fromBbox.top + fromBbox.height / 2 },
          { x: fromBbox.left - config.nodeSpacing / 2, y: fromBbox.top + fromBbox.height / 2 },
          { x: fromBbox.left - config.nodeSpacing / 2, y: lineStart.y },
          lineStart], color)
      } else {
        svgDrawLine(svg, [{
          'x': fromBbox.left,
          'y': fromBbox.top + fromBbox.height / 2
        }, {
          'x': fromBbox.left - config.nodeSpacing / 2,
          'y': fromBbox.top + fromBbox.height / 2
        }, {
          'x': fromBbox.left - config.nodeSpacing / 2,
          'y': toBbox.top + toBbox.height / 2
        }, {
          'x': toBbox.left + toBbox.width,
          'y': toBbox.top + toBbox.height / 2
        }], color)
      }
      break
    case 'BT':
      //      +           (fromBbox)
      //      |
      //      |
      //              +   (toBbox)
      if (toBbox.top - fromBbox.top > config.nodeSpacing) {
        const lineStart = { x: toBbox.left + toBbox.width / 2, y: fromBbox.top + fromBbox.height + config.nodeSpacing }
        const lineEnd = { x: toBbox.left + toBbox.width / 2, y: toBbox.top }
        svgDrawLine(svg, [lineStart, lineEnd], color, 'linear')
        svgDrawLine(svg, [
          { x: fromBbox.left + fromBbox.width / 2, y: fromBbox.top + fromBbox.height },
          { x: fromBbox.left + fromBbox.width / 2, y: fromBbox.top + fromBbox.height + config.nodeSpacing / 2 },
          { x: toBbox.left + toBbox.width / 2, y: lineStart.y - config.nodeSpacing / 2 },
          lineStart], color)
      } else {
        svgDrawLine(svg, [{
          'x': fromBbox.left + fromBbox.width / 2,
          'y': fromBbox.top + fromBbox.height
        }, {
          'x': fromBbox.left + fromBbox.width / 2,
          'y': fromBbox.top + config.nodeSpacing / 2
        }, {
          'x': toBbox.left + toBbox.width / 2,
          'y': toBbox.top - config.nodeSpacing / 2
        }, {
          'x': toBbox.left + toBbox.width / 2,
          'y': toBbox.top
        }], color)
      }
      break
  }
}

function cloneNode (svg, selector) {
  return svg.select(selector).node().cloneNode(true)
}

function renderCommitHistory (svg, commitid, branches, direction) {
  let commit
  const numCommits = Object.keys(allCommitsDict).length
  if (_.isString(commitid)) {
    do {
      commit = allCommitsDict[commitid]
      logger.debug('in renderCommitHistory', commit.id, commit.seq)
      if (svg.select('#node-' + commitid).size() > 0) {
        return
      }
      svg
        .append(function () {
          return cloneNode(svg, '#def-commit')
        })
        .attr('class', 'commit')
        .attr('id', function () {
          return 'node-' + commit.id
        })
        .attr('transform', function () {
          switch (direction) {
            case 'LR':
              return 'translate(' + (commit.seq * config.nodeSpacing + config.leftMargin) + ', ' +
                (branchNum * config.branchOffset) + ')'
            case 'BT':
              return 'translate(' + (branchNum * config.branchOffset + config.leftMargin) + ', ' +
                ((numCommits - commit.seq) * config.nodeSpacing) + ')'
          }
        })
        .attr('fill', config.nodeFillColor)
        .attr('stroke', config.nodeStrokeColor)
        .attr('stroke-width', config.nodeStrokeWidth)

      const branch = _.find(branches, ['commit', commit])
      if (branch) {
        logger.debug('found branch ', branch.name)
        svg.select('#node-' + commit.id + ' p')
          .append('xhtml:span')
          .attr('class', 'branch-label')
          .text(branch.name + ', ')
      }
      svg.select('#node-' + commit.id + ' p')
        .append('xhtml:span')
        .attr('class', 'commit-id')
        .text(commit.id)
      if (commit.message !== '' && direction === 'BT') {
        svg.select('#node-' + commit.id + ' p')
          .append('xhtml:span')
          .attr('class', 'commit-msg')
          .text(', ' + commit.message)
      }
      commitid = commit.parent
    } while (commitid && allCommitsDict[commitid])
  }

  if (_.isArray(commitid)) {
    logger.debug('found merge commmit', commitid)
    renderCommitHistory(svg, commitid[0], branches, direction)
    branchNum++
    renderCommitHistory(svg, commitid[1], branches, direction)
    branchNum--
  }
}

function renderLines (svg, commit, direction, branchColor) {
  branchColor = branchColor || 0
  while (commit.seq > 0 && !commit.lineDrawn) {
    if (_.isString(commit.parent)) {
      svgDrawLineForCommits(svg, commit.id, commit.parent, direction, branchColor)
      commit.lineDrawn = true
      commit = allCommitsDict[commit.parent]
    } else if (_.isArray(commit.parent)) {
      svgDrawLineForCommits(svg, commit.id, commit.parent[0], direction, branchColor)
      svgDrawLineForCommits(svg, commit.id, commit.parent[1], direction, branchColor + 1)
      renderLines(svg, allCommitsDict[commit.parent[1]], direction, branchColor + 1)
      commit.lineDrawn = true
      commit = allCommitsDict[commit.parent[0]]
    }
  }
}

export const draw = function (txt, id, ver) {
  try {
    const parser = gitGraphParser.parser
    parser.yy = db

    logger.debug('in gitgraph renderer', txt, id, ver)
    // Parse the graph definition
    parser.parse(txt + '\n')

    config = _.extend(config, apiConfig, db.getOptions())
    logger.debug('effective options', config)
    const direction = db.getDirection()
    allCommitsDict = db.getCommits()
    const branches = db.getBranchesAsObjArray()
    if (direction === 'BT') {
      config.nodeLabel.x = branches.length * config.branchOffset
      config.nodeLabel.width = '100%'
      config.nodeLabel.y = -1 * 2 * config.nodeRadius
    }
    const svg = d3.select('#' + id)
    svgCreateDefs(svg)
    branchNum = 1
    _.each(branches, function (v) {
      renderCommitHistory(svg, v.commit.id, branches, direction)
      renderLines(svg, v.commit, direction)
      branchNum++
    })
    svg.attr('height', function () {
      if (direction === 'BT') return Object.keys(allCommitsDict).length * config.nodeSpacing
      return (branches.length + 1) * config.branchOffset
    })
  } catch (e) {
    logger.error('Error while rendering gitgraph')
    logger.error(e.message)
  }
}

export default {
  setConf,
  draw
}
