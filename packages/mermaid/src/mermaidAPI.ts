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
import Diagram, { getDiagramFromText, type ParseErrorFunction } from './Diagram';
import errorRenderer from './diagrams/error/errorRenderer';
import { attachFunctions } from './interactionDb';
import { log, setLogLevel } from './logger';
import getStyles from './styles';
import theme from './themes';
import utils, { directiveSanitizer } from './utils';
import DOMPurify from 'dompurify';
import { MermaidConfig } from './config.type';
import { evaluate } from './diagrams/common/common';

const MAX_TEXTLENGTH_EXCEEDED_MSG =
  'graph TB;a[Maximum text size in diagram exceeded];style a fill:#faa';

const SECURITY_LVL_SANDBOX = 'sandbox';
const SECURITY_LVL_LOOSE = 'loose';

const XMLNS_XHTML_STD = 'http://www.w3.org/1999/xhtml';
const XMLNS_SVG_STD = 'http://www.w3.org/2000/svg';
const XMLNS_XLINK_STD = 'http://www.w3.org/1999/xlink';

// ------------------------------
// iFrame
const IFRAME_WIDTH = '100%';
const IFRAME_HEIGHT = '100%';
const IFRAME_STYLES = 'border:0;margin:0;';
const IFRAME_BODY_STYLE = 'margin:0';
const IFRAME_SANDBOX_OPTS = 'allow-top-navigation-by-user-activation allow-popups';
const IFRAME_NOT_SUPPORTED_MSG = 'The "iframe" tag is not supported by your browser.';

// DOMPurify settings for svgCode
const DOMPURE_TAGS = ['foreignobject'];
const DOMPURE_ATTR = ['dominant-baseline'];

// This is what is returned from getClasses(...) methods.
// It is slightly renamed to ..StyleClassDef instead of just ClassDef because "class" is a greatly ambiguous and overloaded word.
// It makes it clear we're working with a style class definition, even though defining the type is currently difficult.
// @ts-ignore This is an alias for a js construct used in diagrams.
type DiagramStyleClassDef = any;

// This makes it clear that we're working with a d3 selected element of some kind, even though it's hard to specify the exact type.
// @ts-ignore Could replicate the type definition in d3. This also makes it possible to use the untyped info from the js diagram files.
type D3Element = any;

// ----------------------------------------------------------------------------

/**
 * @param text
 * @param parseError
 */
function parse(text: string, parseError?: ParseErrorFunction): boolean {
  addDiagrams();
  const diagram = new Diagram(text, parseError);
  return diagram.parse(text, parseError);
}

/**
 *
 * @param {string} text - text to be encoded
 * @returns {string}
 */
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

/**
 *
 * @param {string} text - text to be decoded
 * @returns {string}
 */
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

// append !important; to each cssClass followed by a final !important, all enclosed in { }
//
/**
 * Create a CSS style that starts with the given class name, then the element,
 * with an enclosing block that has each of the cssClasses followed by !important;
 * @param {string} cssClass
 * @param {string} element
 * @param {string[]} cssClasses
 * @returns {string}
 */
export const cssImportantStyles = (
  cssClass: string,
  element: string,
  cssClasses: string[] = []
): string => {
  return `\n.${cssClass} ${element} { ${cssClasses.join(' !important; ')} !important; }`;
};

/**
 * Create the user styles
 *
 * @param {MermaidConfig} config
 * @param {string} graphType
 * @param {null | DiagramStyleClassDef[]} classDefs - the classDefs in the diagram text. Might be null if none were defined. Usually is the result of a call to getClasses(...)
 * @returns {string} the string with all the user styles
 */
