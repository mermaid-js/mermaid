import { logger } from '../../logger'
import utils from '../../utils'
import d3 from '../../d3'

let vertices = {}
let edges = []
let classes = []
let subGraphs = []
let tooltips = {}
let subCount = 0
let direction
// Functions to be run after graph rendering
let funs = []
/**
 * Function called by parser when a node definition has been found
 * @param id
 * @param text
 * @param type
 * @param style
 */
export const addVertex = function (id, text, type, style) {
  let txt

  if (typeof id === 'undefined') {
    return
  }
  if (id.trim().length === 0) {
    return
  }

  if (typeof vertices[id] === 'undefined') {
    vertices[id] = { id: id, styles: [], classes: [] }
  }
  if (typeof text !== 'undefined') {
    txt = text.trim()

    // strip quotes if string starts and exnds with a quote
    if (txt[0] === '"' && txt[txt.length - 1] === '"') {
      txt = txt.substring(1, txt.length - 1)
    }

    vertices[id].text = txt
  }
  if (typeof type !== 'undefined') {
    vertices[id].type = type
  }
  if (typeof type !== 'undefined') {
    vertices[id].type = type
  }
  if (typeof style !== 'undefined') {
    if (style !== null) {
      style.forEach(function (s) {
        vertices[id].styles.push(s)
      })
    }
  }
}

/**
 * Function called by parser when a link/edge definition has been found
 * @param start
 * @param end
 * @param type
 * @param linktext
 */
export const addLink = function (start, end, type, linktext) {
  logger.info('Got edge...', start, end)
  const edge = { start: start, end: end, type: undefined, text: '' }
  linktext = type.text

  if (typeof linktext !== 'undefined') {
    edge.text = linktext.trim()

    // strip quotes if string starts and exnds with a quote
    if (edge.text[0] === '"' && edge.text[edge.text.length - 1] === '"') {
      edge.text = edge.text.substring(1, edge.text.length - 1)
    }
  }

  if (typeof type !== 'undefined') {
    edge.type = type.type
    edge.stroke = type.stroke
  }
  edges.push(edge)
}

/**
 * Updates a link's line interpolation algorithm
 * @param pos
 * @param interpolate
 */
export const updateLinkInterpolate = function (pos, interp) {
  if (pos === 'default') {
    edges.defaultInterpolate = interp
  } else {
    edges[pos].interpolate = interp
  }
}

/**
 * Updates a link with a style
 * @param pos
 * @param style
 */
export const updateLink = function (pos, style) {
  if (pos === 'default') {
    edges.defaultStyle = style
  } else {
    if (utils.isSubstringInArray('fill', style) === -1) {
      style.push('fill:none')
    }
    edges[pos].style = style
  }
}

export const addClass = function (id, style) {
  if (typeof classes[id] === 'undefined') {
    classes[id] = { id: id, styles: [] }
  }

  if (typeof style !== 'undefined') {
    if (style !== null) {
      style.forEach(function (s) {
        classes[id].styles.push(s)
      })
    }
  }
}

/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 * @param dir
 */
export const setDirection = function (dir) {
  direction = dir
}

/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 * @param dir
 */
export const setClass = function (id, className) {
  if (id.indexOf(',') > 0) {
    id.split(',').forEach(function (id2) {
      if (typeof vertices[id2] !== 'undefined') {
        vertices[id2].classes.push(className)
      }
    })
  } else {
    if (typeof vertices[id] !== 'undefined') {
      vertices[id].classes.push(className)
    }
  }
}

const setTooltip = function (id, tooltip) {
  if (typeof tooltip !== 'undefined') {
    tooltips[id] = tooltip
  }
}

const setClickFun = function (id, functionName) {
  if (typeof functionName === 'undefined') {
    return
  }
  if (typeof vertices[id] !== 'undefined') {
    funs.push(function (element) {
      const elem = d3.select(element).select('#' + id)
      if (elem !== null) {
        elem.on('click', function () {
          window[functionName](id)
        })
      }
    })
  }
}

const setLink = function (id, linkStr) {
  if (typeof linkStr === 'undefined') {
    return
  }
  if (typeof vertices[id] !== 'undefined') {
    funs.push(function (element) {
      const elem = d3.select(element).select('#' + id)
      if (elem !== null) {
        elem.on('click', function () {
          window.open(linkStr, 'newTab')
        })
      }
    })
  }
}
export const getTooltip = function (id) {
  return tooltips[id]
}

/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 * @param dir
 */
export const setClickEvent = function (id, functionName, link, tooltip) {
  if (id.indexOf(',') > 0) {
    id.split(',').forEach(function (id2) {
      setTooltip(id2, tooltip)
      setClickFun(id2, functionName)
      setLink(id2, link)
      setClass(id, 'clickable')
    })
  } else {
    setTooltip(id, tooltip)
    setClickFun(id, functionName)
    setLink(id, link)
    setClass(id, 'clickable')
  }
}

