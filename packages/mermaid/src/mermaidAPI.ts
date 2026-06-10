/**
 * This file contains functions that are used internally by mermaid
 * and is not intended to be used by the end user.
 */
// @ts-ignore TODO: Investigate D3 issue
import { select } from 'd3';
import {
  COMMENT,
  compile,
  KEYFRAMES,
  LAYER,
  MEDIA,
  middleware,
  SCOPE,
  serialize,
  stringify,
  SUPPORTS,
} from 'stylis';
import DOMPurify from 'dompurify';
import { isEmpty } from 'es-toolkit/compat';
import { addSVGa11yTitleDescription, setA11yDiagramInfo } from './accessibility.js';
import assignWithDepth from './assignWithDepth.js';
import * as configApi from './config.js';
import { getEffectiveHtmlLabels } from './config.js';
import type { MermaidConfig } from './config.type.js';
import { detectType, getDiagramLoader } from './diagram-api/detectType.js';
import { addDiagrams } from './diagram-api/diagram-orchestration.js';
import { getDiagram, registerDiagram } from './diagram-api/diagramAPI.js';
import type {
  DiagramDefinition,
  DiagramMetadata,
  DiagramStyleClassDef,
} from './diagram-api/types.js';
import { Diagram } from './Diagram.js';
import { evaluate } from './diagrams/common/common.js';
import errorRenderer from './diagrams/error/errorRenderer.js';
import { UnknownDiagramError } from './errors.js';
import { attachFunctions } from './interactionDb.js';
import { log, setLogLevel } from './logger.js';
import { preprocessDiagram } from './preprocess.js';
import getStyles, { cssStyleSheetToString } from './styles.js';
import theme from './themes/index.js';
import { RenderCoordinator } from './utils/renderCoordinator.js';
import type {
  D3HtmlSelection,
  D3Selection,
  ParseOptions,
  ParseResult,
  RenderResult,
} from './types.js';
import { decodeEntities } from './utils.js';
import { toBase64 } from './utils/base64.js';
import { sanitizeCss } from './utils/sanitizeDirective.js';

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

/**
 * Resource held by every diagram type that has not (yet) been audited for
 * concurrent execution: types with module-scoped (singleton) DBs, the shared
 * legacy `commonDb` accessibility state, or renderer-level module state.
 * All of these are serialized with each other, which matches the behavior the
 * former global execution queue provided.
 */
const LEGACY_STATE_RESOURCE = 'mermaid/legacy-shared-state';

/**
 * Resource representing the module-scoped scratch state of the unified
 * layout/rendering pipeline in `rendering-util` (dagre/ELK cluster
 * bookkeeping, edge-label maps, …). Only one diagram can be drawn through
 * that pipeline at a time.
 */
const LAYOUT_PIPELINE_RESOURCE = 'mermaid/layout-pipeline';

interface DiagramConcurrency {
  /** Resources held for a full render (parse + draw). */
  render: string[];
  /** Resources held while only parsing. */
  parse: string[];
}

/**
 * Concurrency contracts for diagram types that have been audited for
 * concurrent execution.
 *
 * A diagram type may only be listed here when:
 * - its {@link DiagramDefinition.db} is instantiated per render (the `get db()`
 *   pattern), including instance-scoped accessibility state ({@link CommonDB}),
 * - its parser populates the per-render db (JISON's synchronous `yy` wiring, or
 *   a langium parser that captures `parser.parser.yy` before its first `await`),
 * - its renderer — and any layout algorithm it uses — keeps no cross-render
 *   module state, or every such state is declared below as a named resource.
 *
 * Types not listed here are conservatively serialized via
 * {@link LEGACY_STATE_RESOURCE} (and {@link LAYOUT_PIPELINE_RESOURCE} while
 * rendering), but still run concurrently with audited types.
 */