export const createCssStyles = (
  config: MermaidConfig,
  graphType: string,
  classDefs: DiagramStyleClassDef[] | null | undefined
): string => {
  let cssStyles = '';

  // user provided theme CSS info
  // If you add more configuration driven data into the user styles make sure that the value is
  // sanitized by the santizeCSS function  @todo TODO where is this method?  what should be used to replace it?  refactor so that it's always sanitized
  if (config.themeCSS !== undefined) cssStyles += `\n${config.themeCSS}`;

  if (config.fontFamily !== undefined)
    cssStyles += `\n:root { --mermaid-font-family: ${config.fontFamily}}`;

  if (config.altFontFamily !== undefined)
    cssStyles += `\n:root { --mermaid-alt-font-family: ${config.altFontFamily}}`;

  // classDefs defined in the diagram text
  if (classDefs !== undefined && classDefs !== null && classDefs.length > 0) {
    if (graphType === 'flowchart' || graphType === 'flowchart-v2' || graphType === 'graph') {
      const htmlLabels = config.htmlLabels || config.flowchart?.htmlLabels;

      const cssHtmlElements = ['> *', 'span']; // @todo TODO make a constant
      const cssShapeElements = ['rect', 'polygon', 'ellipse', 'circle']; // @todo TODO make a constant

      const cssElements = htmlLabels ? cssHtmlElements : cssShapeElements;

      // create the CSS styles needed for each styleClass definition and css element
      for (const classId in classDefs) {
        const styleClassDef = classDefs[classId];
        // create the css styles for each cssElement and the styles (only if there are styles)
        if (styleClassDef['styles'] && styleClassDef['styles'].length > 0) {
          cssElements.forEach((cssElement) => {
            cssStyles += cssImportantStyles(
              styleClassDef['id'],
              cssElement,
              styleClassDef['styles']
            );
          });
        }
        // create the css styles for the tspan element and the text styles (only if there are textStyles)
        if (styleClassDef['textStyles'] && styleClassDef['textStyles'].length > 0) {
          cssStyles += cssImportantStyles(
            styleClassDef['id'],
            'tspan',
            styleClassDef['textStyles']
          );
        }
      }
    }
  }
  return cssStyles;
};

