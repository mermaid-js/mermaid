/**
 * Web page integration module for the mermaid framework. It uses the mermaidAPI for mermaid
 * functionality and to render the diagrams to svg code!
 */
import dedent from 'ts-dedent';

import { MermaidConfig } from './config.type';
import { log } from './logger';
import utils from './utils';
import { mermaidAPI } from './mermaidAPI';
import { registerLazyLoadedDiagrams } from './diagram-api/detectType';
import type { ParseErrorFunction } from './Diagram';
import { isDetailedError } from './utils';
import type { DetailedError } from './utils';
import { registerDiagram } from './diagram-api/diagramAPI';
import { ExternalDiagramDefinition } from './diagram-api/types';

export type { MermaidConfig, DetailedError, ExternalDiagramDefinition, ParseErrorFunction };

/**
 * ## init
 *
 * Function that goes through the document to find the chart definitions in there and render them.
 *
 * The function tags the processed attributes with the attribute data-processed and ignores found
 * elements with the attribute already set. This way the init function can be triggered several
 * times.
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
 * @param config - **Deprecated**, please set configuration in {@link initialize}.
 * @param nodes - **Default**: `.mermaid`. One of the following:
 * - A DOM Node
 * - An array of DOM nodes (as would come from a jQuery selector)
 * - A W3C selector, a la `.mermaid`
 * @param callback - Called once for each rendered diagram's id.
 */
const init = async function (
  config?: MermaidConfig,
  // eslint-disable-next-line no-undef
  nodes?: string | HTMLElement | NodeListOf<HTMLElement>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback?: Function
) {
  try {
    await initThrowsErrorsAsync(config, nodes, callback);
  } catch (e) {
    log.warn('Syntax Error rendering');
    if (isDetailedError(e)) {
      log.warn(e.str);
    }
    if (mermaid.parseError) {
      mermaid.parseError(e as string);
    }
  }
};

const handleError = (error: unknown, errors: DetailedError[], parseError?: ParseErrorFunction) => {
  log.warn(error);
  if (isDetailedError(error)) {
    // handle case where error string and hash were
    // wrapped in object like`const error = { str, hash };`
    if (parseError) {
      parseError(error.str, error.hash);
    }
    errors.push({ ...error, message: error.str, error });
  } else {
    // assume it is just error string and pass it on
    if (parseError) {
      parseError(error);
    }
    if (error instanceof Error) {
      errors.push({
        str: error.message,
        message: error.message,
        hash: error.name,
        error,
      });
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
  if (config) {
    // This is a legacy way of setting config. It is not documented and should be removed in the future.
    // @ts-ignore: TODO Fix ts errors
    mermaid.sequenceConfig = config;
  }

  // if last argument is a function this is the callback function
  log.debug(`${!callback ? 'No ' : ''}Callback function found`);
  let nodesToProcess: ArrayLike<HTMLElement>;
  if (nodes === undefined) {
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
  if (config?.startOnLoad !== undefined) {
    log.debug('Start On Load: ' + config?.startOnLoad);
    mermaidAPI.updateSiteConfig({ startOnLoad: config?.startOnLoad });
  }

  // generate the id of the diagram
  const idGenerator = new utils.initIdGenerator(conf.deterministicIds, conf.deterministicIDSeed);

  let txt: string;
  const errors: DetailedError[] = [];

  // element is the current div with mermaid class
  // eslint-disable-next-line unicorn/prefer-spread
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
    txt = dedent(utils.entityDecode(txt)) // removes indentation, required for YAML parsing
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
          if (callback !== undefined) {
            callback(id);
          }
          if (bindFunctions) {
            bindFunctions(element);
          }
        },
        element
      );
    } catch (error) {
      handleError(error, errors, mermaid.parseError);
    }
  }
  if (errors.length > 0) {
    // TODO: We should be throwing an error object.
    throw errors[0];
  }
};

/**
 * This is an internal function and should not be made public, as it will likely change.
 * @internal
 * @param diagrams - Array of {@link ExternalDiagramDefinition}.
 */
const loadExternalDiagrams = async (...diagrams: ExternalDiagramDefinition[]) => {
  log.debug(`Loading ${diagrams.length} external diagrams`);
  // Load all lazy loaded diagrams in parallel
  const results = await Promise.allSettled(
    diagrams.map(async ({ id, detector, loader }) => {
      const { diagram } = await loader();
      registerDiagram(id, diagram, detector);
    })
  );
  const failed = results.filter((result) => result.status === 'rejected');
  if (failed.length > 0) {
    log.error(`Failed to load ${failed.length} external diagrams`);
    for (const res of failed) {
      log.error(res);
    }
    throw new Error(`Failed to load ${failed.length} external diagrams`);
  }
};

/**
 * Equivalent to {@link init}, except an error will be thrown on error.
 *
 * @alpha
 * @deprecated This is an internal function and will very likely be modified in v10, or earlier.
 * We recommend staying with {@link initThrowsErrors} if you don't need `lazyLoadedDiagrams`.
 *
 * @param config - **Deprecated** Mermaid sequenceConfig.
 * @param nodes - One of:
 * - A DOM Node
 * - An array of DOM nodes (as would come from a jQuery selector)
 * - A W3C selector, a la `.mermaid` (default)
 * @param callback - Function that is called with the id of each generated mermaid diagram.
 * @returns Resolves on success, otherwise the {@link Promise} will be rejected.
 */
