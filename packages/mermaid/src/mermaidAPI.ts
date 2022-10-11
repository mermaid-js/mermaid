/**
 * This is the API to be used when optionally handling the integration with the web page, instead of
 * using the default integration provided by mermaid.js.
 *
 * The core of this api is the [**render**](Setup.md?id=render) function which, given a graph
 * definition as text, renders the graph/diagram and returns an svg element for the graph.
 *
 * It is then up to the user of the API to make use of the svg, either insert it somewhere in the
 * page or do something completely different.
 *
 * In addition to the render function, a number of behavioral configuration options are available.
 *
 * @name mermaidAPI
 */
import { select } from 'd3';
import { compile, serialize, stringify } from 'stylis';
// @ts-ignore: TODO Fix ts errors
import pkg from '../package.json';
import * as configApi from './config';
import { addDiagrams } from './diagram-api/diagram-orchestration';
import classDb from './diagrams/class/classDb';
import flowDb from './diagrams/flowchart/flowDb';
import flowRenderer from './diagrams/flowchart/flowRenderer';
import ganttDb from './diagrams/gantt/ganttDb';
import Diagram, { getDiagramFromText } from './Diagram';
import errorRenderer from './diagrams/error/errorRenderer';
import { attachFunctions } from './interactionDb';
import { log, setLogLevel } from './logger';
import getStyles from './styles';
import theme from './themes';
import utils, { directiveSanitizer } from './utils';
import DOMPurify from 'dompurify';
import { MermaidConfig } from './config.type';
import { evaluate } from './diagrams/common/common';

const CLASSDEF_DIAGRAMS = ['graph', 'flowchart', 'flowchart-v2', 'stateDiagram'];

/**
 * @param text
 * @param parseError
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function parse(text: string, parseError?: Function): boolean {
  addDiagrams();
  const diagram = new Diagram(text, parseError);
  return diagram.parse(text, parseError);
}

export const encodeEntities = function (text: string): string {
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

export const decodeEntities = function (text: string): string {
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
 * ```javascript
 * mermaidAPI.initialize({
 *   startOnLoad: true,
 * });
 * $(function () {
 *   const graphDefinition = 'graph TB\na-->b';
 *   const cb = function (svgGraph) {
 *     console.log(svgGraph);
 *   };
 *   mermaidAPI.render('id1', graphDefinition, cb);
 * });
 * ```
 *
 * @param {string} id The id of the element to be rendered
 * @param {string} text The graph definition
 * @param {(svgCode: string, bindFunctions?: (element: Element) => void) => void} cb Callback which
 *   is called after rendering is finished with the svg code as inparam.
 * @param {Element} container Selector to element in which a div with the graph temporarily will be
 *   inserted. If one is provided a hidden div will be inserted in the body of the page instead. The
 *   element will be removed when rendering is completed.
 * @returns {void}
 */
