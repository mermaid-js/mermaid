/**
 * ---
 * title: mermaidAPI
 * order: 5
 * ---
 * # mermaidAPI
 * This is the api to be used when handling the integration with the web page instead of using the default integration
 * (mermaid.js).
 *
 * The core of this api is the **render** function that given a graph definitionas text renders the graph/diagram and
 * returns a svg element for the graph. It is is then up to the user of the API to make use of the svg, either insert it
 * somewhere in the page or something completely different.
*/
import { logger, setLogLevel } from './logger'
import graph from './diagrams/flowchart/graphDb'
import utils from './utils'
import flowRenderer from './diagrams/flowchart/flowRenderer'
import seq from './diagrams/sequenceDiagram/sequenceRenderer'
import info from './diagrams/example/exampleRenderer'
import infoParser from './diagrams/example/parser/example'
import flowParser from './diagrams/flowchart/parser/flow'
import dotParser from './diagrams/flowchart/parser/dot'
import sequenceParser from './diagrams/sequenceDiagram/parser/sequenceDiagram'
import sequenceDb from './diagrams/sequenceDiagram/sequenceDb'
import infoDb from './diagrams/example/exampleDb'
import gantt from './diagrams/gantt/ganttRenderer'
import ganttParser from './diagrams/gantt/parser/gantt'
import ganttDb from './diagrams/gantt/ganttDb'
import classParser from './diagrams/classDiagram/parser/classDiagram'
import classRenderer from './diagrams/classDiagram/classRenderer'
import classDb from './diagrams/classDiagram/classDb'
import gitGraphParser from './diagrams/gitGraph/parser/gitGraph'
import gitGraphRenderer from './diagrams/gitGraph/gitGraphRenderer'
import gitGraphAst from './diagrams/gitGraph/gitGraphAst'
import d3 from './d3'
import pkg from '../package.json'

import darkTheme from './less/dark/mermaid.less'
import defaultTheme from './less/default/mermaid.less'
import forestTheme from './less/forest/mermaid.less'
import neutralTheme from './less/neutral/mermaid.less'

const themes = {
  dark: darkTheme,
  default: defaultTheme,
  forest: forestTheme,
  neutral: neutralTheme
}

/**
 * ## Configuration
 * These are the default options which can be overridden with the initialization call as in the example below:
 * ```
 * mermaid.initialize({
 *   flowchart:{
 *      htmlLabels: false
 *   }
 * });
 * ```
 */
const config = {
  theme: defaultTheme,

  /**
   * logLevel , decides the amount of logging to be used.
   *    * debug: 1
   *    * info: 2
   *    * warn: 3
   *    * error: 4
   *    * fatal: 5
   */
  logLevel: 5,

  /**
   * **startOnLoad** - This options controls whether or mermaid starts when the page loads
   */
  startOnLoad: true,

  /**
   * **arrowMarkerAbsolute** - This options controls whether or arrow markers in html code will be absolute paths or
   * an anchor, #. This matters if you are using base tag settings.
   */
  arrowMarkerAbsolute: false,

  /**
   * ### flowchart
   * *The object containing configurations specific for flowcharts*
   */
  flowchart: {
    /**
     * **htmlLabels** - Flag for setting whether or not a html tag should be used for rendering labels
     * on the edges
     */
    htmlLabels: true,
    /**
     * **useMaxWidth** - Flag for setting whether or not a all available width should be used for
     * the diagram.
     */
    useMaxWidth: true
  },

  /**
   * ###  sequenceDiagram
   * The object containing configurations specific for sequence diagrams
   */
  sequenceDiagram: {

    /**
     * **diagramMarginX** - margin to the right and left of the sequence diagram
     */
    diagramMarginX: 50,

    /**
     * **diagramMarginY** - margin to the over and under the sequence diagram
     */
    diagramMarginY: 10,

    /**
     * **actorMargin** - Margin between actors
     */
    actorMargin: 50,

    /**
     * **width** - Width of actor boxes
     */
    width: 150,

    /**
     * **height** - Height of actor boxes
     */
    height: 65,

    /**
     * **boxMargin** - Margin around loop boxes
     */
    boxMargin: 10,

    /**
     * **boxTextMargin** - margin around the text in loop/alt/opt boxes
     */
    boxTextMargin: 5,

    /**
     * **noteMargin** - margin around notes
     */
    noteMargin: 10,

    /**
     * **messageMargin** - Space between messages
     */
    messageMargin: 35,

    /**
     * **mirrorActors** - mirror actors under diagram
     */
    mirrorActors: true,

    /**
     * **bottomMarginAdj** - Depending on css styling this might need adjustment.
     * Prolongs the edge of the diagram downwards
     */
    bottomMarginAdj: 1,

    /**
     * **useMaxWidth** - when this flag is set the height and width is set to 100% and is then scaling with the
     * available space if not the absolute space required is used
     */
    useMaxWidth: true
  },

  /** ### gantt
   * The object containing configurations specific for gantt diagrams*
   */
  gantt: {
    /**
     * **titleTopMargin** - margin top for the text over the gantt diagram
     */
    titleTopMargin: 25,

    /**
     * **barHeight** - the height of the bars in the graph
     */
    barHeight: 20,

    /**
     * **barGap** - the margin between the different activities in the gantt diagram
     */
    barGap: 4,

    /**
     *  **topPadding** - margin between title and gantt diagram and between axis and gantt diagram.
     */
    topPadding: 50,

    /**
     *  **leftPadding** - the space allocated for the section name to the left of the activities.
     */
    leftPadding: 75,

    /**
     *  **gridLineStartPadding** - Vertical starting position of the grid lines
     */
    gridLineStartPadding: 35,

    /**
     *  **fontSize** - font size ...
     */
    fontSize: 11,

    /**
     * **fontFamily** - font family ...
     */
    fontFamily: '"Open-Sans", "sans-serif"',

    /**
     * **numberSectionStyles** - the number of alternating section styles
     */
    numberSectionStyles: 3,

    /**
     * **axisFormatter** - formatting of the axis, this might need adjustment to match your locale and preferences
     */
    axisFormatter: [
      // Within a day
      ['%I:%M', function (d) {
        return d.getHours()
      }],
      // Monday a week
      ['w. %U', function (d) {
        return d.getDay() === 1
      }],
      // Day within a week (not monday)
      ['%a %d', function (d) {
        return d.getDay() && d.getDate() !== 1
      }],
      // within a month
      ['%b %d', function (d) {
        return d.getDate() !== 1
      }],
      // Month
      ['%m-%y', function (d) {
        return d.getMonth()
      }]
    ]
  },
  classDiagram: {},
  gitGraph: {},
  info: {}
}

