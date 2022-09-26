/**
 * Web page integration module for the mermaid framework. It uses the mermaidAPI for mermaid
 * functionality and to render the diagrams to svg code!
 */
import { MermaidConfig } from './config.type';
import { log } from './logger';
import utils from './utils';
import { mermaidAPI } from './mermaidAPI';
import { addDetector } from './diagram-api/detectType';
import {
  registerDiagram,
  DiagramDefinition,
  setLogLevel,
  getConfig,
  setupGraphViewbox,
  sanitizeText,
} from './diagram-api/diagramAPI';
import { isDetailedError } from './utils';

/**
 * ## init
 *
 * Function that goes through the document to find the chart definitions in there and render them.
 *
 * The function tags the processed attributes with the attribute data-processed and ignores found
 * elements with the attribute already set. This way the init function can be triggered several
 * times.
 *
 * Optionally, `init` can accept in the second argument one of the following:
 *
 * - A DOM Node
 * - An array of DOM nodes (as would come from a jQuery selector)
 * - A W3C selector, a la `.mermaid`
 *
 * ```mermaid
 * graph LR;
 *  a(Find elements)-->b{Processed}
 *  b-->|Yes|c(Leave element)
 *  b-->|No |d(Transform)
 * ```
 *
 * Renders the mermaid diagrams
 *
 * @param config
 * @param nodes
 * @param callback
 */
const init = function (
  config?: MermaidConfig,
  // eslint-disable-next-line no-undef
  nodes?: string | HTMLElement | NodeListOf<HTMLElement>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback?: Function
) {
  try {
    log.info('Detectors in init', mermaid.detectors); // eslint-disable-line
    mermaid.detectors.forEach(({ id, detector }) => {
      addDetector(id, detector);
    });
    initThrowsErrors(config, nodes, callback);
  } catch (e) {
    log.warn('Syntax Error rendering');
    if (isDetailedError(e)) {
      log.warn(e.str);
    }
    if (mermaid.parseError) {
      mermaid.parseError(e);
    }
  }
};

const initThrowsErrors = function (
  config?: MermaidConfig,
  // eslint-disable-next-line no-undef
  nodes?: string | HTMLElement | NodeListOf<HTMLElement>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback?: Function
) {
  const conf = mermaidAPI.getConfig();
  // console.log('Starting rendering diagrams (init) - mermaid.init', conf);
  if (config) {
    // This is a legacy way of setting config. It is not documented and should be removed in the future.
    // @ts-ignore: TODO Fix ts errors
    mermaid.sequenceConfig = config;
  }

  // if last argument is a function this is the callback function
  log.debug(`${!callback ? 'No ' : ''}Callback function found`);
  let nodesToProcess: ArrayLike<HTMLElement>;
  if (typeof nodes === 'undefined') {
    nodesToProcess = document.querySelectorAll('.mermaid');
  } else if (typeof nodes === 'string') {
    nodesToProcess = document.querySelectorAll(nodes);
  } else if (nodes instanceof HTMLElement) {
    nodesToProcess = [nodes];
  } else if (nodes instanceof NodeList) {
    nodesToProcess = nodes;
  } else {
    throw new Error('Invalid argument nodes for mermaid.init');
  }

  log.debug(`Found ${nodesToProcess.length} diagrams`);
  if (typeof config?.startOnLoad !== 'undefined') {
    log.debug('Start On Load: ' + config?.startOnLoad);
    mermaidAPI.updateSiteConfig({ startOnLoad: config?.startOnLoad });
  }

  const idGenerator = new utils.initIdGenerator(conf.deterministicIds, conf.deterministicIDSeed);

  let txt;
  const errors = [];

  // element is the current div with mermaid class
  for (const element of Array.from(nodesToProcess)) {
    log.info('Rendering diagram: ' + element.id);
    /*! Check if previously processed */
    if (element.getAttribute('data-processed')) {
      continue;
    }
    element.setAttribute('data-processed', 'true');

    const id = `mermaid-${idGenerator.next()}`;

    // Fetch the graph definition including tags
    txt = element.innerHTML;

    // transforms the html to pure text
    txt = utils
      .entityDecode(txt)
      .trim()
      .replace(/<br\s*\/?>/gi, '<br/>');

    const init = utils.detectInit(txt);
    if (init) {
      log.debug('Detected early reinit: ', init);
    }
    try {
      mermaidAPI.render(
        id,
        txt,
        (svgCode: string, bindFunctions?: (el: Element) => void) => {
          element.innerHTML = svgCode;
          if (typeof callback !== 'undefined') {
            callback(id);
          }
          if (bindFunctions) bindFunctions(element);
        },
        element
      );
    } catch (error) {
      log.warn('Catching Error (bootstrap)', error);
      // @ts-ignore: TODO Fix ts errors
      const mermaidError = { error, str: error.str, hash: error.hash, message: error.str };
      if (typeof mermaid.parseError === 'function') {
        mermaid.parseError(mermaidError);
      }
      errors.push(mermaidError);
    }
  }
  if (errors.length > 0) {
    // TODO: We should be throwing an error object.
    throw errors[0];
  }
};

