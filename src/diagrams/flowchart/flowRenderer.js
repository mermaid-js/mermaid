import graphDb from './graphDb'
import flow from './parser/flow'
import dot from './parser/dot'
import d3 from '../../d3'
import dagreD3 from 'dagre-d3-renderer'
import { logger } from '../../logger'

const conf = {
}
export const setConf = function (cnf) {
  const keys = Object.keys(cnf)
  for (let i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]]
  }
}

/**
 * Function that adds the vertices found in the graph definition to the graph to be rendered.
 * @param vert Object containing the vertices.
 * @param g The graph that is to be drawn.
 */
export const addVertices = function (vert, g) {
  const keys = Object.keys(vert)

  const styleFromStyleArr = function (styleStr, arr) {
    // Create a compound style definition from the style definitions found for the node in the graph definition
    for (let i = 0; i < arr.length; i++) {
      if (typeof arr[i] !== 'undefined') {
        styleStr = styleStr + arr[i] + ';'
      }
    }

    return styleStr
  }

  // Iterate through each item in the vertice object (containing all the vertices found) in the graph definition
  keys.forEach(function (id) {
    const vertice = vert[id]
    let verticeText

    /**
     * Variable for storing the classes for the vertice
     * @type {string}
     */
    let classStr = ''
    if (vertice.classes.length > 0) {
      classStr = vertice.classes.join(' ')
    }

    /**
     * Variable for storing the extracted style for the vertice
     * @type {string}
     */
    let style = ''
    // Create a compound style definition from the style definitions found for the node in the graph definition
    style = styleFromStyleArr(style, vertice.styles)

    // Use vertice id as text in the box if no text is provided by the graph definition
    if (typeof vertice.text === 'undefined') {
      verticeText = vertice.id
    } else {
      verticeText = vertice.text
    }

    let labelTypeStr = ''
    if (conf.htmlLabels) {
      labelTypeStr = 'html'
      verticeText = verticeText.replace(/fa:fa[\w-]+/g, function (s) {
        return '<i class="fa ' + s.substring(3) + '"></i>'
      })
    } else {
      const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')

      const rows = verticeText.split(/<br>/)

      for (let j = 0; j < rows.length; j++) {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
        tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve')
        tspan.setAttribute('dy', '1em')
        tspan.setAttribute('x', '1')
        tspan.textContent = rows[j]
        svgLabel.appendChild(tspan)
      }

      labelTypeStr = 'svg'
      verticeText = svgLabel
    }

    let radious = 0
    let _shape = ''
    // Set the shape based parameters
    switch (vertice.type) {
      case 'round':
        radious = 5
        _shape = 'rect'
        break
      case 'square':
        _shape = 'rect'
        break
      case 'diamond':
        _shape = 'question'
        break
      case 'odd':
        _shape = 'rect_left_inv_arrow'
        break
      case 'odd_right':
        _shape = 'rect_left_inv_arrow'
        break
      case 'circle':
        _shape = 'circle'
        break
      case 'ellipse':
        _shape = 'ellipse'
        break
      case 'group':
        _shape = 'rect'
        // Need to create a text node if using svg labels, see #367
        verticeText = conf.htmlLabels ? '' : document.createElementNS('http://www.w3.org/2000/svg', 'text')
        break
      default:
        _shape = 'rect'
    }
    // Add the node
    g.setNode(vertice.id, { labelType: labelTypeStr, shape: _shape, label: verticeText, rx: radious, ry: radious, 'class': classStr, style: style, id: vertice.id })
  })
}

/**
 * Add edges to graph based on parsed graph defninition
 * @param {Object} edges The edges to add to the graph
 * @param {Object} g The graph object
 */
export const addEdges = function (edges, g) {
  let cnt = 0

  let defaultStyle
  if (typeof edges.defaultStyle !== 'undefined') {
    defaultStyle = edges.defaultStyle.toString().replace(/,/g, ';')
  }

  edges.forEach(function (edge) {
    cnt++
    const edgeData = {}

    // Set link type for rendering
    if (edge.type === 'arrow_open') {
      edgeData.arrowhead = 'none'
    } else {
      edgeData.arrowhead = 'normal'
    }

    let style = ''
    if (typeof edge.style !== 'undefined') {
      edge.style.forEach(function (s) {
        style = style + s + ';'
      })
    } else {
      switch (edge.stroke) {
        case 'normal':
          style = 'fill:none'
          if (typeof defaultStyle !== 'undefined') {
            style = defaultStyle
          }
          break
        case 'dotted':
          style = 'stroke: #333; fill:none;stroke-width:2px;stroke-dasharray:3;'
          break
        case 'thick':
          style = 'stroke: #333; stroke-width: 3.5px;fill:none'
          break
      }
    }
    edgeData.style = style

    if (typeof edge.interpolate !== 'undefined') {
      edgeData.lineInterpolate = edge.interpolate
    } else {
      if (typeof edges.defaultInterpolate !== 'undefined') {
        edgeData.lineInterpolate = edges.defaultInterpolate
      }
    }

    if (typeof edge.text === 'undefined') {
      if (typeof edge.style !== 'undefined') {
        edgeData.arrowheadStyle = 'fill: #333'
      }
    } else {
      edgeData.arrowheadStyle = 'fill: #333'
      if (typeof edge.style === 'undefined') {
        edgeData.labelpos = 'c'
        if (conf.htmlLabels) {
          edgeData.labelType = 'html'
          edgeData.label = '<span class="edgeLabel">' + edge.text + '</span>'
        } else {
          edgeData.labelType = 'text'
          edgeData.style = 'stroke: #333; stroke-width: 1.5px;fill:none'
          edgeData.label = edge.text.replace(/<br>/g, '\n')
        }
      } else {
        edgeData.label = edge.text.replace(/<br>/g, '\n')
      }
    }
    // Add the edge to the graph
    g.setEdge(edge.start, edge.end, edgeData, cnt)
  })
}

