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
 */
// @ts-ignore TODO: Investigate D3 issue
import { select } from 'd3';
import { compile, serialize, stringify } from 'stylis';
// @ts-ignore: TODO Fix ts errors
import { version } from '../package.json';
import * as configApi from './config.js';
import { addDiagrams } from './diagram-api/diagram-orchestration.js';
import { Diagram, getDiagramFromText } from './Diagram.js';
import errorRenderer from './diagrams/error/errorRenderer.js';
import { attachFunctions } from './interactionDb.js';
import { log, setLogLevel } from './logger.js';
import getStyles from './styles.js';
import theme from './themes/index.js';
import utils, { directiveSanitizer } from './utils.js';
import DOMPurify from 'dompurify';
import { MermaidConfig } from './config.type.js';
import { evaluate } from './diagrams/common/common.js';
import isEmpty from 'lodash-es/isEmpty.js';
import { setA11yDiagramInfo, addSVGa11yTitleDescription } from './accessibility.js';
import { parseDirective } from './directiveUtils.js';

// diagram names that support classDef statements
const CLASSDEF_DIAGRAMS = [
  'graph',
  'flowchart',
  'flowchart-v2',
  'flowchart-elk',
  'stateDiagram',
  'stateDiagram-v2',
];
const MAX_TEXTLENGTH = 50_000;
const MAX_TEXTLENGTH_EXCEEDED_MSG =
  'graph TB;a[Maximum text size in diagram exceeded];style a fill:#faa';

const SECURITY_LVL_SANDBOX = 'sandbox';
const SECURITY_LVL_LOOSE = 'loose';

const XMLNS_SVG_STD = 'http://www.w3.org/2000/svg';
const XMLNS_XLINK_STD = 'http://www.w3.org/1999/xlink';
const XMLNS_XHTML_STD = 'http://www.w3.org/1999/xhtml';

// ------------------------------
// iFrame
const IFRAME_WIDTH = '100%';
const IFRAME_HEIGHT = '100%';
const IFRAME_STYLES = 'border:0;margin:0;';
const IFRAME_BODY_STYLE = 'margin:0';
const IFRAME_SANDBOX_OPTS = 'allow-top-navigation-by-user-activation allow-popups';
const IFRAME_NOT_SUPPORTED_MSG = 'The "iframe" tag is not supported by your browser.';

// DOMPurify settings for svgCode
const DOMPURIFY_TAGS = ['foreignobject'];
const DOMPURIFY_ATTR = ['dominant-baseline'];

// This is what is returned from getClasses(...) methods.
// It is slightly renamed to ..StyleClassDef instead of just ClassDef because "class" is a greatly ambiguous and overloaded word.
// It makes it clear we're working with a style class definition, even though defining the type is currently difficult.
interface DiagramStyleClassDef {
  id: string;
  styles?: string[];
  textStyles?: string[];
}

export interface ParseOptions {
  suppressErrors?: boolean;
}

// This makes it clear that we're working with a d3 selected element of some kind, even though it's hard to specify the exact type.
export type D3Element = any;

export interface RenderResult {
  /**
   * The svg code for the rendered graph.
   */
  svg: string;
  /**
   * Bind function to be called after the svg has been inserted into the DOM.
   * This is necessary for adding event listeners to the elements in the svg.
   * ```js
   * const { svg, bindFunctions } = mermaidAPI.render('id1', 'graph TD;A-->B');
   * div.innerHTML = svg;
   * bindFunctions?.(div); // To call bindFunctions only if it's present.
   * ```
   */
  bindFunctions?: (element: Element) => void;
}

/**
 * Parse the text and validate the syntax.
 * @param text - The mermaid diagram definition.
 * @param parseOptions - Options for parsing.
 * @returns true if the diagram is valid, false otherwise if parseOptions.suppressErrors is true.
 * @throws Error if the diagram is invalid and parseOptions.suppressErrors is false.
 */

async function parse(text: string, parseOptions?: ParseOptions): Promise<boolean> {
  addDiagrams();
  try {
    await getDiagramFromText(text);
  } catch (error) {
    if (parseOptions?.suppressErrors) {
      return false;
    }
    throw error;
  }
  return true;
}

/**
 * @param  text - text to be encoded
 * @returns
 */