setLogLevel(config.logLevel)

function parse (text) {
  const graphType = utils.detectType(text)
  let parser

  switch (graphType) {
    case 'gitGraph':
      parser = gitGraphParser
      parser.parser.yy = gitGraphAst
      break
    case 'graph':
      parser = flowParser
      parser.parser.yy = graph
      break
    case 'dotGraph':
      parser = dotParser
      parser.parser.yy = graph
      break
    case 'sequenceDiagram':
      parser = sequenceParser
      parser.parser.yy = sequenceDb
      break
    case 'info':
      parser = infoParser
      parser.parser.yy = infoDb
      break
    case 'gantt':
      parser = ganttParser
      parser.parser.yy = ganttDb
      break
    case 'classDiagram':
      parser = classParser
      parser.parser.yy = classDb
      break
  }

  parser.parser.yy.parseError = (str, hash) => {
    const error = { str, hash }
    throw error
  }

  parser.parse(text)
}

/**
 * ## version
 * Function returning version information
 * @returns {string} A string containing the version info
 */
export const version = function () {
  return pkg.version
}

export const encodeEntities = function (text) {
  let txt = text

  txt = txt.replace(/style.*:\S*#.*;/g, function (s) {
    const innerTxt = s.substring(0, s.length - 1)
    return innerTxt
  })
  txt = txt.replace(/classDef.*:\S*#.*;/g, function (s) {
    const innerTxt = s.substring(0, s.length - 1)
    return innerTxt
  })

  txt = txt.replace(/#\w+;/g, function (s) {
    const innerTxt = s.substring(1, s.length - 1)

    const isInt = /^\+?\d+$/.test(innerTxt)
    if (isInt) {
      return 'ﬂ°°' + innerTxt + '¶ß'
    } else {
      return 'ﬂ°' + innerTxt + '¶ß'
    }
  })

  return txt
}

export const decodeEntities = function (text) {
  let txt = text

  txt = txt.replace(/ﬂ°°/g, function () {
    return '&#'
  })
  txt = txt.replace(/ﬂ°/g, function () {
    return '&'
  })
  txt = txt.replace(/¶ß/g, function () {
    return ';'
  })

  return txt
}
/**
 * ##render
 * Function that renders an svg with a graph from a chart definition. Usage example below.
 *
 * ```
 * mermaidAPI.initialize({
 *      startOnLoad:true
 *  });
 *  $(function(){
 *      const graphDefinition = 'graph TB\na-->b';
 *      const cb = function(svgGraph){
 *          console.log(svgGraph);
 *      };
 *      mermaidAPI.render('id1',graphDefinition,cb);
 *  });
 *```
 * @param id the id of the element to be rendered
 * @param txt the graph definition
 * @param cb callback which is called after rendering is finished with the svg code as inparam.
 * @param container selector to element in which a div with the graph temporarily will be inserted. In one is
 * provided a hidden div will be inserted in the body of the page instead. The element will be removed when rendering is
 * completed.
 */
