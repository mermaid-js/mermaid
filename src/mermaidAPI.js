/**
 *Edit this Page[![N|Solid](img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/src/mermaidAPI.js)
 *
 *This is the API to be used when optionally handling the integration with the web page, instead of using the default integration provided by mermaid.js.
 *
 *
 * The core of this api is the [**render**](Setup.md?id=render) function which, given a graph
 * definition as text, renders the graph/diagram and returns an svg element for the graph.
 *
 * It is is then up to the user of the API to make use of the svg, either insert it somewhere in the page or do something completely different.
 *
 * In addition to the render function, a number of behavioral configuration options are available.
 *
 * @name mermaidAPI
 */
import { select } from 'd3';
import { compile, serialize, stringify } from 'stylis';
import pkg from '../package.json';
import * as configApi from './config';
import classDb from './diagrams/class/classDb';
import classRenderer from './diagrams/class/classRenderer';
import classRendererV2 from './diagrams/class/classRenderer-v2';
import classParser from './diagrams/class/parser/classDiagram';
import erDb from './diagrams/er/erDb';
import erRenderer from './diagrams/er/erRenderer';
import erParser from './diagrams/er/parser/erDiagram';
import flowDb from './diagrams/flowchart/flowDb';
import flowRenderer from './diagrams/flowchart/flowRenderer';
import flowRendererV2 from './diagrams/flowchart/flowRenderer-v2';
import flowParser from './diagrams/flowchart/parser/flow';
import ganttDb from './diagrams/gantt/ganttDb';
import ganttRenderer from './diagrams/gantt/ganttRenderer';
import ganttParser from './diagrams/gantt/parser/gantt';
import gitGraphAst from './diagrams/git/gitGraphAst';
import gitGraphRenderer from './diagrams/git/gitGraphRenderer';
import gitGraphParser from './diagrams/git/parser/gitGraph';
import infoDb from './diagrams/info/infoDb';
import infoRenderer from './diagrams/info/infoRenderer';
import infoParser from './diagrams/info/parser/info';
import pieParser from './diagrams/pie/parser/pie';
import pieDb from './diagrams/pie/pieDb';
import pieRenderer from './diagrams/pie/pieRenderer';
import requirementParser from './diagrams/requirement/parser/requirementDiagram';
import requirementDb from './diagrams/requirement/requirementDb';
import requirementRenderer from './diagrams/requirement/requirementRenderer';
import sequenceParser from './diagrams/sequence/parser/sequenceDiagram';
import sequenceDb from './diagrams/sequence/sequenceDb';
import sequenceRenderer from './diagrams/sequence/sequenceRenderer';
import stateParser from './diagrams/state/parser/stateDiagram';
import stateDb from './diagrams/state/stateDb';
import stateRenderer from './diagrams/state/stateRenderer';
import stateRendererV2 from './diagrams/state/stateRenderer-v2';
import journeyDb from './diagrams/user-journey/journeyDb';
import journeyRenderer from './diagrams/user-journey/journeyRenderer';
import journeyParser from './diagrams/user-journey/parser/journey';
import errorRenderer from './errorRenderer';
// import * as configApi from './config';
// // , {
// //   setConfig,
// //   configApi.getConfig,
// //   configApi.updateSiteConfig,
// //   configApi.setSiteConfig,
// //   configApi.getSiteConfig,
// //   configApi.defaultConfig
// // }
import { log, setLogLevel } from './logger';
import getStyles from './styles';
import theme from './themes';
import utils, { assignWithDepth } from './utils';

