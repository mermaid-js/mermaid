
import dagre from 'dagre-layout'

import classDb from './classDb'
import d3 from '../../d3'
import { logger } from '../../logger'
import { parser } from './parser/classDiagram'

parser.yy = classDb

const idCache = {}

let classCnt = 0
const conf = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10
}

// Todo optimize
const getGraphId = function (label) {
  const keys = Object.keys(idCache)

  for (let i = 0; i < keys.length; i++) {
    if (idCache[keys[i]].label === label) {
      return keys[i]
    }
  }

  return undefined
}

/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
const insertMarkers = function (elem) {
  elem.append('defs').append('marker')
    .attr('id', 'extensionStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,7 L18,13 V 1 Z')

  elem.append('defs').append('marker')
    .attr('id', 'extensionEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,1 V 13 L18,7 Z') // this is actual shape for arrowhead

  elem.append('defs').append('marker')
    .attr('id', 'compositionStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z')

  elem.append('defs').append('marker')
    .attr('id', 'compositionEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z')

  elem.append('defs').append('marker')
    .attr('id', 'aggregationStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z')

  elem.append('defs').append('marker')
    .attr('id', 'aggregationEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z')

  elem.append('defs').append('marker')
    .attr('id', 'dependencyStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 5,7 L9,13 L1,7 L9,1 Z')

  elem.append('defs').append('marker')
    .attr('id', 'dependencyEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L14,7 L9,1 Z')
}

let edgeCount = 0
const drawEdge = function (elem, path, relation) {
  const getRelationType = function (type) {
    switch (type) {
      case classDb.relationType.AGGREGATION:
        return 'aggregation'
      case classDb.relationType.EXTENSION:
        return 'extension'
      case classDb.relationType.COMPOSITION:
        return 'composition'
      case classDb.relationType.DEPENDENCY:
        return 'dependency'
    }
  }

  // The data for our line
  const lineData = path.points

  // This is the accessor function we talked about above
  const lineFunction = d3.svg.line()
    .x(function (d) {
      return d.x
    })
    .y(function (d) {
      return d.y
    })
    .interpolate('basis')

  const svgPath = elem.append('path')
    .attr('d', lineFunction(lineData))
    .attr('id', 'edge' + edgeCount)
    .attr('class', 'relation')
  let url = ''
  if (conf.arrowMarkerAbsolute) {
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search
    url = url.replace(/\(/g, '\\(')
    url = url.replace(/\)/g, '\\)')
  }

  if (relation.relation.type1 !== 'none') {
    svgPath.attr('marker-start', 'url(' + url + '#' + getRelationType(relation.relation.type1) + 'Start' + ')')
  }
  if (relation.relation.type2 !== 'none') {
    svgPath.attr('marker-end', 'url(' + url + '#' + getRelationType(relation.relation.type2) + 'End' + ')')
  }

  let x, y
  const l = path.points.length
  if ((l % 2) !== 0) {
    const p1 = path.points[Math.floor(l / 2)]
    const p2 = path.points[Math.ceil(l / 2)]
    x = (p1.x + p2.x) / 2
    y = (p1.y + p2.y) / 2
  } else {
    const p = path.points[Math.floor(l / 2)]
    x = p.x
    y = p.y
  }

  if (typeof relation.title !== 'undefined') {
    const g = elem.append('g')
      .attr('class', 'classLabel')
    const label = g.append('text')
      .attr('class', 'label')
      .attr('x', x)
      .attr('y', y)
      .attr('fill', 'red')
      .attr('text-anchor', 'middle')
      .text(relation.title)

    window.label = label
    const bounds = label.node().getBBox()

    g.insert('rect', ':first-child')
      .attr('class', 'box')
      .attr('x', bounds.x - conf.padding / 2)
      .attr('y', bounds.y - conf.padding / 2)
      .attr('width', bounds.width + conf.padding)
      .attr('height', bounds.height + conf.padding)
  }

  edgeCount++
}