const render = function (id, txt, cb, container) {
  if (typeof container !== 'undefined') {
    container.innerHTML = ''

    d3.select(container).append('div')
      .attr('id', 'd' + id)
      .append('svg')
      .attr('id', id)
      .attr('width', '100%')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .append('g')
  } else {
    const element = document.querySelector('#' + 'd' + id)
    if (element) {
      element.innerHTML = ''
    }

    d3.select('body').append('div')
      .attr('id', 'd' + id)
      .append('svg')
      .attr('id', id)
      .attr('width', '100%')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .append('g')
  }

  window.txt = txt
  txt = encodeEntities(txt)

  const element = d3.select('#d' + id).node()
  const graphType = utils.detectType(txt)
  switch (graphType) {
    case 'gitGraph':
      config.flowchart.arrowMarkerAbsolute = config.arrowMarkerAbsolute
      gitGraphRenderer.setConf(config.gitGraph)
      gitGraphRenderer.draw(txt, id, false)
      break
    case 'graph':
      config.flowchart.arrowMarkerAbsolute = config.arrowMarkerAbsolute
      flowRenderer.setConf(config.flowchart)
      flowRenderer.draw(txt, id, false)
      break
    case 'dotGraph':
      config.flowchart.arrowMarkerAbsolute = config.arrowMarkerAbsolute
      flowRenderer.setConf(config.flowchart)
      flowRenderer.draw(txt, id, true)
      break
    case 'sequenceDiagram':
      config.sequenceDiagram.arrowMarkerAbsolute = config.arrowMarkerAbsolute
      seq.setConf(config.sequenceDiagram)
      seq.draw(txt, id)
      break
    case 'gantt':
      config.gantt.arrowMarkerAbsolute = config.arrowMarkerAbsolute
      gantt.setConf(config.gantt)
      gantt.draw(txt, id)
      break
    case 'classDiagram':
      config.classDiagram.arrowMarkerAbsolute = config.arrowMarkerAbsolute
      classRenderer.setConf(config.classDiagram)
      classRenderer.draw(txt, id)
      break
    case 'info':
      config.info.arrowMarkerAbsolute = config.arrowMarkerAbsolute
      info.draw(txt, id, version())
      break
  }

  // insert inline style into svg
  const svg = element.firstChild
  const s = document.createElement('style')
  const cs = window.getComputedStyle(svg)
  s.innerHTML = `
  ${themes[config.theme] || defaultTheme}
svg {
  color: ${cs.color};
  font: ${cs.font};
}
  `
  svg.insertBefore(s, svg.firstChild)

  d3.select('#d' + id).selectAll('foreignobject div').attr('xmlns', 'http://www.w3.org/1999/xhtml')

  let url = ''
  if (config.arrowMarkerAbsolute) {
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search
    url = url.replace(/\(/g, '\\(')
    url = url.replace(/\)/g, '\\)')
  }

  // Fix for when the base tag is used
  let svgCode = d3.select('#d' + id).node().innerHTML.replace(/url\(#arrowhead/g, 'url(' + url + '#arrowhead', 'g')

  svgCode = decodeEntities(svgCode)

  if (typeof cb !== 'undefined') {
    cb(svgCode, graph.bindFunctions)
  } else {
    logger.warn('CB = undefined!')
  }

  const node = d3.select('#d' + id).node()
  if (node !== null && typeof node.remove === 'function') {
    d3.select('#d' + id).node().remove()
  }

  return svgCode
}

function render2 (id, text, cb, containerElement) {
  try {
    if (arguments.length === 1) {
      text = id
      id = 'mermaidId0'
    }

    if (typeof document === 'undefined') {
      // Todo handle rendering serverside using phantomjs
    } else {
      // In browser
      return render(id, text, cb, containerElement)
    }
  } catch (e) {
    logger.warn(e)
  }
}

const setConf = function (cnf) {
  // Top level initially mermaid, gflow, sequenceDiagram and gantt
  const lvl1Keys = Object.keys(cnf)
  for (let i = 0; i < lvl1Keys.length; i++) {
    if (typeof cnf[lvl1Keys[i]] === 'object') {
      const lvl2Keys = Object.keys(cnf[lvl1Keys[i]])

      for (let j = 0; j < lvl2Keys.length; j++) {
        logger.debug('Setting conf ', lvl1Keys[i], '-', lvl2Keys[j])
        if (typeof config[lvl1Keys[i]] === 'undefined') {
          config[lvl1Keys[i]] = {}
        }
        logger.debug('Setting config: ' + lvl1Keys[i] + ' ' + lvl2Keys[j] + ' to ' + cnf[lvl1Keys[i]][lvl2Keys[j]])
        config[lvl1Keys[i]][lvl2Keys[j]] = cnf[lvl1Keys[i]][lvl2Keys[j]]
      }
    } else {
      config[lvl1Keys[i]] = cnf[lvl1Keys[i]]
    }
  }
}

function initialize (options) {
  logger.debug('Initializing mermaidAPI')
  // Update default config with options supplied at initialization
  if (typeof options === 'object') {
    setConf(options)
  }
  setLogLevel(config.logLevel)
}

function getConfig () {
  return config
}

const mermaidAPI = {
  render: render2,
  parse,
  initialize,
  detectType: utils.detectType,
  getConfig
}

export default mermaidAPI