const initialize = function (config: MermaidConfig) {
  mermaidAPI.initialize(config);
};

/**
 * ##contentLoaded Callback function that is called when page is loaded. This functions fetches
 * configuration for mermaid rendering and calls init for rendering the mermaid diagrams on the
 * page.
 */
const contentLoaded = function () {
  if (mermaid.startOnLoad) {
    const { startOnLoad } = mermaidAPI.getConfig();
    if (startOnLoad) {
      mermaid.init();
    }
  }
};

if (typeof document !== 'undefined') {
  /*!
   * Wait for document loaded before starting the execution
   */
  window.addEventListener('load', contentLoaded, false);
}

/**
 * ## setParseErrorHandler  Alternative to directly setting parseError using:
 *
 * ```js
 * mermaid.parseError = function(err,hash){=
 *   forExampleDisplayErrorInGui(err);  // do something with the error
 * };
 * ```
 *
 * This is provided for environments where the mermaid object can't directly have a new member added
 * to it (eg. dart interop wrapper). (Initially there is no parseError member of mermaid).
 *
 * @param {function (err, hash)} newParseErrorHandler New parseError() callback.
 */
const setParseErrorHandler = function (newParseErrorHandler: (err: any, hash: any) => void) {
  mermaid.parseError = newParseErrorHandler;
};

const parse = (txt: string) => {
  return mermaidAPI.parse(txt, mermaid.parseError);
};

const connectDiagram = (
  id: string,
  diagram: DiagramDefinition,
  callback: (
    _log: any,
    _setLogLevel: any,
    _getConfig: any,
    _sanitizeText: any,
    _setupGraphViewbox: any
  ) => void
) => {
  registerDiagram(id, diagram, callback);
  // Todo move this connect call to after the diagram is actually loaded
  callback(log, setLogLevel, getConfig, sanitizeText, setupGraphViewbox);
};

const mermaid: {
  startOnLoad: boolean;
  diagrams: any;
  // eslint-disable-next-line @typescript-eslint/ban-types
  parseError?: Function;
  mermaidAPI: typeof mermaidAPI;
  parse: typeof parse;
  render: typeof mermaidAPI.render;
  init: typeof init;
  initThrowsErrors: typeof initThrowsErrors;
  initialize: typeof initialize;
  contentLoaded: typeof contentLoaded;
  setParseErrorHandler: typeof setParseErrorHandler;
  // Array of functions to use for detecting diagram types
  detectors: Array<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  connectDiagram: (id: string, diagram: DiagramDefinition, callback: (id: string) => void) => void;
} = {
  startOnLoad: true,
  diagrams: {},
  mermaidAPI,
  parse,
  render: mermaidAPI.render,
  init,
  initThrowsErrors,
  initialize,
  parseError: undefined,
  contentLoaded,
  setParseErrorHandler,
  detectors: [],
  connectDiagram: connectDiagram,
};

export default mermaid;