const AUDITED_DIAGRAM_CONCURRENCY: Record<string, DiagramConcurrency> = {
  // Per-render PieDB; the renderer is plain d3 scoped to the diagram's own SVG.
  pie: { render: [], parse: [] },
  // Per-render SequenceDB; the renderer keeps its layout bounds in module
  // scope, so only one sequence diagram can draw at a time.
  sequence: { render: ['mermaid/diagram-sequence'], parse: [] },
  // Per-render FlowDB; drawing goes through the unified layout pipeline.
  flowchart: { render: [LAYOUT_PIPELINE_RESOURCE], parse: [] },
  'flowchart-v2': { render: [LAYOUT_PIPELINE_RESOURCE], parse: [] },
  // The built-in error diagram has a stateless renderer and no db.
  error: { render: [], parse: [] },
};

const DEFAULT_DIAGRAM_CONCURRENCY: DiagramConcurrency = {
  render: [LEGACY_STATE_RESOURCE, LAYOUT_PIPELINE_RESOURCE],
  parse: [LEGACY_STATE_RESOURCE],
};

const getDiagramConcurrency = (type: string): DiagramConcurrency =>
  AUDITED_DIAGRAM_CONCURRENCY[type] ?? DEFAULT_DIAGRAM_CONCURRENCY;

/**
 * Admits render/parse jobs so that only compatible jobs run concurrently.
 * @see {@link RenderCoordinator}
 */
const coordinator = new RenderCoordinator();

/** In-flight lazy diagram-definition loads, deduplicated per type. */
const diagramLoadPromises = new Map<string, Promise<void>>();

/**
 * Makes sure the diagram definition for `type` is registered, lazy-loading it
 * if necessary. Concurrent loads of the same type share one loader call.
 */
const ensureDiagramIsLoaded = async (type: string): Promise<void> => {
  try {
    getDiagram(type);
    return;
  } catch {
    // Not registered yet, load it below.
  }
  let loading = diagramLoadPromises.get(type);
  if (!loading) {
    const loader = getDiagramLoader(type);
    if (!loader) {
      throw new UnknownDiagramError(`Diagram ${type} not found.`);
    }
    loading = (async () => {
      try {
        const { id, diagram } = await loader();
        registerDiagram(id, diagram);
      } finally {
        diagramLoadPromises.delete(type);
      }
    })();
    diagramLoadPromises.set(type, loading);
  }
  await loading;
};

interface PreparedJob {
  /** Preprocessed diagram code (cleaned up, frontmatter and directives extracted). */
  code: string;
  /** Diagram title from the frontmatter, if any. */
  title?: string;
  /**
   * The diagram's own configuration (frontmatter config merged with init
   * directives). Replayed into the global config state when the job runs.
   */
  diagramConfig: MermaidConfig;
  /**
   * Admission key for the coordinator: the fully resolved configuration state
   * this job will run under, including the effects of the diagram's `init()`.
   */
  configKey: unknown;
  /** Resource locks for this job's diagram type. */
  concurrency: DiagramConcurrency;
  /**
   * Failure from detecting or loading the diagram type. Not thrown here, so
   * that rendering can produce the error diagram via its usual path.
   */
  detectError?: unknown;
}

/**
 * Performs all the preparation a render/parse job needs before it can be
 * admitted by the coordinator: preprocessing, computing the effective
 * configuration (without touching global state) and loading the diagram
 * definition.
 */
