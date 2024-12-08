/**
 * This file contains functions that are used internally by mermaid
 * and is not intended to be used by the end user.
 */
// @ts-ignore TODO: Investigate D3 issue
import { select } from 'd3';
import { compile, serialize, stringify } from 'stylis';
// @ts-ignore: TODO Fix ts errors
import DOMPurify from 'dompurify';
import isEmpty from 'lodash-es/isEmpty.js';
import { version } from '../package.json';
import { addSVGa11yTitleDescription, setA11yDiagramInfo } from './accessibility.js';
import assignWithDepth from './assignWithDepth.js';
import * as configApi from './config.js';
import type { MermaidConfig } from './config.type.js';
import { addDiagrams } from './diagram-api/diagram-orchestration.js';
import type { DiagramMetadata, DiagramStyleClassDef } from './diagram-api/types.js';
import { Diagram } from './Diagram.js';
import { evaluate } from './diagrams/common/common.js';
import errorRenderer from './diagrams/error/errorRenderer.js';
import { attachFunctions } from './interactionDb.js';
import { log, setLogLevel } from './logger.js';
import { preprocessDiagram } from './preprocess.js';
import getStyles from './styles.js';
import theme from './themes/index.js';
import type { D3Element, ParseOptions, ParseResult, RenderResult } from './types.js';
import { decodeEntities } from './utils.js';
import { toBase64 } from './utils/base64.js';

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

function processAndSetConfigs(text: string) {
  const processed = preprocessDiagram(text);
  configApi.reset();
  configApi.addDirective(processed.config ?? {});
  return processed;
}

/**
 * Parse the text and validate the syntax.
 * @param text - The mermaid diagram definition.
 * @param parseOptions - Options for parsing. @see {@link ParseOptions}
 * @returns An object with the `diagramType` set to type of the diagram if valid. Otherwise `false` if parseOptions.suppressErrors is `true`.
 * @throws Error if the diagram is invalid and parseOptions.suppressErrors is false or not set.
 */
async function parse(
  text: string,
  parseOptions: ParseOptions & { suppressErrors: true }
): Promise<ParseResult | false>;
async function parse(text: string, parseOptions?: ParseOptions): Promise<ParseResult>;
async function parse(text: string, parseOptions?: ParseOptions): Promise<ParseResult | false> {
  addDiagrams();
  try {
    const { code, config } = processAndSetConfigs(text);
    const diagram = await getDiagramFromText(code);
    return { diagramType: diagram.type, config };
  } catch (error) {
    if (parseOptions?.suppressErrors) {
      return false;
    }
    throw error;
  }
}

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
 * @internal
 * @param  config - configuration that has style and theme settings to use
 * @param  classDefs - the classDefs in the diagram text. Might be null if none were defined. Usually is the result of a call to getClasses(...)
 * @returns  the string with all the user styles
 */
export const createCssStyles = (
  config: MermaidConfig,
  classDefs: Map<string, DiagramStyleClassDef> | null | undefined = new Map()
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
  if (classDefs instanceof Map) {
    const htmlLabels = config.htmlLabels ?? config.flowchart?.htmlLabels; // TODO why specifically check the Flowchart diagram config?

    const cssHtmlElements = ['> *', 'span']; // TODO make a constant
    const cssShapeElements = ['rect', 'polygon', 'ellipse', 'circle', 'path']; // TODO make a constant

    const cssElements = htmlLabels ? cssHtmlElements : cssShapeElements;

    // create the CSS styles needed for each styleClass definition and css element
    classDefs.forEach((styleClassDef) => {
      // create the css styles for each cssElement and the styles (only if there are styles)
      if (!isEmpty(styleClassDef.styles)) {
        cssElements.forEach((cssElement) => {
          cssStyles += cssImportantStyles(styleClassDef.id, cssElement, styleClassDef.styles);
        });
      }
      // create the css styles for the tspan element and the text styles (only if there are textStyles)
      if (!isEmpty(styleClassDef.textStyles)) {
        cssStyles += cssImportantStyles(
          styleClassDef.id,
          'tspan',
          (styleClassDef?.textStyles || []).map((s) => s.replace('color', 'fill'))
        );
      }
    });
  }
  return cssStyles;
};