export const encodeEntities = function (text: string): string {
  let txt = text;

  txt = txt.replace(/style.*:\S*#.*;/g, function (s): string {
    return s.substring(0, s.length - 1);
  });
  txt = txt.replace(/classDef.*:\S*#.*;/g, function (s): string {
    return s.substring(0, s.length - 1);
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
 * @param  text - text to be decoded
 * @returns
 */
export const decodeEntities = function (text: string): string {
  return text.replace(/ﬂ°°/g, '&#').replace(/ﬂ°/g, '&').replace(/¶ß/g, ';');
};

// append !important; to each cssClass followed by a final !important, all enclosed in { }
//
/**
 * Create a CSS style that starts with the given class name, then the element,
 * with an enclosing block that has each of the cssClasses followed by !important;
 * @param cssClass - CSS class name
 * @param element - CSS element
 * @param cssClasses - list of CSS styles to append after the element
 * @returns - the constructed string
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
 * @param  config - configuration that has style and theme settings to use
 * @param graphType - used for checking if classDefs should be applied
 * @param  classDefs - the classDefs in the diagram text. Might be null if none were defined. Usually is the result of a call to getClasses(...)
 * @returns  the string with all the user styles
 */
export const createCssStyles = (
  config: MermaidConfig,
  graphType: string,
  classDefs: Record<string, DiagramStyleClassDef> | null | undefined = {}
): string => {
  let cssStyles = '';

  // user provided theme CSS info
  // If you add more configuration driven data into the user styles make sure that the value is
  // sanitized by the sanitize CSS function TODO where is this method?  what should be used to replace it?  refactor so that it's always sanitized
  if (config.themeCSS !== undefined) {
    cssStyles += `\n${config.themeCSS}`;
  }

  if (config.fontFamily !== undefined) {
    cssStyles += `\n:root { --mermaid-font-family: ${config.fontFamily}}`;
  }
  if (config.altFontFamily !== undefined) {
    cssStyles += `\n:root { --mermaid-alt-font-family: ${config.altFontFamily}}`;
  }

  // classDefs defined in the diagram text
  if (!isEmpty(classDefs) && CLASSDEF_DIAGRAMS.includes(graphType)) {
    const htmlLabels = config.htmlLabels || config.flowchart?.htmlLabels; // TODO why specifically check the Flowchart diagram config?

    const cssHtmlElements = ['> *', 'span']; // TODO make a constant
    const cssShapeElements = ['rect', 'polygon', 'ellipse', 'circle', 'path']; // TODO make a constant

    const cssElements = htmlLabels ? cssHtmlElements : cssShapeElements;

    // create the CSS styles needed for each styleClass definition and css element
    for (const classId in classDefs) {
      const styleClassDef = classDefs[classId];
      // create the css styles for each cssElement and the styles (only if there are styles)
      if (!isEmpty(styleClassDef.styles)) {
        cssElements.forEach((cssElement) => {
          cssStyles += cssImportantStyles(styleClassDef.id, cssElement, styleClassDef.styles);
        });
      }
      // create the css styles for the tspan element and the text styles (only if there are textStyles)
      if (!isEmpty(styleClassDef.textStyles)) {
        cssStyles += cssImportantStyles(styleClassDef.id, 'tspan', styleClassDef.textStyles);
      }
    }
  }
  return cssStyles;
};

export const createUserStyles = (
  config: MermaidConfig,
  graphType: string,
  classDefs: Record<string, DiagramStyleClassDef>,
  svgId: string
): string => {
  const userCSSstyles = createCssStyles(config, graphType, classDefs);
  const allStyles = getStyles(graphType, userCSSstyles, config.themeVariables);

  // Now turn all of the styles into a (compiled) string that starts with the id
  // use the stylis library to compile the css, turn the results into a valid CSS string (serialize(...., stringify))
  // @see https://github.com/thysultan/stylis
  return serialize(compile(`${svgId}{${allStyles}}`), stringify);
};

/**
 * Clean up svgCode. Do replacements needed
 *
 * @param svgCode - the code to clean up
 * @param inSandboxMode - security level
 * @param useArrowMarkerUrls - should arrow marker's use full urls? (vs. just the anchors)
 * @returns the cleaned up svgCode
 */
export const cleanUpSvgCode = (
  svgCode = '',
  inSandboxMode: boolean,
  useArrowMarkerUrls: boolean
): string => {
  let cleanedUpSvg = svgCode;

  // Replace marker-end urls with just the # anchor (remove the preceding part of the URL)
  if (!useArrowMarkerUrls && !inSandboxMode) {
    cleanedUpSvg = cleanedUpSvg.replace(
      /marker-end="url\([\d+./:=?A-Za-z-]*?#/g,
      'marker-end="url(#'
    );
  }

  cleanedUpSvg = decodeEntities(cleanedUpSvg);

  // replace old br tags with newer style
  cleanedUpSvg = cleanedUpSvg.replace(/<br>/g, '<br/>');

  return cleanedUpSvg;
};

/**
 * Put the svgCode into an iFrame. Return the iFrame code
 *
 * @param svgCode - the svg code to put inside the iFrame
 * @param svgElement - the d3 node that has the current svgElement so we can get the height from it
 * @returns  - the code with the iFrame that now contains the svgCode
 * TODO replace btoa(). Replace with  buf.toString('base64')?
 */
export const putIntoIFrame = (svgCode = '', svgElement?: D3Element): string => {
  const height = svgElement?.viewBox?.baseVal?.height
    ? svgElement.viewBox.baseVal.height + 'px'
    : IFRAME_HEIGHT;
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
 * @param parentRoot - the d3 node to append things to
 * @param id - the value to set the id attr to
 * @param enclosingDivId - the id to set the enclosing div to
 * @param divStyle - if given, the style to set the enclosing div to
 * @param svgXlink - if given, the link to set the new svg element to
 * @returns - returns the parentRoot that had nodes appended
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
  if (divStyle) {
    enclosingDiv.attr('style', divStyle);
  }

  const svgNode = enclosingDiv
    .append('svg')
    .attr('id', id)
    .attr('width', '100%')
    .attr('xmlns', XMLNS_SVG_STD);
  if (svgXlink) {
    svgNode.attr('xmlns:xlink', svgXlink);
  }

  svgNode.append('g');
  return parentRoot;
};

/**
 * Append an iFrame node to the given parentNode and set the id, style, and 'sandbox' attributes
 *  Return the appended iframe d3 node
 *
 * @param parentNode - the d3 node to append the iFrame node to
 * @param iFrameId - id to use for the iFrame
 * @returns the appended iframe d3 node
 */
function sandboxedIframe(parentNode: D3Element, iFrameId: string): D3Element {
  return parentNode
    .append('iframe')
    .attr('id', iFrameId)
    .attr('style', 'width: 100%; height: 100%;')
    .attr('sandbox', '');
}

/**
 * Remove any existing elements from the given document
 *
 * @param doc - the document to removed elements from
 * @param id - id for any existing SVG element
 * @param divSelector - selector for any existing enclosing div element
 * @param iFrameSelector - selector for any existing iFrame element
 */
export const removeExistingElements = (
  doc: Document,
  id: string,
  divId: string,
  iFrameId: string
) => {
  // Remove existing SVG element if it exists
  doc.getElementById(id)?.remove();
  // Remove previous temporary element if it exists
  // Both div and iframe needs to be cleared in case there is a config change happening between renders.
  doc.getElementById(divId)?.remove();
  doc.getElementById(iFrameId)?.remove();
};

/**
 * @deprecated - use the `mermaid.render` function instead of `mermaid.mermaidAPI.render`
 *
 * Deprecated for external use.
 */

const render = async function (
  id: string,
  text: string,
  svgContainingElement?: Element
): Promise<RenderResult> {
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
  if (text.length > (config?.maxTextSize ?? MAX_TEXTLENGTH)) {
    text = MAX_TEXTLENGTH_EXCEEDED_MSG;
  }

  // clean up text CRLFs
  text = text.replace(/\r\n?/g, '\n'); // parser problems on CRLF ignore all CR and leave LF;;

  // clean up html tags so that all attributes use single quotes, parser throws error on double quotes
  text = text.replace(
    /<(\w+)([^>]*)>/g,
    (match, tag, attributes) => '<' + tag + attributes.replace(/="([^"]*)"/g, "='$1'") + '>'
  );

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

  if (svgContainingElement !== undefined) {
    if (svgContainingElement) {
      svgContainingElement.innerHTML = '';
    }

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

    // If there is an existing element with the id, we remove it. This likely a previously rendered diagram
    removeExistingElements(document, id, enclosingDivID, iFrameID);

    // Add the temporary div used for rendering with the enclosingDivID.
    // This temporary div will contain a svg with the id == id

    if (isSandboxed) {
      // If we are in sandboxed mode, we do everything mermaid related in a (sandboxed) iFrame
      const iframe = sandboxedIframe(select('body'), iFrameID);
      root = select(iframe.nodes()[0]!.contentDocument!.body);
      root.node().style.margin = 0;
    } else {
      root = select('body');
    }

    appendDivSvgG(root, id, enclosingDivID);
  }

  text = encodeEntities(text);

  // -------------------------------------------------------------------------------
  // Create the diagram

  // Important that we do not create the diagram until after the directives have been included
  let diag: Diagram;
  let parseEncounteredException;

  try {
    diag = await getDiagramFromText(text);
  } catch (error) {
    diag = new Diagram('error').parse();
    parseEncounteredException = error;
  }

  // Get the temporary div element containing the svg
  const element = root.select(enclosingDivID_selector).node();
  const diagramType = diag.type;

  // -------------------------------------------------------------------------------
  // Create and insert the styles (user styles, theme styles, config styles)

  // Insert an element into svg. This is where we put the styles
  const svg = element.firstChild;
  const firstChild = svg.firstChild;
  const diagramClassDefs = CLASSDEF_DIAGRAMS.includes(diagramType)
    ? diag.renderer.getClasses(text, diag)
    : {};

  const rules = createUserStyles(config, diagramType, diagramClassDefs, idSelector);

  const style1 = document.createElement('style');
  style1.innerHTML = rules;
  svg.insertBefore(style1, firstChild);

  // -------------------------------------------------------------------------------
  // Draw the diagram with the renderer
  try {
    await diag.renderer.draw(text, id, version, diag);
  } catch (e) {
    errorRenderer.draw(text, id, version);
    throw e;
  }

  // This is the d3 node for the svg element
  const svgNode = root.select(`${enclosingDivID_selector} svg`);
  const a11yTitle: string | undefined = diag.db.getAccTitle?.();
  const a11yDescr: string | undefined = diag.db.getAccDescription?.();
  addA11yInfo(diagramType, svgNode, a11yTitle, a11yDescr);

  // -------------------------------------------------------------------------------
  // Clean up SVG code
  root.select(`[id="${id}"]`).selectAll('foreignobject > *').attr('xmlns', XMLNS_XHTML_STD);

  // Fix for when the base tag is used
  let svgCode: string = root.select(enclosingDivID_selector).node().innerHTML;

  log.debug('config.arrowMarkerAbsolute', config.arrowMarkerAbsolute);
  svgCode = cleanUpSvgCode(svgCode, isSandboxed, evaluate(config.arrowMarkerAbsolute));

  if (isSandboxed) {
    const svgEl = root.select(enclosingDivID_selector + ' svg').node();
    svgCode = putIntoIFrame(svgCode, svgEl);
  } else if (!isLooseSecurityLevel) {
    // Sanitize the svgCode using DOMPurify
    svgCode = DOMPurify.sanitize(svgCode, {
      ADD_TAGS: DOMPURIFY_TAGS,
      ADD_ATTR: DOMPURIFY_ATTR,
    });
  }

  attachFunctions();

  if (parseEncounteredException) {
    throw parseEncounteredException;
  }

  // -------------------------------------------------------------------------------
  // Remove the temporary HTML element if appropriate
  const tmpElementSelector = isSandboxed ? iFrameID_selector : enclosingDivID_selector;
  const node = select(tmpElementSelector).node();
  if (node && 'remove' in node) {
    node.remove();
  }

  return {
    svg: svgCode,
    bindFunctions: diag.db.bindFunctions,
  };
};

/**
 * @param  options - Initial Mermaid options
 */
function initialize(options: MermaidConfig = {}) {
  // Handle legacy location of font-family configuration
  if (options?.fontFamily && !options.themeVariables?.fontFamily) {
    if (!options.themeVariables) {
      options.themeVariables = {};
    }
    options.themeVariables.fontFamily = options.fontFamily;
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

/**
 * Add accessibility (a11y) information to the diagram.
 *
 * @param diagramType - diagram type
 * @param svgNode - d3 node to insert the a11y title and desc info
 * @param a11yTitle - a11y title
 * @param a11yDescr - a11y description
 */
function addA11yInfo(
  diagramType: string,
  svgNode: D3Element,
  a11yTitle?: string,
  a11yDescr?: string
): void {
  setA11yDiagramInfo(svgNode, diagramType);
  addSVGa11yTitleDescription(svgNode, a11yTitle, a11yDescr, svgNode.attr('id'));
}

/**
 * ## mermaidAPI configuration defaults
 *
 * ```ts
 *   const config = {
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
 *       displayMode: '',
 *     },
 *   };
 *   mermaid.initialize(config);
 * ```
 */

export const mermaidAPI = Object.freeze({
  render,
  parse,
  parseDirective,
  getDiagramFromText,
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