const render = async function (
  id: string,
  text: string,
  cb: (svgCode: string, bindFunctions?: (element: Element) => void) => void,
  container?: Element
): Promise<void> {
  addDiagrams();
  configApi.reset();
  text = text.replace(/\r\n?/g, '\n'); // parser problems on CRLF ignore all CR and leave LF;;
  const graphInit = utils.detectInit(text);
  if (graphInit) {
    directiveSanitizer(graphInit);
    configApi.addDirective(graphInit);
  }
  const cnf = configApi.getConfig();

  log.debug(cnf);

  // Check the maximum allowed text size
  if (text.length > cnf.maxTextSize!) {
    text = 'graph TB;a[Maximum text size in diagram exceeded];style a fill:#faa';
  }

  let root: any = select('body');

  // In regular execution the container will be the div with a mermaid class
  if (typeof container !== 'undefined') {
    // A container was provided by the caller
    if (container) {
      container.innerHTML = '';
    }

    if (cnf.securityLevel === 'sandbox') {
      // IF we are in sandboxed mode, we do everyting mermaid related
      // in a sandboxed div
      const iframe = select(container)
        .append('iframe')
        .attr('id', 'i' + id)
        .attr('style', 'width: 100%; height: 100%;')
        .attr('sandbox', '');
      // const iframeBody = ;
      root = select(iframe.nodes()[0]!.contentDocument!.body);
      root.node().style.margin = 0;
    } else {
      root = select(container);
    }

    root
      .append('div')
      .attr('id', 'd' + id)
      .attr('style', 'font-family: ' + cnf.fontFamily)
      .append('svg')
      .attr('id', id)
      .attr('width', '100%')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .append('g');
  } else {
    // No container was provided
    // If there is an existing element with the id, we remove it
    // this likely a previously rendered diagram
    const existingSvg = document.getElementById(id);
    if (existingSvg) {
      existingSvg.remove();
    }

    // Remove previous tpm element if it exists
    let element;
    if (cnf.securityLevel === 'sandbox') {
      element = document.querySelector('#i' + id);
    } else {
      element = document.querySelector('#d' + id);
    }

    if (element) {
      element.remove();
    }

    // Add the tmp div used for rendering with the id `d${id}`
    // d+id it will contain a svg with the id "id"

    if (cnf.securityLevel === 'sandbox') {
      // IF we are in sandboxed mode, we do everyting mermaid related
      // in a sandboxed div
      const iframe = select('body')
        .append('iframe')
        .attr('id', 'i' + id)
        .attr('style', 'width: 100%; height: 100%;')
        .attr('sandbox', '');

      root = select(iframe.nodes()[0]!.contentDocument!.body);
      root.node().style.margin = 0;
    } else {
      root = select('body');
    }

    // This is the temporary div
    root
      .append('div')
      .attr('id', 'd' + id)
      // this is the seed of the svg to be rendered
      .append('svg')
      .attr('id', id)
      .attr('width', '100%')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .append('g');
  }

  text = encodeEntities(text);

  // Important that we do not create the diagram until after the directives have been included
  let diag;
  let parseEncounteredException;
  try {
    // diag = new Diagram(text);
    diag = await getDiagramFromText(text);
  } catch (error) {
    diag = new Diagram('error');
    parseEncounteredException = error;
  }
  // Get the tmp element containing the the svg
  const element = root.select('#d' + id).node();
  const graphType = diag.type;

  // insert inline style into svg
  const svg = element.firstChild;
  const firstChild = svg.firstChild;

  let userStyles = '';
  // user provided theme CSS
  // If you add more configuration driven data into the user styles make sure that the value is
  // sanitized bye the santiizeCSS function
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
  if (CLASSDEF_DIAGRAMS.includes(graphType)) {
    const classes: any = diag.renderer.getClasses(text, diag);
    const htmlLabels = cnf.htmlLabels || cnf.flowchart?.htmlLabels;
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

  const stylis = (selector: string, styles: string) =>
    serialize(compile(`${selector}{${styles}}`), stringify);
  const rules = stylis(`#${id}`, getStyles(graphType, userStyles, cnf.themeVariables));

  const style1 = document.createElement('style');
  style1.innerHTML = `#${id} ` + rules;
  svg.insertBefore(style1, firstChild);

  try {
    await diag.renderer.draw(text, id, pkg.version, diag);
  } catch (e) {
    await errorRenderer.draw(text, id, pkg.version);
    throw e;
  }

  root
    .select(`[id="${id}"]`)
    .selectAll('foreignobject > *')
    .attr('xmlns', 'http://www.w3.org/1999/xhtml');

  // Fix for when the base tag is used
  let svgCode = root.select('#d' + id).node().innerHTML;

  log.debug('cnf.arrowMarkerAbsolute', cnf.arrowMarkerAbsolute);
  if (!evaluate(cnf.arrowMarkerAbsolute) && cnf.securityLevel !== 'sandbox') {
    svgCode = svgCode.replace(/marker-end="url\(.*?#/g, 'marker-end="url(#', 'g');
  }

  svgCode = decodeEntities(svgCode);

  // Fix for when the br tag is used
  svgCode = svgCode.replace(/<br>/g, '<br/>');

  if (cnf.securityLevel === 'sandbox') {
    const svgEl = root.select('#d' + id + ' svg').node();
    const width = '100%';
    let height = '100%';
    if (svgEl) {
      height = svgEl.viewBox.baseVal.height + 'px';
    }
    svgCode = `<iframe style="width:${width};height:${height};border:0;margin:0;" src="data:text/html;base64,${btoa(
      '<body style="margin:0">' + svgCode + '</body>'
    )}" sandbox="allow-top-navigation-by-user-activation allow-popups">
  The “iframe” tag is not supported by your browser.
</iframe>`;
  } else {
    if (cnf.securityLevel !== 'loose') {
      svgCode = DOMPurify.sanitize(svgCode, {
        ADD_TAGS: ['foreignobject'],
        ADD_ATTR: ['dominant-baseline'],
      });
    }
  }

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
  attachFunctions();

  const tmpElementSelector = cnf.securityLevel === 'sandbox' ? '#i' + id : '#d' + id;
  const node = select(tmpElementSelector).node();
  if (node && 'remove' in node) {
    node.remove();
  }

  if (parseEncounteredException) {
    throw parseEncounteredException;
  }

  return svgCode;
};

let currentDirective: { type?: string; args?: any } | undefined = {};

const parseDirective = function (p: any, statement: string, context: string, type: string): void {
  try {
    if (statement !== undefined) {
      statement = statement.trim();
      switch (context) {
        case 'open_directive':
          currentDirective = {};
          break;
        case 'type_directive':
          if (!currentDirective) throw new Error('currentDirective is undefined');
          currentDirective.type = statement.toLowerCase();
          break;
        case 'arg_directive':
          if (!currentDirective) throw new Error('currentDirective is undefined');
          currentDirective.args = JSON.parse(statement);
          break;
        case 'close_directive':
          handleDirective(p, currentDirective, type);
          currentDirective = undefined;
          break;
      }
    }
  } catch (error) {
    log.error(
      `Error while rendering sequenceDiagram directive: ${statement} jison context: ${context}`
    );
    // @ts-ignore: TODO Fix ts errors
    log.error(error.message);
  }
};

const handleDirective = function (p: any, directive: any, type: string): void {
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
      log.debug('sanitize in handleDirective', directive.args);
      directiveSanitizer(directive.args);
      log.debug('sanitize in handleDirective (done)', directive.args);
      configApi.addDirective(directive.args);
      break;
    }
    case 'wrap':
    case 'nowrap':
      if (p && p['setWrap']) {
        p.setWrap(directive.type === 'wrap');
      }
      break;
    case 'themeCss':
      log.warn('themeCss encountered');
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

/** @param {MermaidConfig} options */
async function initialize(options: MermaidConfig) {
  // Handle legacy location of font-family configuration
  if (options?.fontFamily) {
    if (!options.themeVariables?.fontFamily) {
      options.themeVariables = { fontFamily: options.fontFamily };
    }
  }

  // Set default options
  configApi.saveConfigFromInitialize(options);

  if (options?.theme && options.theme in theme) {
    // Todo merge with user options
    options.themeVariables = theme[options.theme as keyof typeof theme].getThemeVariables(
      options.themeVariables
    );
  } else if (options) {
    options.themeVariables = theme.default.getThemeVariables(options.themeVariables);
  }

  const config =
    typeof options === 'object' ? configApi.setSiteConfig(options) : configApi.getSiteConfig();

  setLogLevel(config.logLevel);
  addDiagrams();
}

export const mermaidAPI = Object.freeze({
  render,
  parse,
  parseDirective,
  initialize,
  getConfig: configApi.getConfig,
  setConfig: configApi.setConfig,
  getSiteConfig: configApi.getSiteConfig,
  updateSiteConfig: configApi.updateSiteConfig,
  reset: () => {
    configApi.reset();
  },
  globalReset: () => {
    configApi.reset(configApi.defaultConfig);
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
 *     theme: 'default',
 *     logLevel: 'fatal',
 *     securityLevel: 'strict',
 *     startOnLoad: true,
 *     arrowMarkerAbsolute: false,
 *
 *     er: {
 *       diagramPadding: 20,
 *       layoutDirection: 'TB',
 *       minEntityWidth: 100,
 *       minEntityHeight: 75,
 *       entityPadding: 15,
 *       stroke: 'gray',
 *       fill: 'honeydew',
 *       fontSize: 12,
 *       useMaxWidth: true,
 *     },
 *     flowchart: {
 *       diagramPadding: 8,
 *       htmlLabels: true,
 *       curve: 'basis',
 *     },
 *     sequence: {
 *       diagramMarginX: 50,
 *       diagramMarginY: 10,
 *       actorMargin: 50,
 *       width: 150,
 *       height: 65,
 *       boxMargin: 10,
 *       boxTextMargin: 5,
 *       noteMargin: 10,
 *       messageMargin: 35,
 *       messageAlign: 'center',
 *       mirrorActors: true,
 *       bottomMarginAdj: 1,
 *       useMaxWidth: true,
 *       rightAngles: false,
 *       showSequenceNumbers: false,
 *     },
 *     gantt: {
 *       titleTopMargin: 25,
 *       barHeight: 20,
 *       barGap: 4,
 *       topPadding: 50,
 *       leftPadding: 75,
 *       gridLineStartPadding: 35,
 *       fontSize: 11,
 *       fontFamily: '"Open Sans", sans-serif',
 *       numberSectionStyles: 4,
 *       axisFormat: '%Y-%m-%d',
 *       topAxis: false,
 *     },
 *   };
 *   mermaid.initialize(config);
 * </script>
 * ```
 */