const initThrowsErrorsAsync = async function (
  config?: MermaidConfig,
  nodes?: string | HTMLElement | NodeListOf<HTMLElement>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback?: Function
) {
  const conf = mermaidAPI.getConfig();

  if (config) {
    // This is a legacy way of setting config. It is not documented and should be removed in the future.
    // @ts-ignore: TODO Fix ts errors
    mermaid.sequenceConfig = config;
  }

  // if last argument is a function this is the callback function
  log.debug(`${!callback ? 'No ' : ''}Callback function found`);
  let nodesToProcess: ArrayLike<HTMLElement>;
  if (nodes === undefined) {
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
  if (config?.startOnLoad !== undefined) {
    log.debug('Start On Load: ' + config?.startOnLoad);
    mermaidAPI.updateSiteConfig({ startOnLoad: config?.startOnLoad });
  }

  // generate the id of the diagram
  const idGenerator = new utils.initIdGenerator(conf.deterministicIds, conf.deterministicIDSeed);

  let txt: string;
  const errors: DetailedError[] = [];

  // element is the current div with mermaid class
  // eslint-disable-next-line unicorn/prefer-spread
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
    txt = dedent(utils.entityDecode(txt)) // removes indentation, required for YAML parsing
      .trim()
      .replace(/<br\s*\/?>/gi, '<br/>');

    const init = utils.detectInit(txt);
    if (init) {
      log.debug('Detected early reinit: ', init);
    }
    try {
      await mermaidAPI.renderAsync(
        id,
        txt,
        (svgCode: string, bindFunctions?: (el: Element) => void) => {
          element.innerHTML = svgCode;
          if (callback !== undefined) {
            callback(id);
          }
          if (bindFunctions) {
            bindFunctions(element);
          }
        },
        element
      );
    } catch (error) {
      handleError(error, errors, mermaid.parseError);
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
 * Used to register external diagram types.
 * @param diagrams - Array of {@link ExternalDiagramDefinition}.
 * @param opts - If opts.lazyLoad is true, the diagram will be loaded on demand.
 */
const registerExternalDiagrams = async (
  diagrams: ExternalDiagramDefinition[],
  {
    lazyLoad = true,
  }: {
    lazyLoad?: boolean;
  } = {}
) => {
  if (lazyLoad) {
    registerLazyLoadedDiagrams(...diagrams);
  } else {
    await loadExternalDiagrams(...diagrams);
  }
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
      mermaid.init().catch((err) => log.error('Mermaid failed to initialize', err));
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
 * @param newParseErrorHandler - New parseError() callback.
 */
const setParseErrorHandler = function (newParseErrorHandler: (err: any, hash: any) => void) {
  mermaid.parseError = newParseErrorHandler;
};

const parse = (txt: string) => {
  return mermaidAPI.parse(txt, mermaid.parseError);
};

const executionQueue: (() => Promise<unknown>)[] = [];
let executionQueueRunning = false;
const executeQueue = async () => {
  if (executionQueueRunning) {
    return;
  }
  executionQueueRunning = true;
  while (executionQueue.length > 0) {
    const f = executionQueue.shift();
    if (f) {
      try {
        await f();
      } catch (e) {
        log.error('Error executing queue', e);
      }
    }
  }
  executionQueueRunning = false;
};

/**
 * @param txt - The mermaid code to be parsed.
 * @deprecated This is an internal function and should not be used. Will be removed in v10.
 */
const parseAsync = (txt: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // This promise will resolve when the mermaidAPI.render call is done.
    // It will be queued first and will be executed when it is first in line
    const performCall = () =>
      new Promise((res, rej) => {
        mermaidAPI.parseAsync(txt, mermaid.parseError).then(
          (r) => {
            // This resolves for the promise for the queue handling
            res(r);
            // This fulfills the promise sent to the value back to the original caller
            resolve(r);
          },
          (e) => {
            log.error('Error parsing', e);
            rej(e);
            reject(e);
          }
        );
      });
    executionQueue.push(performCall);
    executeQueue().catch(reject);
  });
};

/**
 * @deprecated This is an internal function and should not be used. Will be removed in v10.
 */
const renderAsync = (
  id: string,
  text: string,
  cb?: (svgCode: string, bindFunctions?: (element: Element) => void) => void,
  container?: Element
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // This promise will resolve when the mermaidAPI.render call is done.
    // It will be queued first and will be executed when it is first in line
    const performCall = () =>
      new Promise((res, rej) => {
        mermaidAPI.renderAsync(id, text, cb, container).then(
          (r) => {
            // This resolves for the promise for the queue handling
            res(r);
            // This fulfills the promise sent to the value back to the original caller
            resolve(r);
          },
          (e) => {
            log.error('Error parsing', e);
            rej(e);
            reject(e);
          }
        );
      });
    executionQueue.push(performCall);
    executeQueue().catch(reject);
  });
};

const mermaid: {
  startOnLoad: boolean;
  diagrams: any;
  parseError?: ParseErrorFunction;
  mermaidAPI: typeof mermaidAPI;
  parse: typeof parse;
  parseAsync: typeof parseAsync;
  render: typeof mermaidAPI.render;
  renderAsync: typeof renderAsync;
  init: typeof init;
  initThrowsErrors: typeof initThrowsErrors;
  initThrowsErrorsAsync: typeof initThrowsErrorsAsync;
  registerExternalDiagrams: typeof registerExternalDiagrams;
  initialize: typeof initialize;
  contentLoaded: typeof contentLoaded;
  setParseErrorHandler: typeof setParseErrorHandler;
} = {
  startOnLoad: true,
  diagrams: {},
  mermaidAPI,
  parse,
  parseAsync,
  render: mermaidAPI.render,
  renderAsync,
  init,
  initThrowsErrors,
  initThrowsErrorsAsync,
  registerExternalDiagrams,
  initialize,
  parseError: undefined,
  contentLoaded,
  setParseErrorHandler,
};

export default mermaid;