export const createUserStyles = (
  config: MermaidConfig,
  graphType: string,
  classDefs: Map<string, DiagramStyleClassDef> | undefined,
  svgId: string
): string => {
  const userCSSstyles = createCssStyles(config, classDefs);
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
 */
export const putIntoIFrame = (svgCode = '', svgElement?: D3Element): string => {
  const height = svgElement?.viewBox?.baseVal?.height
    ? svgElement.viewBox.baseVal.height + 'px'
    : IFRAME_HEIGHT;
  const base64encodedSrc = toBase64(`<body style="${IFRAME_BODY_STYLE}">${svgCode}</body>`);
  return `<iframe style="width:${IFRAME_WIDTH};height:${height};${IFRAME_STYLES}" src="data:text/html;charset=UTF-8;base64,${base64encodedSrc}" sandbox="${IFRAME_SANDBOX_OPTS}">
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

  const processed = processAndSetConfigs(text);
  text = processed.code;

  const config = configApi.getConfig();
  log.debug(config);

  // Check the maximum allowed text size
  if (text.length > (config?.maxTextSize ?? MAX_TEXTLENGTH)) {
    text = MAX_TEXTLENGTH_EXCEEDED_MSG;
  }

  const idSelector = '#' + id;
  const iFrameID = 'i' + id;
  const iFrameID_selector = '#' + iFrameID;
  const enclosingDivID = 'd' + id;
  const enclosingDivID_selector = '#' + enclosingDivID;

  const removeTempElements = () => {
    // -------------------------------------------------------------------------------
    // Remove the temporary HTML element if appropriate
    const tmpElementSelector = isSandboxed ? iFrameID_selector : enclosingDivID_selector;
    const node = select(tmpElementSelector).node();
    if (node && 'remove' in node) {
      node.remove();
    }
  };

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

  // -------------------------------------------------------------------------------
  // Create the diagram

  // Important that we do not create the diagram until after the directives have been included
  let diag: Diagram;
  let parseEncounteredException;

  try {
    diag = await Diagram.fromText(text, { title: processed.title });
  } catch (error) {
    if (config.suppressErrorRendering) {
      removeTempElements();
      throw error;
    }
    diag = await Diagram.fromText('error');
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
  const diagramClassDefs = diag.renderer.getClasses?.(text, diag);

  const rules = createUserStyles(config, diagramType, diagramClassDefs, idSelector);

  const style1 = document.createElement('style');
  style1.innerHTML = rules;
  svg.insertBefore(style1, firstChild);

  // -------------------------------------------------------------------------------
  // Draw the diagram with the renderer
  try {
    await diag.renderer.draw(text, id, version, diag);
  } catch (e) {
    if (config.suppressErrorRendering) {
      removeTempElements();
    } else {
      errorRenderer.draw(text, id, version);
    }
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
      HTML_INTEGRATION_POINTS: { foreignobject: true },
    });
  }

  attachFunctions();

  if (parseEncounteredException) {
    throw parseEncounteredException;
  }

  removeTempElements();

  return {
    diagramType,
    svg: svgCode,
    bindFunctions: diag.db.bindFunctions,
  };
};

/**
 * @param  userOptions - Initial Mermaid options
 */
function initialize(userOptions: MermaidConfig = {}) {
  const options: MermaidConfig = assignWithDepth({}, userOptions);
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

const getDiagramFromText = (text: string, metadata: Pick<DiagramMetadata, 'title'> = {}) => {
  const { code } = preprocessDiagram(text);
  return Diagram.fromText(code, metadata);
};

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
 * @internal - Use mermaid.function instead of mermaid.mermaidAPI.function
 */
export const mermaidAPI = Object.freeze({
  render,
  parse,
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