export const cleanUpSvgCode = (
  svgCode = '',
  inSandboxMode: boolean,
  useArrowMarkerUrls: boolean
): string => {
  let cleanedUpSvg = svgCode;

  // Replace marker-end urls with just the # anchor (remove the preceding part of the URL)
  if (!useArrowMarkerUrls && !inSandboxMode) {
    cleanedUpSvg = cleanedUpSvg.replace(/marker-end="url\(.*?#/g, 'marker-end="url(#');
  }

  cleanedUpSvg = decodeEntities(cleanedUpSvg);

  // replace old br tags with newer style
  cleanedUpSvg = cleanedUpSvg.replace(/<br>/g, '<br/>');

  return cleanedUpSvg;
};

/**
 * Put the svgCode into an iFrame. Return the iFrame code
 *
 * @param {string} svgCode
 * @param {D3Element} svgElement - the d3 node that has the current svgElement so we can get the height from it
 * @returns {string} - the code with the iFrame that now contains the svgCode
 * @todo  TODO replace btoa(). Replace with  buf.toString('base64')?
 */
export const putIntoIFrame = (svgCode = '', svgElement?: D3Element): string => {
  let height = IFRAME_HEIGHT; // default iFrame height
  if (svgElement) height = svgElement.viewBox.baseVal.height + 'px';
  const base64encodedSrc = btoa('<body style="' + IFRAME_BODY_STYLE + '">' + svgCode + '</body>');
  return `<iframe style="width:${IFRAME_WIDTH};height:${height};${IFRAME_STYLES}" src="data:text/html;base64,${base64encodedSrc}" sandbox="${IFRAME_SANDBOX_OPTS}">
  ${IFRAME_NOT_SUPPORTED_MSG}
</iframe>`;
};

/**
 * Append an enclosing div, then svg, then g (group) to the d3 parentRoot. Set attributes.
 * Only set the style attribute on the enclosing div if divStyle is given.
 * Only set the xmlns:xlink attribute on svg if svgXlink is given.
 * Return the last node appended
 *
 * @param {D3Element} parentRoot - the d3 node to append things to
 * @param {string} id
 * @param enclosingDivId
 * @param {string} divStyle
 * @param {string} svgXlink
 * @returns {D3Element} - returns the parentRoot that had nodes appended
 */
export const appendDivSvgG = (
  parentRoot: D3Element,
  id: string,
  enclosingDivId: string,
  divStyle?: string,
  svgXlink?: string
): D3Element => {
  const enclosingDiv = parentRoot.append('div');
  enclosingDiv.attr('id', enclosingDivId);
  if (divStyle) enclosingDiv.attr('style', divStyle);

  const svgNode = enclosingDiv
    .append('svg')
    .attr('id', id)
    .attr('width', '100%')
    .attr('xmlns', XMLNS_SVG_STD);
  if (svgXlink) svgNode.attr('xmlns:xlink', svgXlink);

  svgNode.append('g');
  return parentRoot;
};

/** Append an iFrame node to the given parentNode and set the id, style, and 'sandbox' attributes
 *  Return the appended iframe d3 node
 *
 * @param {D3Element} parentNode
 * @param {string} iFrameId - id to use for the iFrame
 * @returns {D3Element} the appended iframe d3 node
 */
function sandboxedIframe(parentNode: D3Element, iFrameId: string): D3Element {
  return parentNode
    .append('iframe')
    .attr('id', iFrameId)
    .attr('style', 'width: 100%; height: 100%;')
    .attr('sandbox', '');
}

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
 * @param {string} id The id for the SVG element (the element to be rendered)
 * @param {string} text The text for the graph definition
 * @param {(svgCode: string, bindFunctions?: (element: Element) => void) => void} cb Callback which
 *   is called after rendering is finished with the svg code as inparam.
 * @param {Element} svgContainingElement  HTML element where the svg will be inserted. (Is usually element with the .mermaid class)
 *   inserted. If no svgContainingElement is provided then the SVG element will be appended to the body.
 * @returns {void}
 */
const render = async function (
  id: string,
  text: string,
  cb: (svgCode: string, bindFunctions?: (element: Element) => void) => void,
  svgContainingElement?: Element
): Promise<void> {
  addDiagrams();

  configApi.reset();

  // Add Directives. Must do this before getting the config and before creating the diagram.
  const graphInit = utils.detectInit(text);
  if (graphInit) {
    directiveSanitizer(graphInit);
    configApi.addDirective(graphInit);
  }

  const config = configApi.getConfig();
  log.debug(config);

  // Check the maximum allowed text size
  if (text.length > config.maxTextSize!) text = MAX_TEXTLENGTH_EXCEEDED_MSG;

  // clean up text CRLFs
  text = text.replace(/\r\n?/g, '\n'); // parser problems on CRLF ignore all CR and leave LF;;

  const idSelector = '#' + id;
  const iFrameID = 'i' + id;
  const iFrameID_selector = '#' + iFrameID;
  const enclosingDivID = 'd' + id;
  const enclosingDivID_selector = '#' + enclosingDivID;

  let root: any = select('body');

  const isSandboxed = config.securityLevel === SECURITY_LVL_SANDBOX;
  const isLooseSecurityLevel = config.securityLevel === SECURITY_LVL_LOOSE;

  const fontFamily = config.fontFamily;

  // -------------------------------------------------------------------------------
  // Define the root d3 node

  // In regular execution the svgContainingElement will be the element with a mermaid class
  if (typeof svgContainingElement !== 'undefined') {
    if (svgContainingElement) svgContainingElement.innerHTML = '';

    if (isSandboxed) {
      // If we are in sandboxed mode, we do everything mermaid related in a (sandboxed )iFrame
      const iframe = sandboxedIframe(select(svgContainingElement), iFrameID);
      root = select(iframe.nodes()[0]!.contentDocument!.body);
      root.node().style.margin = 0;
    } else {
      root = select(svgContainingElement);
    }
    appendDivSvgG(root, id, enclosingDivID, `font-family: ${fontFamily}`, XMLNS_XLINK_STD);
  } else {
    // No svgContainingElement was provided
    // If there is an existing element with the id, we remove it
    // this likely a previously rendered diagram
    const existingSvg = document.getElementById(id);
    if (existingSvg) existingSvg.remove();

    // Remove previous temporary element if it exists
    let element;
    if (isSandboxed) {
      element = document.querySelector(iFrameID_selector);
    } else {
      element = document.querySelector(enclosingDivID_selector);
    }
    if (element) element.remove();

    // Add the temporary div used for rendering with the enclosingDivID.
    // This temporary div will contain a svg with the id == id

    if (isSandboxed) {
      // If we are in sandboxed mode, we do everything mermaid related in a (sandboxed) iFrame
      const iframe = sandboxedIframe(select('body'), iFrameID);

      root = select(iframe.nodes()[0]!.contentDocument!.body);
      root.node().style.margin = 0;
    } else root = select('body');

    appendDivSvgG(root, id, enclosingDivID);
  }

  text = encodeEntities(text);

  // -------------------------------------------------------------------------------
  // Create the diagram

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

  // Get the tmp div element containing the svg
  const element = root.select(enclosingDivID_selector).node();
  const graphType = diag.type;

  // -------------------------------------------------------------------------------
  // Create and insert the styles (user styles, theme styles, config styles)

  // insert inline style into svg
  const svg = element.firstChild;
  const firstChild = svg.firstChild;

  const userDefClasses: any = flowRenderer.getClasses(text, diag);
  const cssStyles = createCssStyles(config, graphType, userDefClasses);

  const stylis = (selector: string, styles: string) =>
    serialize(compile(`${selector}{${styles}}`), stringify);
  const rules = stylis(`${idSelector}`, getStyles(graphType, cssStyles, config.themeVariables));

  const style1 = document.createElement('style');
  style1.innerHTML = `${idSelector} ` + rules;
  svg.insertBefore(style1, firstChild);

  // -------------------------------------------------------------------------------
  // Draw the diagram with the renderer
  try {
    await diag.renderer.draw(text, id, pkg.version, diag);
  } catch (e) {
    await errorRenderer.draw(text, id, pkg.version);
    throw e;
  }

  // -------------------------------------------------------------------------------
  // Clean up SVG code
  root.select(`[id="${id}"]`).selectAll('foreignobject > *').attr('xmlns', XMLNS_XHTML_STD);

  // Fix for when the base tag is used
  let svgCode = root.select(enclosingDivID_selector).node().innerHTML;

  log.debug('config.arrowMarkerAbsolute', config.arrowMarkerAbsolute);
  svgCode = cleanUpSvgCode(svgCode, isSandboxed, evaluate(config.arrowMarkerAbsolute));

  if (isSandboxed) {
    const svgEl = root.select(enclosingDivID_selector + ' svg').node();
    svgCode = putIntoIFrame(svgCode, svgEl);
  } else {
    if (isLooseSecurityLevel) {
      // Sanitize the svgCode using DOMPurify
      svgCode = DOMPurify.sanitize(svgCode, {
        ADD_TAGS: DOMPURE_TAGS,
        ADD_ATTR: DOMPURE_ATTR,
      });
    }
  }

  // -------------------------------------------------------------------------------
  // Do any callbacks (cb = callback)
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
  } else log.debug('CB = undefined!');

  attachFunctions();

  // -------------------------------------------------------------------------------
  // Remove the temporary element if appropriate
  const tmpElementSelector = isSandboxed ? iFrameID_selector : enclosingDivID_selector;
  const node = select(tmpElementSelector).node();
  if (node && 'remove' in node) node.remove();

  if (parseEncounteredException) throw parseEncounteredException;

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