const drawClass = function (elem, classDef) {
  logger.info('Rendering class ' + classDef)

  const addTspan = function (textEl, txt, isFirst) {
    const tSpan = textEl.append('tspan')
      .attr('x', conf.padding)
      .text(txt)
    if (!isFirst) {
      tSpan.attr('dy', conf.textHeight)
    }
  }

  const id = 'classId' + classCnt
  const classInfo = {
    id: id,
    label: classDef.id,
    width: 0,
    height: 0
  }

  const g = elem.append('g')
    .attr('id', id)
    .attr('class', 'classGroup')
  const title = g.append('text')
    .attr('x', conf.padding)
    .attr('y', conf.textHeight + conf.padding)
    .text(classDef.id)

  const titleHeight = title.node().getBBox().height

  const membersLine = g.append('line')      // text label for the x axis
    .attr('x1', 0)
    .attr('y1', conf.padding + titleHeight + conf.dividerMargin / 2)
    .attr('y2', conf.padding + titleHeight + conf.dividerMargin / 2)

  const members = g.append('text')      // text label for the x axis
    .attr('x', conf.padding)
    .attr('y', titleHeight + (conf.dividerMargin) + conf.textHeight)
    .attr('fill', 'white')
    .attr('class', 'classText')

  let isFirst = true
  classDef.members.forEach(function (member) {
    addTspan(members, member, isFirst)
    isFirst = false
  })

  const membersBox = members.node().getBBox()

  const methodsLine = g.append('line')      // text label for the x axis
    .attr('x1', 0)
    .attr('y1', conf.padding + titleHeight + conf.dividerMargin + membersBox.height)
    .attr('y2', conf.padding + titleHeight + conf.dividerMargin + membersBox.height)

  const methods = g.append('text')      // text label for the x axis
    .attr('x', conf.padding)
    .attr('y', titleHeight + 2 * conf.dividerMargin + membersBox.height + conf.textHeight)
    .attr('fill', 'white')
    .attr('class', 'classText')

  isFirst = true

  classDef.methods.forEach(function (method) {
    addTspan(methods, method, isFirst)
    isFirst = false
  })

  const classBox = g.node().getBBox()
  g.insert('rect', ':first-child')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', classBox.width + 2 * conf.padding)
    .attr('height', classBox.height + conf.padding + 0.5 * conf.dividerMargin)

  membersLine.attr('x2', classBox.width + 2 * conf.padding)
  methodsLine.attr('x2', classBox.width + 2 * conf.padding)

  classInfo.width = classBox.width + 2 * conf.padding
  classInfo.height = classBox.height + conf.padding + 0.5 * conf.dividerMargin

  idCache[id] = classInfo
  classCnt++
  return classInfo
}

export const setConf = function (cnf) {
  const keys = Object.keys(cnf)

  keys.forEach(function (key) {
    conf[key] = cnf[key]
  })
}
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function (text, id) {
  parser.yy.clear()
  parser.parse(text)

  logger.info('Rendering diagram ' + text)

  /// / Fetch the default direction, use TD if none was found
  const diagram = d3.select('#' + id)
  insertMarkers(diagram)

  // Layout graph, Create a new directed graph
  const g = new dagre.graphlib.Graph({
    multigraph: true
  })

  // Set an object for the graph label
  g.setGraph({
    isMultiGraph: true
  })

  // Default to assigning a new object as a label for each new edge.
  g.setDefaultEdgeLabel(function () {
    return {}
  })

  const classes = classDb.getClasses()
  const keys = Object.keys(classes)
  for (let i = 0; i < keys.length; i++) {
    const classDef = classes[keys[i]]
    const node = drawClass(diagram, classDef)
    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    g.setNode(node.id, node)
    logger.info('Org height: ' + node.height)
  }

  const relations = classDb.getRelations()
  relations.forEach(function (relation) {
    logger.info('tjoho' + getGraphId(relation.id1) + getGraphId(relation.id2) + JSON.stringify(relation))
    g.setEdge(getGraphId(relation.id1), getGraphId(relation.id2), { relation: relation })
  })
  dagre.layout(g)
  g.nodes().forEach(function (v) {
    if (typeof v !== 'undefined') {
      logger.debug('Node ' + v + ': ' + JSON.stringify(g.node(v)))
      d3.select('#' + v).attr('transform', 'translate(' + (g.node(v).x - (g.node(v).width / 2)) + ',' + (g.node(v).y - (g.node(v).height / 2)) + ' )')
    }
  })
  g.edges().forEach(function (e) {
    logger.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)))
    drawEdge(diagram, g.edge(e), g.edge(e).relation)
  })

  diagram.attr('height', '100%')
  diagram.attr('width', '100%')
  diagram.attr('viewBox', '0 0 ' + (g.graph().width + 20) + ' ' + (g.graph().height + 20))
}

export default {
  setConf,
  draw
}