const prepareJob = async (
  text: string,
  { limitTextSize }: { limitTextSize: boolean }
): Promise<PreparedJob> => {
  addDiagrams();
  const processed = preprocessDiagram(text);
  const diagramConfig = processed.config ?? {};

  // Resolve the configuration exactly as applying the diagram's directives
  // would, but against a scratch copy, so the configuration that concurrently
  // running jobs observe is never disturbed.
  const preInitKey = configApi.evaluateConfigInIsolation(() => {
    configApi.reset();
    configApi.addDirective(diagramConfig);
    return {
      config: configApi.getConfig(),
      userDefined: configApi.getUserDefinedConfig(),
    };
  });

  let code = processed.code;
  if (limitTextSize && code.length > (preInitKey.config?.maxTextSize ?? MAX_TEXTLENGTH)) {
    code = MAX_TEXTLENGTH_EXCEEDED_MSG;
  }

  let definition: DiagramDefinition | undefined;
  let type: string | undefined;
  let detectError: unknown;
  try {
    type = detectType(code, preInitKey.config);
    await ensureDiagramIsLoaded(type);
    definition = getDiagram(type);
  } catch (error) {
    detectError = error;
  }

  if (definition === undefined || type === undefined) {
    // The job will fail in `Diagram.fromText` and (for renders) produce the
    // error diagram, which touches no shared diagram state.
    return {
      code,
      title: processed.title,
      diagramConfig,
      configKey: preInitKey,
      concurrency: getDiagramConcurrency('error'),
      detectError,
    };
  }

  // `init()` may adjust the global config (e.g. the flowchart init sets
  // `layout`), so simulate it on the scratch copy to get the configuration
  // state the job will actually run under.
  const loadedDefinition = definition;
  const configKey = configApi.evaluateConfigInIsolation(() => {
    configApi.reset();
    configApi.addDirective(diagramConfig);
    loadedDefinition.init?.(configApi.getConfig());
    return {
      config: configApi.getConfig(),
      userDefined: configApi.getUserDefinedConfig(),
    };
  });

  return {
    code,
    title: processed.title,
    diagramConfig,
    configKey,
    concurrency: getDiagramConcurrency(type),
  };
};

/**
 * Re-applies a prepared job's configuration to the global config state.
 *
 * The coordinator only admits jobs concurrently when their resolved
 * configuration is identical, so replaying never disturbs other running jobs.
 *
 * IMPORTANT: the caller must reach the diagram's `init()` (run inside
 * `Diagram.fromText`) without an intervening `await`, so concurrent jobs can
 * never observe a half-applied configuration at a yield point.
 */
const replayJobConfig = (job: PreparedJob): void => {
  configApi.reset();
  configApi.addDirective(job.diagramConfig);
};

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
    const job = await prepareJob(text, { limitTextSize: false });
    if (job.detectError) {
      throw job.detectError;
    }
    const releaseSlot = await coordinator.acquire({
      configKey: job.configKey,
      resources: job.concurrency.parse,
    });
    try {
      replayJobConfig(job);
      const diagram = await Diagram.fromText(job.code);
      return { diagramType: diagram.type, config: job.diagramConfig };
    } finally {
      releaseSlot();
    }
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
  const declarationBlock = sanitizeCss(`{ ${cssClasses.join(' !important; ')} !important; }`);
  return `.${cssClass} ${element} ${declarationBlock}`;
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
  const cssStyles = new CSSStyleSheet();

  // user provided theme CSS info
  // If you add more configuration driven data into the user styles make sure that the value is
  // sanitized by the sanitize CSS function TODO where is this method?  what should be used to replace it?  refactor so that it's always sanitized
  if (config.fontFamily !== undefined) {
    cssStyles.insertRule(
      `:root { --mermaid-font-family: ${config.fontFamily}}`,
      cssStyles.cssRules.length
    );
  }
  if (config.altFontFamily !== undefined) {
    cssStyles.insertRule(
      `:root { --mermaid-alt-font-family: ${config.altFontFamily}}`,
      cssStyles.cssRules.length
    );
  }

  // classDefs defined in the diagram text
  if (classDefs instanceof Map) {
    const htmlLabels = getEffectiveHtmlLabels(config);

    const cssHtmlElements = ['> *', 'span']; // TODO make a constant
    const cssShapeElements = ['rect', 'polygon', 'ellipse', 'circle', 'path']; // TODO make a constant

    const cssElements = htmlLabels ? cssHtmlElements : cssShapeElements;

    // create the CSS styles needed for each styleClass definition and css element
    classDefs.forEach((styleClassDef) => {
      // create the css styles for each cssElement and the styles (only if there are styles)
      if (!isEmpty(styleClassDef.styles)) {
        cssElements.forEach((cssElement) => {
          cssStyles.insertRule(
            cssImportantStyles(styleClassDef.id, cssElement, styleClassDef.styles),
            cssStyles.cssRules.length
          );
        });
      }
      // create the css styles for the tspan element and the text styles (only if there are textStyles)
      if (!isEmpty(styleClassDef.textStyles)) {
        cssStyles.insertRule(
          cssImportantStyles(
            styleClassDef.id,
            'tspan',
            (styleClassDef?.textStyles || []).map((s) => s.replace('color', 'fill'))
          ),
          cssStyles.cssRules.length
        );
      }
    });
  }

  let cssString = '';
  if (config.themeCSS !== undefined) {
    if (typeof cssStyles.replaceSync === 'function') {
      const themeCssStyleSheet = new CSSStyleSheet();
      themeCssStyleSheet.replaceSync(config.themeCSS);
      cssString = cssStyleSheetToString(themeCssStyleSheet) + '\n';
    } else {
      /**
       * Ideally we'd do a `CSSStyleSheet.replaceSync`, but it's not supported
       * in some older browsers and in JSDOM.
       */
      cssString += `${config.themeCSS}\n`;
    }
  }

  return cssString + cssStyleSheetToString(cssStyles);
};

