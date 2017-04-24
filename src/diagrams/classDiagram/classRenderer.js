/**
 * Created by knut on 14-11-23.
 */

var cd = require('./parser/classDiagram').parser
var cDDb = require('./classDb')
cd.yy = cDDb
var d3 = require('../../d3')
var Logger = require('../../logger')
var log = Logger.Log
var dagre = require('dagre')

var idCache
idCache = {}

var classCnt = 0
var conf = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10
}

// Todo optimize
var getGraphId = function (label) {
  var keys = Object.keys(idCache)

  var i
  for (i = 0; i < keys.length; i++) {
    if (idCache[keys[i]].label === label) {
      return keys[i]
    }
  }

  return undefined
}

/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
var insertMarkers = function (elem) {
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

var edgeCount = 0
var drawEdge = function (elem, path, relation) {
  var getRelationType = function (type) {
    switch (type) {
      case cDDb.relationType.AGGREGATION:
        return 'aggregation'
      case cDDb.relationType.EXTENSION:
        return 'extension'
      case cDDb.relationType.COMPOSITION:
        return 'composition'
      case cDDb.relationType.DEPENDENCY:
        return 'dependency'
    }
  }

  // The data for our line
  var lineData = path.points

  // This is the accessor function we talked about above
  var lineFunction = d3.svg.line()
    .x(function (d) {
      return d.x
    })
    .y(function (d) {
      return d.y
    })
    .interpolate('basis')

  var svgPath = elem.append('path')
    .attr('d', lineFunction(lineData))
    .attr('id', 'edge' + edgeCount)
    .attr('class', 'relation')
  var url = ''
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

  var x, y
  var l = path.points.length
  if ((l % 2) !== 0) {
    var p1 = path.points[Math.floor(l / 2)]
    var p2 = path.points[Math.ceil(l / 2)]
    x = (p1.x + p2.x) / 2
    y = (p1.y + p2.y) / 2
  } else {
    var p = path.points[Math.floor(l / 2)]
    x = p.x
    y = p.y
  }

  if (typeof relation.title !== 'undefined') {
    var g = elem.append('g')
      .attr('class', 'classLabel')
    var label = g.append('text')
      .attr('class', 'label')
      .attr('x', x)
      .attr('y', y)
      .attr('fill', 'red')
      .attr('text-anchor', 'middle')
      .text(relation.title)

    window.label = label
    var bounds = label.node().getBBox()

    g.insert('rect', ':first-child')
      .attr('class', 'box')
      .attr('x', bounds.x - conf.padding / 2)
      .attr('y', bounds.y - conf.padding / 2)
      .attr('width', bounds.width + conf.padding)
      .attr('height', bounds.height + conf.padding)
  }

  edgeCount++
}

var drawClass = function (elem, classDef) {
  log.info('Rendering class ' + classDef)

  var addTspan = function (textEl, txt, isFirst) {
    var tSpan = textEl.append('tspan')
      .attr('x', conf.padding)
      .text(txt)
    if (!isFirst) {
      tSpan.attr('dy', conf.textHeight)
    }
  }

  var id = 'classId' + classCnt
  var classInfo = {
    id: id,
    label: classDef.id,
    width: 0,
    height: 0
  }

  var g = elem.append('g')
    .attr('id', id)
    .attr('class', 'classGroup')
  var title = g.append('text')
    .attr('x', conf.padding)
    .attr('y', conf.textHeight + conf.padding)
    .text(classDef.id)

  var titleHeight = title.node().getBBox().height

  var membersLine = g.append('line')      // text label for the x axis
    .attr('x1', 0)
    .attr('y1', conf.padding + titleHeight + conf.dividerMargin / 2)
    .attr('y2', conf.padding + titleHeight + conf.dividerMargin / 2)

  var members = g.append('text')      // text label for the x axis
    .attr('x', conf.padding)
    .attr('y', titleHeight + (conf.dividerMargin) + conf.textHeight)
    .attr('fill', 'white')
    .attr('class', 'classText')

  var isFirst = true

  classDef.members.forEach(function (member) {
    addTspan(members, member, isFirst)
    isFirst = false
  })

  var membersBox = members.node().getBBox()

  var methodsLine = g.append('line')      // text label for the x axis
    .attr('x1', 0)
    .attr('y1', conf.padding + titleHeight + conf.dividerMargin + membersBox.height)
    .attr('y2', conf.padding + titleHeight + conf.dividerMargin + membersBox.height)

  var methods = g.append('text')      // text label for the x axis
    .attr('x', conf.padding)
    .attr('y', titleHeight + 2 * conf.dividerMargin + membersBox.height + conf.textHeight)
    .attr('fill', 'white')
    .attr('class', 'classText')

  isFirst = true

  classDef.methods.forEach(function (method) {
    addTspan(methods, method, isFirst)
    isFirst = false
  })

  var classBox = g.node().getBBox()
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

module.exports.setConf = function (cnf) {
  var keys = Object.keys(cnf)

  keys.forEach(function (key) {
    conf[key] = cnf[key]
  })
}
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
module.exports.draw = function (text, id) {
  cd.yy.clear()
  cd.parse(text)

  log.info('Rendering diagram ' + text)

  /// / Fetch the default direction, use TD if none was found
  var diagram = d3.select('#' + id)
  insertMarkers(diagram)

  // Layout graph, Create a new directed graph
  var g = new dagre.graphlib.Graph({
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

  var classes = cDDb.getClasses()
  var keys = Object.keys(classes)
  var i
  for (i = 0; i < keys.length; i++) {
    var classDef = classes[keys[i]]
    var node = drawClass(diagram, classDef)
    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    g.setNode(node.id, node)
    log.info('Org height: ' + node.height)
  }

  var relations = cDDb.getRelations()
  relations.forEach(function (relation) {
    log.info('tjoho' + getGraphId(relation.id1) + getGraphId(relation.id2) + JSON.stringify(relation))
    g.setEdge(getGraphId(relation.id1), getGraphId(relation.id2), { relation: relation })
  })
  dagre.layout(g)
  g.nodes().forEach(function (v) {
    if (typeof v !== 'undefined') {
      log.debug('Node ' + v + ': ' + JSON.stringify(g.node(v)))
      d3.select('#' + v).attr('transform', 'translate(' + (g.node(v).x - (g.node(v).width / 2)) + ',' + (g.node(v).y - (g.node(v).height / 2)) + ' )')
    }
  })
  g.edges().forEach(function (e) {
    log.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)))
    drawEdge(diagram, g.edge(e), g.edge(e).relation)
  })

  diagram.attr('height', '100%')
  diagram.attr('width', '100%')
  diagram.attr('viewBox', '0 0 ' + (g.graph().width + 20) + ' ' + (g.graph().height + 20))
}