function parse(text) {
  const cnf = configApi.getConfig();
  const graphInit = utils.detectInit(text, cnf);
  if (graphInit) {
    reinitialize(graphInit);
    log.debug('reinit ', graphInit);
  }
  const graphType = utils.detectType(text, cnf);
  let parser;

  log.debug('Type ' + graphType);
  switch (graphType) {
    case 'git':
      parser = gitGraphParser;
      parser.parser.yy = gitGraphAst;
      break;
    case 'flowchart':
      flowDb.clear();
      parser = flowParser;
      parser.parser.yy = flowDb;
      break;
    case 'flowchart-v2':
      flowDb.clear();
      parser = flowParser;
      parser.parser.yy = flowDb;
      break;
    case 'sequence':
      parser = sequenceParser;
      parser.parser.yy = sequenceDb;
      break;
    case 'gantt':
      parser = ganttParser;
      parser.parser.yy = ganttDb;
      break;
    case 'class':
      parser = classParser;
      parser.parser.yy = classDb;
      break;
    case 'classDiagram':
      parser = classParser;
      parser.parser.yy = classDb;
      break;
    case 'state':
      parser = stateParser;
      parser.parser.yy = stateDb;
      break;
    case 'stateDiagram':
      parser = stateParser;
      parser.parser.yy = stateDb;
      break;
    case 'info':
      log.debug('info info info');
      parser = infoParser;
      parser.parser.yy = infoDb;
      break;
    case 'pie':
      log.debug('pie');
      parser = pieParser;
      parser.parser.yy = pieDb;
      break;
    case 'er':
      log.debug('er');
      parser = erParser;
      parser.parser.yy = erDb;
      break;
    case 'journey':
      log.debug('Journey');
      parser = journeyParser;
      parser.parser.yy = journeyDb;
      break;
    case 'requirement':
    case 'requirementDiagram':
      log.debug('RequirementDiagram');
      parser = requirementParser;
      parser.parser.yy = requirementDb;
      break;
  }
  parser.parser.yy.graphType = graphType;
  parser.parser.yy.parseError = (str, hash) => {
    const error = { str, hash };
    throw error;
  };

  parser.parse(text);
  return parser;
}

export const encodeEntities = function (text) {
  let txt = text;

  txt = txt.replace(/style.*:\S*#.*;/g, function (s) {
    const innerTxt = s.substring(0, s.length - 1);
    return innerTxt;
  });
  txt = txt.replace(/classDef.*:\S*#.*;/g, function (s) {
    const innerTxt = s.substring(0, s.length - 1);
    return innerTxt;
  });

  txt = txt.replace(/#\w+;/g, function (s) {
    const innerTxt = s.substring(1, s.length - 1);

    const isInt = /^\+?\d+$/.test(innerTxt);
    if (isInt) {
      return 'ﬂ°°' + innerTxt + '¶ß';
    } else {
      return 'ﬂ°' + innerTxt + '¶ß';
    }
  });

  return txt;
};

export const decodeEntities = function (text) {
  let txt = text;

  txt = txt.replace(/ﬂ°°/g, function () {
    return '&#';
  });
  txt = txt.replace(/ﬂ°/g, function () {
    return '&';
  });
  txt = txt.replace(/¶ß/g, function () {
    return ';';
  });

  return txt;
};
/**
 * Function that renders an svg with a graph from a chart definition. Usage example below.
 *
 * ```js
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
 * @param _txt the graph definition
 * @param cb callback which is called after rendering is finished with the svg code as inparam.
 * @param container selector to element in which a div with the graph temporarily will be inserted. In one is
 * provided a hidden div will be inserted in the body of the page instead. The element will be removed when rendering is
 * completed.
 */