/**
 * Use `stylis` to compile the CSS to only apply to the given namespace.
 *
 * This will also remove some newer CSS features (e.g. nesting) to better
 * support older browsers and does some minification. It also removes some
 * at-rules that can't be namespaced.
 *
 * @internal
 * @param namespace - the namespace to add in front of all the CSS styles, e.g. `#idOfSvgElement`
 * @param css - the CSS styles to add the namespace to.
 * @see https://github.com/thysultan/stylis
 *
 * @example
 * // Returns `#id .class1{fill:red;}`
 * compileCSS('#id', `.class1 { fill: red }`)
 */
const compileCSS = (namespace: `#${string}`, css: string) => {
  return serialize(
    compile(`${namespace}{${css}}`),
    middleware([
      function addNamespace(element, _index, _children, _callback) {
        /**
         * CSS normally automatically adds the `&` selector in front of each
         * element. But, if there's already an `&` selector, it doesn't add this.
         *
         * This code will explicitly make sure it's always added, to ensure
         * that the CSS never applies outside the SVG.
         *
         * E.g. `#svgId { .nested-class :not(&) { fill: red } }` will be
         * transformed to `#svgId { & .nested-class :not(&) { fill: red } }`
         */
        if (element.type === 'rule' && Array.isArray(element.props)) {
          if (element.parent && element.parent.type === KEYFRAMES) {
            /**
             * Don't namespace CSSKeyframeRule, since they don't have selectors.
             */
            return;
          }
          element.props = element.props.map((prop) => {
            if (!prop.startsWith(namespace)) {
              return `${namespace} ${prop}`;
            }
            return prop;
          });
        } else if (element.type.startsWith('@')) {
          // Only allow certain at-rules to avoid namespace escape.
          //
          // Nested ones are allowed, since they'd get namespaced appropriately.
          // @keyframes are required for Mermaid's animation features, even
          // if they can potentially pollute the page.

          /**
           * At-rules that contain nested rules.
           *
           * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@container}
           */
          const nestedAtRules = [
            MEDIA,
            SUPPORTS,
            LAYER,
            SCOPE,
            '@container',
            '@starting-style',
          ] as const;
          const allowedAtRules = [
            ...nestedAtRules,
            KEYFRAMES, // needed for Mermaid's animation feature
          ] as const;
          if (!allowedAtRules.includes(element.type as (typeof allowedAtRules)[number])) {
            log.warn(`Removing unsupported at-rule ${element.type} from CSS`);
            element.type = COMMENT;
          }
        }
      },
      stringify,
    ])
  );
};