export const bindFunctions = function (element) {
  funs.forEach(function (fun) {
    fun(element)
  })
}
export const getDirection = function () {
  return direction
}
/**
 * Retrieval function for fetching the found nodes after parsing has completed.
 * @returns {{}|*|vertices}
 */
export const getVertices = function () {
  return vertices
}

/**
 * Retrieval function for fetching the found links after parsing has completed.
 * @returns {{}|*|edges}
 */
export const getEdges = function () {
  return edges
}

/**
 * Retrieval function for fetching the found class definitions after parsing has completed.
 * @returns {{}|*|classes}
 */
export const getClasses = function () {
  return classes
}

const setupToolTips = function (element) {
  let tooltipElem = d3.select('.mermaidTooltip')
  if (tooltipElem[0][0] === null) {
    tooltipElem = d3.select('body')
      .append('div')
      .attr('class', 'mermaidTooltip')
      .style('opacity', 0)
  }

  const svg = d3.select(element).select('svg')

  const nodes = svg.selectAll('g.node')
  nodes
    .on('mouseover', function () {
      const el = d3.select(this)
      const title = el.attr('title')
      // Dont try to draw a tooltip if no data is provided
      if (title === null) {
        return
      }
      const rect = this.getBoundingClientRect()

      tooltipElem.transition()
        .duration(200)
        .style('opacity', '.9')
      tooltipElem.html(el.attr('title'))
        .style('left', (rect.left + (rect.right - rect.left) / 2) + 'px')
        .style('top', (rect.top - 14 + document.body.scrollTop) + 'px')
      el.classed('hover', true)
    })
    .on('mouseout', function () {
      tooltipElem.transition()
        .duration(500)
        .style('opacity', 0)
      const el = d3.select(this)
      el.classed('hover', false)
    })
}
funs.push(setupToolTips)

/**
 * Clears the internal graph db so that a new graph can be parsed.
 */
export const clear = function () {
  vertices = {}
  classes = {}
  edges = []
  funs = []
  funs.push(setupToolTips)
  subGraphs = []
  subCount = 0
  tooltips = []
}
/**
 *
 * @returns {string}
 */
export const defaultStyle = function () {
  return 'fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;'
}

/**
 * Clears the internal graph db so that a new graph can be parsed.
 */
export const addSubGraph = function (list, title) {
  function uniq (a) {
    const prims = { 'boolean': {}, 'number': {}, 'string': {} }
    const objs = []

    return a.filter(function (item) {
      const type = typeof item
      if (item === ' ') {
        return false
      }
      if (type in prims) { return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true) } else { return objs.indexOf(item) >= 0 ? false : objs.push(item) }
    })
  }

  let nodeList = []

  nodeList = uniq(nodeList.concat.apply(nodeList, list))

  const subGraph = { id: 'subGraph' + subCount, nodes: nodeList, title: title }
  subGraphs.push(subGraph)
  subCount = subCount + 1
  return subGraph.id
}

const getPosForId = function (id) {
  for (let i = 0; i < subGraphs.length; i++) {
    if (subGraphs[i].id === id) {
      return i
    }
  }
  return -1
}
let secCount = -1
const posCrossRef = []
const indexNodes2 = function (id, pos) {
  const nodes = subGraphs[pos].nodes
  secCount = secCount + 1
  if (secCount > 2000) {
    return
  }
  posCrossRef[secCount] = pos
  // Check if match
  if (subGraphs[pos].id === id) {
    return {
      result: true,
      count: 0
    }
  }

  let count = 0
  let posCount = 1
  while (count < nodes.length) {
    const childPos = getPosForId(nodes[count])
    // Ignore regular nodes (pos will be -1)
    if (childPos >= 0) {
      const res = indexNodes2(id, childPos)
      if (res.result) {
        return {
          result: true,
          count: posCount + res.count
        }
      } else {
        posCount = posCount + res.count
      }
    }
    count = count + 1
  }

  return {
    result: false,
    count: posCount
  }
}

export const getDepthFirstPos = function (pos) {
  return posCrossRef[pos]
}
export const indexNodes = function () {
  secCount = -1
  if (subGraphs.length > 0) {
    indexNodes2('none', subGraphs.length - 1, 0)
  }
}

export const getSubGraphs = function () {
  return subGraphs
}

export default {
  addVertex,
  addLink,
  updateLinkInterpolate,
  updateLink,
  addClass,
  setDirection,
  setClass,
  getTooltip,
  setClickEvent,
  bindFunctions,
  getDirection,
  getVertices,
  getEdges,
  getClasses,
  clear,
  defaultStyle,
  addSubGraph,
  getDepthFirstPos,
  indexNodes,
  getSubGraphs
}