const render = function (id, _txt, cb, container) {
  configApi.reset();
  let txt = _txt;
  const graphInit = utils.detectInit(txt);
  if (graphInit) {
    configApi.addDirective(graphInit);
  }
  // else {
  //   configApi.reset();
  //   const siteConfig = configApi.getSiteConfig();
  //   configApi.addDirective(siteConfig);
  // }
  // console.warn('Render fetching config');

  let cnf = configApi.getConfig();
  // Check the maximum allowed text size
  if (_txt.length > cnf.maxTextSize) {
    txt = 'graph TB;a[Maximum text size in diagram exceeded];style a fill:#faa';
  }

  if (typeof container !== 'undefined') {
    container.innerHTML = '';

    select(container)
      .append('div')
      .attr('id', 'd' + id)
      .attr('style', 'font-family: ' + cnf.fontFamily)
      .append('svg')
      .attr('id', id)
      .attr('width', '100%')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .append('g');
  } else {
    const existingSvg = document.getElementById(id);
    if (existingSvg) {
      existingSvg.remove();
    }
    const element = document.querySelector('#' + 'd' + id);
    if (element) {
      element.remove();
    }

    select('body')
      .append('div')
      .attr('id', 'd' + id)
      .append('svg')
      .attr('id', id)
      .attr('width', '100%')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .append('g');
  }

  window.txt = txt;
  txt = encodeEntities(txt);

  const element = select('#d' + id).node();
  const graphType = utils.detectType(txt, cnf);

  // insert inline style into svg
  const svg = element.firstChild;
  const firstChild = svg.firstChild;

  let userStyles = '';
  // user provided theme CSS
  if (cnf.themeCSS !== undefined) {
    userStyles += `\n${cnf.themeCSS}`;
  }
  // user provided theme CSS
  if (cnf.fontFamily !== undefined) {
    userStyles += `\n:root { --mermaid-font-family: ${cnf.fontFamily}}`;
  }
  // user provided theme CSS
  if (cnf.altFontFamily !== undefined) {
    userStyles += `\n:root { --mermaid-alt-font-family: ${cnf.altFontFamily}}`;
  }

  // classDef
  if (graphType === 'flowchart' || graphType === 'flowchart-v2' || graphType === 'graph') {
    const classes = flowRenderer.getClasses(txt);
    const htmlLabels = cnf.htmlLabels || cnf.flowchart.htmlLabels;
    for (const className in classes) {
      if (htmlLabels) {
        userStyles += `\n.${className} > * { ${classes[className].styles.join(
          ' !important; '
        )} !important; }`;
        userStyles += `\n.${className} span { ${classes[className].styles.join(
          ' !important; '
        )} !important; }`;
      } else {
        userStyles += `\n.${className} path { ${classes[className].styles.join(
          ' !important; '
        )} !important; }`;
        userStyles += `\n.${className} rect { ${classes[className].styles.join(
          ' !important; '
        )} !important; }`;
        userStyles += `\n.${className} polygon { ${classes[className].styles.join(
          ' !important; '
        )} !important; }`;
        userStyles += `\n.${className} ellipse { ${classes[className].styles.join(
          ' !important; '
        )} !important; }`;
        userStyles += `\n.${className} circle { ${classes[className].styles.join(
          ' !important; '
        )} !important; }`;
        if (classes[className].textStyles) {
          userStyles += `\n.${className} tspan { ${classes[className].textStyles.join(
            ' !important; '
          )} !important; }`;
        }
      }
    }
  }

  // log.warn(cnf.themeVariables);

  const stylis = (selector, styles) => serialize(compile(`${selector}{${styles}}`), stringify);
  const rules = stylis(`#${id}`, getStyles(graphType, userStyles, cnf.themeVariables));

  const style1 = document.createElement('style');
  style1.innerHTML = `#${id} ` + rules;
  svg.insertBefore(style1, firstChild);

  // Verify that the generated svgs are ok before removing this

  // const style2 = document.createElement('style');
  // const cs = window.getComputedStyle(svg);
  // style2.innerHTML = `#d${id} * {
  //   color: ${cs.color};
  //   // font: ${cs.font};
  //   // font-family: Arial;
  //   // font-size: 24px;
  // }`;
  // svg.insertBefore(style2, firstChild);

  try {
    switch (graphType) {
      case 'git':
        cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        gitGraphRenderer.setConf(cnf.git);
        gitGraphRenderer.draw(txt, id, false);
        break;
      case 'flowchart':
        cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        flowRenderer.setConf(cnf.flowchart);
        flowRenderer.draw(txt, id, false);
        break;
      case 'flowchart-v2':
        cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        flowRendererV2.setConf(cnf.flowchart);
        flowRendererV2.draw(txt, id, false);
        break;
      case 'sequence':
        cnf.sequence.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        if (cnf.sequenceDiagram) {
          // backwards compatibility
          sequenceRenderer.setConf(Object.assign(cnf.sequence, cnf.sequenceDiagram));
          console.error(
            '`mermaid config.sequenceDiagram` has been renamed to `config.sequence`. Please update your mermaid config.'
          );
        } else {
          sequenceRenderer.setConf(cnf.sequence);
        }
        sequenceRenderer.draw(txt, id);
        break;
      case 'gantt':
        cnf.gantt.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        ganttRenderer.setConf(cnf.gantt);
        ganttRenderer.draw(txt, id);
        break;
      case 'class':
        cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        classRenderer.setConf(cnf.class);
        classRenderer.draw(txt, id);
        break;
      case 'classDiagram':
        cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        classRendererV2.setConf(cnf.class);
        classRendererV2.draw(txt, id);
        break;
      case 'state':
        cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        stateRenderer.setConf(cnf.state);
        stateRenderer.draw(txt, id);
        break;
      case 'stateDiagram':
        cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        stateRendererV2.setConf(cnf.state);
        stateRendererV2.draw(txt, id);
        break;
      case 'info':
        cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        infoRenderer.setConf(cnf.class);
        infoRenderer.draw(txt, id, pkg.version);
        break;
      case 'pie':
        //cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        //pieRenderer.setConf(cnf.pie);
        pieRenderer.draw(txt, id, pkg.version);
        break;
      case 'er':
        erRenderer.setConf(cnf.er);
        erRenderer.draw(txt, id, pkg.version);
        break;
      case 'journey':
        journeyRenderer.setConf(cnf.journey);
        journeyRenderer.draw(txt, id, pkg.version);
        break;
      case 'requirement':
        requirementRenderer.setConf(cnf.requirement);
        requirementRenderer.draw(txt, id, pkg.version);
        break;
    }
  } catch (e) {
    // errorRenderer.setConf(cnf.class);
    errorRenderer.draw(id, pkg.version);
    throw e;
  }

  select(`[id="${id}"]`)
    .selectAll('foreignobject > *')
    .attr('xmlns', 'http://www.w3.org/1999/xhtml');

  // if (cnf.arrowMarkerAbsolute) {
  //   url =
  //     window.location.protocol +
  //     '//' +
  //     window.location.host +
  //     window.location.pathname +
  //     window.location.search;
  //   url = url.replace(/\(/g, '\\(');
  //   url = url.replace(/\)/g, '\\)');
  // }

  // Fix for when the base tag is used
  let svgCode = select('#d' + id).node().innerHTML;
  log.debug('cnf.arrowMarkerAbsolute', cnf.arrowMarkerAbsolute);
  if (!cnf.arrowMarkerAbsolute || cnf.arrowMarkerAbsolute === 'false') {
    svgCode = svgCode.replace(/marker-end="url\(.*?#/g, 'marker-end="url(#', 'g');
  }

  svgCode = decodeEntities(svgCode);

  // Fix for when the br tag is used
  svgCode = svgCode.replace(/<br>/g, '<br/>');

  if (typeof cb !== 'undefined') {
    switch (graphType) {
      case 'flowchart':
      case 'flowchart-v2':
        cb(svgCode, flowDb.bindFunctions);
        break;
      case 'gantt':
        cb(svgCode, ganttDb.bindFunctions);
        break;
      case 'class':
      case 'classDiagram':
        cb(svgCode, classDb.bindFunctions);
        break;
      default:
        cb(svgCode);
    }
  } else {
    log.debug('CB = undefined!');
  }

  const node = select('#d' + id).node();
  if (node !== null && typeof node.remove === 'function') {
    select('#d' + id)
      .node()
      .remove();
  }

  return svgCode;
};

let currentDirective = {};

const parseDirective = function (p, statement, context, type) {
  try {
    if (statement !== undefined) {
      statement = statement.trim();
      switch (context) {
        case 'open_directive':
          currentDirective = {};
          break;
        case 'type_directive':
          currentDirective.type = statement.toLowerCase();
          break;
        case 'arg_directive':
          currentDirective.args = JSON.parse(statement);
          break;
        case 'close_directive':
          handleDirective(p, currentDirective, type);
          currentDirective = null;
          break;
      }
    }
  } catch (error) {
    log.error(
      `Error while rendering sequenceDiagram directive: ${statement} jison context: ${context}`
    );
    log.error(error.message);
  }
};

const handleDirective = function (p, directive, type) {
  log.debug(`Directive type=${directive.type} with args:`, directive.args);
  switch (directive.type) {
    case 'init':
    case 'initialize': {
      ['config'].forEach((prop) => {
        if (typeof directive.args[prop] !== 'undefined') {
          if (type === 'flowchart-v2') {
            type = 'flowchart';
          }
          directive.args[type] = directive.args[prop];
          delete directive.args[prop];
        }
      });

      reinitialize(directive.args);
      configApi.addDirective(directive.args);
      break;
    }
    case 'wrap':
    case 'nowrap':
      if (p && p['setWrap']) {
        p.setWrap(directive.type === 'wrap');
      }
      break;
    default:
      log.warn(
        `Unhandled directive: source: '%%{${directive.type}: ${JSON.stringify(
          directive.args ? directive.args : {}
        )}}%%`,
        directive
      );
      break;
  }
};

function updateRendererConfigs(conf) {
  // Todo remove, all diagrams should get config on demoand from the config object, no need for this
  gitGraphRenderer.setConf(conf.git);
  flowRenderer.setConf(conf.flowchart);
  flowRendererV2.setConf(conf.flowchart);
  if (typeof conf['sequenceDiagram'] !== 'undefined') {
    sequenceRenderer.setConf(assignWithDepth(conf.sequence, conf['sequenceDiagram']));
  }
  sequenceRenderer.setConf(conf.sequence);
  ganttRenderer.setConf(conf.gantt);
  classRenderer.setConf(conf.class);
  stateRenderer.setConf(conf.state);
  stateRendererV2.setConf(conf.state);
  infoRenderer.setConf(conf.class);
  // pieRenderer.setConf(conf.class);
  erRenderer.setConf(conf.er);
  journeyRenderer.setConf(conf.journey);
  requirementRenderer.setConf(conf.requirement);
  errorRenderer.setConf(conf.class);
}

function reinitialize() {
  // `mermaidAPI.reinitialize: v${pkg.version}`,
  //   JSON.stringify(options),
  //   options.themeVariables.primaryColor;
  // // if (options.theme && theme[options.theme]) {
  // //   options.themeVariables = theme[options.theme].getThemeVariables(options.themeVariables);
  // // }
  // // Set default options
  // const config =
  //   typeof options === 'object' ? configApi.setConfig(options) : configApi.getSiteConfig();
  // updateRendererConfigs(config);
  // setLogLevel(config.logLevel);
  // log.debug('mermaidAPI.reinitialize: ', config);
}

function initialize(options) {
  // console.warn(`mermaidAPI.initialize: v${pkg.version} `, options);

  // Handle legacy location of font-family configuration
  if (options && options.fontFamily) {
    if (!options.themeVariables) {
      options.themeVariables = { fontFamily: options.fontFamily };
    } else {
      if (!options.themeVariables.fontFamily) {
        options.themeVariables = { fontFamily: options.fontFamily };
      }
    }
  }
  // Set default options
  configApi.saveConfigFromInitilize(options);

  if (options && options.theme && theme[options.theme]) {
    // Todo merge with user options
    options.themeVariables = theme[options.theme].getThemeVariables(options.themeVariables);
  } else {
    if (options) options.themeVariables = theme.default.getThemeVariables(options.themeVariables);
  }

  const config =
    typeof options === 'object' ? configApi.setSiteConfig(options) : configApi.getSiteConfig();

  updateRendererConfigs(config);
  setLogLevel(config.logLevel);
  // log.debug('mermaidAPI.initialize: ', config);
}

const mermaidAPI = Object.freeze({
  render,
  parse,
  parseDirective,
  initialize,
  reinitialize,
  getConfig: configApi.getConfig,
  setConfig: configApi.setConfig,
  getSiteConfig: configApi.getSiteConfig,
  updateSiteConfig: configApi.updateSiteConfig,
  reset: () => {
    // console.warn('reset');
    configApi.reset();
    // const siteConfig = configApi.getSiteConfig();
    // updateRendererConfigs(siteConfig);
  },
  globalReset: () => {
    configApi.reset(configApi.defaultConfig);
    updateRendererConfigs(configApi.getConfig());
  },
  defaultConfig: configApi.defaultConfig,
});

setLogLevel(configApi.getConfig().logLevel);
configApi.reset(configApi.getConfig());

export default mermaidAPI;
/**
 * ## mermaidAPI configuration defaults
 *
 * ```html
 * <script>
 *   var config = {
 *     theme:'default',
 *     logLevel:'fatal',
 *     securityLevel:'strict',
 *     startOnLoad:true,
 *     arrowMarkerAbsolute:false,
 *
 *     er:{
 *       diagramPadding:20,
 *       layoutDirection:'TB',
 *       minEntityWidth:100,
 *       minEntityHeight:75,
 *       entityPadding:15,
 *       stroke:'gray',
 *       fill:'honeydew',
 *       fontSize:12,
 *       useMaxWidth:true,
 *     },
 *     flowchart:{
 *       diagramPadding:8,
 *       htmlLabels:true,
 *       curve:'basis',
 *     },
 *     sequence:{
 *       diagramMarginX:50,
 *       diagramMarginY:10,
 *       actorMargin:50,
 *       width:150,
 *       height:65,
 *       boxMargin:10,
 *       boxTextMargin:5,
 *       noteMargin:10,
 *       messageMargin:35,
 *       messageAlign:'center',
 *       mirrorActors:true,
 *       bottomMarginAdj:1,
 *       useMaxWidth:true,
 *       rightAngles:false,
 *       showSequenceNumbers:false,
 *     },
 *     gantt:{
 *       titleTopMargin:25,
 *       barHeight:20,
 *       barGap:4,
 *       topPadding:50,
 *       leftPadding:75,
 *       gridLineStartPadding:35,
 *       fontSize:11,
 *       fontFamily:'"Open-Sans", "sans-serif"',
 *       numberSectionStyles:4,
 *       axisFormat:'%Y-%m-%d',
 *       topAxis:false,
 *     }
 *   };
 *   mermaid.initialize(config);
 * </script>
 * ```
 */
