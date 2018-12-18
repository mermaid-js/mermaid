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
import * as d3 from 'd3'
import scope from 'scope-css'

import { logger, setLogLevel } from './logger'
import utils from './utils'
import flowRenderer from './diagrams/flowchart/flowRenderer'
import flowParser from './diagrams/flowchart/parser/flow'
import flowDb from './diagrams/flowchart/flowDb'
import sequenceRenderer from './diagrams/sequence/sequenceRenderer'
import sequenceParser from './diagrams/sequence/parser/sequenceDiagram'
import sequenceDb from './diagrams/sequence/sequenceDb'
import ganttRenderer from './diagrams/gantt/ganttRenderer'
import ganttParser from './diagrams/gantt/parser/gantt'
import ganttDb from './diagrams/gantt/ganttDb'
import classRenderer from './diagrams/class/classRenderer'
import classParser from './diagrams/class/parser/classDiagram'
import classDb from './diagrams/class/classDb'
import gitGraphRenderer from './diagrams/git/gitGraphRenderer'
import gitGraphParser from './diagrams/git/parser/gitGraph'
import gitGraphAst from './diagrams/git/gitGraphAst'

const themes = {}
for (const themeName of ['default', 'forest', 'dark', 'neutral']) {
  themes[themeName] = require(`./themes/${themeName}/index.scss`)
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

  /** theme , the CSS style sheet
  *
  * **theme** - Choose one of the built-in themes: default, forest, dark or neutral. To disable any pre-defined mermaid theme, use "null".
  * **themeCSS** - Use your own CSS. This overrides **theme**.
  *```
  * "theme": "forest",
  * "themeCSS": ".node rect { fill: red; }"
  *```
  */

  theme: 'default',
  themeCSS: undefined,

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

    curve: 'linear'
  },

  /**
   * ###  sequenceDiagram
   * The object containing configurations specific for sequence diagrams
   */
  sequence: {

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
    useMaxWidth: true,

    /**
     * **rightAngles** - this will display arrows that start and begin at the same node as right angles, rather than a curve
     */
    rightAngles: false
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
    numberSectionStyles: 4,

    /**
     * **axisFormat** - datetime format of the axis, this might need adjustment to match your locale and preferences
     */
    axisFormat: '%Y-%m-%d'
  },
  class: {},
  git: {}
}

setLogLevel(config.logLevel)

function parse (text) {
  const graphType = utils.detectType(text)
  let parser

  switch (graphType) {
    case 'git':
      parser = gitGraphParser
      parser.parser.yy = gitGraphAst
      break
    case 'flowchart':
      parser = flowParser
      parser.parser.yy = flowDb
      break
    case 'sequence':
      parser = sequenceParser
      parser.parser.yy = sequenceDb
      break
    case 'gantt':
      parser = ganttParser
      parser.parser.yy = ganttDb
      break
    case 'class':
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

  // insert inline style into svg
  const svg = element.firstChild
  const firstChild = svg.firstChild

  // pre-defined theme
  let style = themes[config.theme]
  if (style === undefined) {
    style = ''
  }

  // user provided theme CSS
  if (config.themeCSS !== undefined) {
    style += `\n${config.themeCSS}`
  }

  // classDef
  if (graphType === 'flowchart') {
    const classes = flowRenderer.getClasses(txt)
    for (const className in classes) {
      style += `\n.${className} > * { ${classes[className].styles.join(' !important; ')} !important; }`
    }
  }

  const style1 = document.createElement('style')
  style1.innerHTML = scope(style, `#${id}`)
  svg.insertBefore(style1, firstChild)

  const style2 = document.createElement('style')
  const cs = window.getComputedStyle(svg)
  style2.innerHTML = `#${id} {
    color: ${cs.color};
    font: ${cs.font};
  }`
  svg.insertBefore(style2, firstChild)

  switch (graphType) {
    case 'git':
      config.flowchart.arrowMarkerAbsolute = config.arrowMarkerAbsolute
      gitGraphRenderer.setConf(config.git)
      gitGraphRenderer.draw(txt, id, false)
      break
    case 'flowchart':
      config.flowchart.arrowMarkerAbsolute = config.arrowMarkerAbsolute
      flowRenderer.setConf(config.flowchart)
      flowRenderer.draw(txt, id, false)
      break
    case 'sequence':
      config.sequence.arrowMarkerAbsolute = config.arrowMarkerAbsolute
      if (config.sequenceDiagram) { // backwards compatibility
        sequenceRenderer.setConf(Object.assign(config.sequence, config.sequenceDiagram))
        console.error('`mermaid config.sequenceDiagram` has been renamed to `config.sequence`. Please update your mermaid config.')
      } else {
        sequenceRenderer.setConf(config.sequence)
      }
      sequenceRenderer.draw(txt, id)
      break
    case 'gantt':
      config.gantt.arrowMarkerAbsolute = config.arrowMarkerAbsolute
      ganttRenderer.setConf(config.gantt)
      ganttRenderer.draw(txt, id)
      break
    case 'class':
      config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute
      classRenderer.setConf(config.class)
      classRenderer.draw(txt, id)
      break
  }

  d3.select(`[id="${id}"]`).selectAll('foreignobject > *').attr('xmlns', 'http://www.w3.org/1999/xhtml')

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
    cb(svgCode, flowDb.bindFunctions)
  } else {
    logger.warn('CB = undefined!')
  }

  const node = d3.select('#d' + id).node()
  if (node !== null && typeof node.remove === 'function') {
    d3.select('#d' + id).node().remove()
  }

  return svgCode
}

const setConf = function (cnf) {
  // Top level initially mermaid, gflow, sequenceDiagram and gantt
  const lvl1Keys = Object.keys(cnf)
  for (let i = 0; i < lvl1Keys.length; i++) {
    if (typeof cnf[lvl1Keys[i]] === 'object' && cnf[lvl1Keys[i]] != null) {
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
  render,
  parse,
  initialize,
  getConfig
}

export default mermaidAPI