/**
 * Returns the all the styles from classDef statements in the graph definition.
 * @returns {object} classDef styles
 */
export const getClasses = function (text, isDot) {
  let parser
  graphDb.clear()
  if (isDot) {
    parser = dot.parser
  } else {
    parser = flow.parser
  }
  parser.yy = graphDb

  // Parse the graph definition
  parser.parse(text)

  const classes = graphDb.getClasses()

  // Add default class if undefined
  if (typeof (classes.default) === 'undefined') {
    classes.default = { id: 'default' }
    classes.default.styles = []
    classes.default.clusterStyles = ['rx:4px', 'fill: rgb(255, 255, 222)', 'rx: 4px', 'stroke: rgb(170, 170, 51)', 'stroke-width: 1px']
    classes.default.nodeLabelStyles = ['fill:#000', 'stroke:none', 'font-weight:300', 'font-family:"Helvetica Neue",Helvetica,Arial,sans-serf', 'font-size:14px']
    classes.default.edgeLabelStyles = ['fill:#000', 'stroke:none', 'font-weight:300', 'font-family:"Helvetica Neue",Helvetica,Arial,sans-serf', 'font-size:14px']
  }
  return classes
}

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function (text, id, isDot) {
  logger.debug('Drawing flowchart')
  let parser
  graphDb.clear()
  if (isDot) {
    parser = dot.parser
  } else {
    parser = flow.parser
  }
  parser.yy = graphDb

  // Parse the graph definition
  try {
    parser.parse(text)
  } catch (err) {
    logger.debug('Parsing failed')
  }

  // Fetch the default direction, use TD if none was found
  let dir = graphDb.getDirection()
  if (typeof dir === 'undefined') {
    dir = 'TD'
  }

  // Create the input mermaid.graph
  const g = new dagreD3.graphlib.Graph({
    multigraph: true,
    compound: true
  })
    .setGraph({
      rankdir: dir,
      marginx: 20,
      marginy: 20

    })
    .setDefaultEdgeLabel(function () {
      return {}
    })

  let subG
  const subGraphs = graphDb.getSubGraphs()
  for (let i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i]
    graphDb.addVertex(subG.id, subG.title, 'group', undefined)
  }

  // Fetch the verices/nodes and edges/links from the parsed graph definition
  const vert = graphDb.getVertices()

  const edges = graphDb.getEdges()

  let i = 0
  for (i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i]

    d3.selectAll('cluster').append('text')

    for (let j = 0; j < subG.nodes.length; j++) {
      g.setParent(subG.nodes[j], subG.id)
    }
  }
  addVertices(vert, g)
  addEdges(edges, g)

  // Create the renderer
  const Render = dagreD3.render
  const render = new Render()

  // Add custom shape for rhombus type of boc (decision)
  render.shapes().question = function (parent, bbox, node) {
    const w = bbox.width
    const h = bbox.height
    const s = (w + h) * 0.8
    const points = [
      { x: s / 2, y: 0 },
      { x: s, y: -s / 2 },
      { x: s / 2, y: -s },
      { x: 0, y: -s / 2 }
    ]
    const shapeSvg = parent.insert('polygon', ':first-child')
      .attr('points', points.map(function (d) {
        return d.x + ',' + d.y
      }).join(' '))
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('transform', 'translate(' + (-s / 2) + ',' + (s * 2 / 4) + ')')
    node.intersect = function (point) {
      return dagreD3.intersect.polygon(node, points, point)
    }
    return shapeSvg
  }

  // Add custom shape for box with inverted arrow on left side
  render.shapes().rect_left_inv_arrow = function (parent, bbox, node) {
    const w = bbox.width
    const h = bbox.height
    const points = [
      { x: -h / 2, y: 0 },
      { x: w, y: 0 },
      { x: w, y: -h },
      { x: -h / 2, y: -h },
      { x: 0, y: -h / 2 }
    ]
    const shapeSvg = parent.insert('polygon', ':first-child')
      .attr('points', points.map(function (d) {
        return d.x + ',' + d.y
      }).join(' '))
      .attr('transform', 'translate(' + (-w / 2) + ',' + (h * 2 / 4) + ')')
    node.intersect = function (point) {
      return dagreD3.intersect.polygon(node, points, point)
    }
    return shapeSvg
  }

  // Add custom shape for box with inverted arrow on right side
  render.shapes().rect_right_inv_arrow = function (parent, bbox, node) {
    const w = bbox.width
    const h = bbox.height
    const points = [
      { x: 0, y: 0 },
      { x: w + h / 2, y: 0 },
      { x: w, y: -h / 2 },
      { x: w + h / 2, y: -h },
      { x: 0, y: -h }
    ]
    const shapeSvg = parent.insert('polygon', ':first-child')
      .attr('points', points.map(function (d) {
        return d.x + ',' + d.y
      }).join(' '))
      .attr('transform', 'translate(' + (-w / 2) + ',' + (h * 2 / 4) + ')')
    node.intersect = function (point) {
      return dagreD3.intersect.polygon(node, points, point)
    }
    return shapeSvg
  }

  // Add our custom arrow - an empty arrowhead
  render.arrows().none = function normal (parent, id, edge, type) {
    const marker = parent.append('marker')
      .attr('id', id)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', 8)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')

    const path = marker.append('path')
      .attr('d', 'M 0 0 L 0 0 L 0 0 z')
    dagreD3.util.applyStyle(path, edge[type + 'Style'])
  }

  // Override normal arrowhead defined in d3. Remove style & add class to allow css styling.
  render.arrows().normal = function normal (parent, id, edge, type) {
    const marker = parent.append('marker')
      .attr('id', id)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', 8)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')

    marker.append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('class', 'arrowheadPath')
      .style('stroke-width', 1)
      .style('stroke-dasharray', '1,0')
  }

  // Set up an SVG group so that we can translate the final graph.
  const svg = d3.select('#' + id)

  // Run the renderer. This is what draws the final graph.
  const element = d3.select('#' + id + ' g')
  render(element, g)

  element.selectAll('g.node')
    .attr('title', function () {
      return graphDb.getTooltip(this.id)
    })

  if (conf.useMaxWidth) {
    // Center the graph
    svg.attr('height', '100%')
    svg.attr('width', conf.width)
    svg.attr('viewBox', '0 0 ' + (g.graph().width + 20) + ' ' + (g.graph().height + 20))
    svg.attr('style', 'max-width:' + (g.graph().width + 20) + 'px;')
  } else {
    // Center the graph
    svg.attr('height', g.graph().height)
    if (typeof conf.width === 'undefined') {
      svg.attr('width', g.graph().width)
    } else {
      svg.attr('width', conf.width)
    }
    svg.attr('viewBox', '0 0 ' + (g.graph().width + 20) + ' ' + (g.graph().height + 20))
  }

  // Index nodes
  graphDb.indexNodes('subGraph' + i)

  for (i = 0; i < subGraphs.length; i++) {
    subG = subGraphs[i]

    if (subG.title !== 'undefined') {
      const clusterRects = document.querySelectorAll('#' + id + ' #' + subG.id + ' rect')
      const clusterEl = document.querySelectorAll('#' + id + ' #' + subG.id)

      const xPos = clusterRects[0].x.baseVal.value
      const yPos = clusterRects[0].y.baseVal.value
      const width = clusterRects[0].width.baseVal.value
      const cluster = d3.select(clusterEl[0])
      const te = cluster.append('text')
      te.attr('x', xPos + width / 2)
      te.attr('y', yPos + 14)
      te.attr('fill', 'black')
      te.attr('stroke', 'none')
      te.attr('id', id + 'Text')
      te.style('text-anchor', 'middle')

      if (typeof subG.title === 'undefined') {
        te.text('Undef')
      } else {
        te.text(subG.title)
      }
    }
  }

  // Add label rects for non html labels
  if (!conf.htmlLabels) {
    const labels = document.querySelectorAll('#' + id + ' .edgeLabel .label')
    for (let k = 0; k < labels.length; k++) {
      const label = labels[i]

      // Get dimensions of label
      const dim = label.getBBox()

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('rx', 0)
      rect.setAttribute('ry', 0)
      rect.setAttribute('width', dim.width)
      rect.setAttribute('height', dim.height)
      rect.setAttribute('style', 'fill:#e8e8e8;')

      label.insertBefore(rect, label.firstChild)
    }
  }
}

export default {
  setConf,
  addVertices,
  addEdges,
  getClasses,
  draw
}