export const createUserStyles = (
  config: MermaidConfig,
  graphType: string,
  classDefs: Map<string, DiagramStyleClassDef> | undefined,
  // CSS selector for the SVG element, e.g. `#idOfSvgElement`
  svgId: `#${string}`
): string => {
  const userCSSstyles = createCssStyles(config, classDefs);
  const allStyles = getStyles(
    graphType,
    userCSSstyles,
    { ...config.themeVariables, theme: config.theme, look: config.look },
    svgId
  );
  return compileCSS(svgId, allStyles);
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
export const putIntoIFrame = (svgCode = '', svgElement?: SVGSVGElement): string => {
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
  parentRoot: D3HtmlSelection<HTMLElement> | D3HtmlSelection<Element>,
  id: string,
  enclosingDivId: string,
  divStyle?: string,
  svgXlink?: string
) => {
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
function sandboxedIframe(
  parentNode: D3HtmlSelection<Element> | D3HtmlSelection<HTMLElement>,
  iFrameId: string
) {
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
  const job = await prepareJob(text, { limitTextSize: true });
  const releaseSlot = await coordinator.acquire({
    configKey: job.configKey,
    resources: job.concurrency.render,
  });
  try {
    return await performRender(id, job, svgContainingElement);
  } finally {
    releaseSlot();
  }
};

/**
 * Runs the actual render pipeline for an admitted job.
 */
const performRender = async function (
  id: string,
  job: PreparedJob,
  svgContainingElement?: Element
): Promise<RenderResult> {
  replayJobConfig(job);
  const text = job.code;

  const config = configApi.getConfig();
  log.debug(config);

  const idSelector = `#${id}` as const;
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

  let root: D3HtmlSelection<HTMLElement> | D3HtmlSelection<Element> = select(document.body);

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
      root = select(iframe.nodes()[0].contentDocument!.body);
      root.node()!.style.margin = '0';
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
      const iframe = sandboxedIframe(select(document.body), iFrameID);
      root = select(iframe.nodes()[0].contentDocument!.body);
      root.node()!.style.margin = '0';
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
    if (job.detectError) {
      // Detecting/loading the diagram type already failed during preparation.
      // Don't let `Diagram.fromText` retry: this job was admitted with the
      // error diagram's resource locks, not those of a real diagram type.
      throw job.detectError;
    }
    diag = await Diagram.fromText(text, { title: job.title });
  } catch (error) {
    if (config.suppressErrorRendering) {
      removeTempElements();
      throw error;
    }
    diag = await Diagram.fromText('error');
    parseEncounteredException = error;
  }

  // Get the temporary div element containing the svg
  const element = root.select<HTMLDivElement>(enclosingDivID_selector).node()!;
  const diagramType = diag.type;

  // -------------------------------------------------------------------------------
  // Create and insert the styles (user styles, theme styles, config styles)

  // Insert an element into svg. This is where we put the styles
  const svg = element.firstChild!;
  const firstChild = svg.firstChild;
  const diagramClassDefs = diag.renderer.getClasses?.(text, diag);

  const rules = createUserStyles(config, diagramType, diagramClassDefs, idSelector);

  const style1 = document.createElement('style');
  style1.innerHTML = rules;
  svg.insertBefore(style1, firstChild);

  // -------------------------------------------------------------------------------
  // Draw the diagram with the renderer
  try {
    await diag.renderer.draw(text, id, injected.version, diag);
  } catch (e) {
    if (config.suppressErrorRendering) {
      removeTempElements();
    } else {
      errorRenderer.draw(text, id, injected.version);
    }
    throw e;
  }

  // This is the d3 node for the svg element
  const svgNode = root.select<SVGSVGElement>(`${enclosingDivID_selector} svg`);
  const a11yTitle: string | undefined = diag.db.getAccTitle?.();
  const a11yDescr: string | undefined = diag.db.getAccDescription?.();
  addA11yInfo(diagramType, svgNode, a11yTitle, a11yDescr);
  // -------------------------------------------------------------------------------
  // Clean up SVG code
  root.select(`[id="${id}"]`).selectAll('foreignobject > *').attr('xmlns', XMLNS_XHTML_STD);

  // Fix for when the base tag is used
  let svgCode: string = root.select<HTMLDivElement>(enclosingDivID_selector).node()!.innerHTML;

  log.debug('config.arrowMarkerAbsolute', config.arrowMarkerAbsolute);
  svgCode = cleanUpSvgCode(svgCode, isSandboxed, evaluate(config.arrowMarkerAbsolute));

  if (isSandboxed) {
    const svgEl = root.select<SVGSVGElement>(enclosingDivID_selector + ' svg').node()!;
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
  svgNode: D3Selection<SVGSVGElement>,
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
