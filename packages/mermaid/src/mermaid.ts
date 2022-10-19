/**
 * Web page integration module for the mermaid framework. It uses the mermaidAPI for mermaid
 * functionality and to render the diagrams to svg code!
 */
import type { MermaidConfig } from './config.type';
import { log } from './logger';
import utils from './utils';
import { mermaidAPI } from './mermaidAPI';
import { addDetector } from './diagram-api/detectType';
import { isDetailedError, type DetailedError } from './utils';
import { registerDiagram } from './diagram-api/diagramAPI';

export type { MermaidConfig, DetailedError };
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
const init = async function (
  config?: MermaidConfig,
  // eslint-disable-next-line no-undef
  nodes?: string | HTMLElement | NodeListOf<HTMLElement>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback?: Function
) {
  try {
    const conf = mermaidAPI.getConfig();
    if (conf?.lazyLoadedDiagrams && conf.lazyLoadedDiagrams.length > 0) {
      await registerLazyLoadedDiagrams(conf);
      await initThrowsErrorsAsync(config, nodes, callback);
    } else {
      initThrowsErrors(config, nodes, callback);
    }
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

  // generate the id of the diagram
  const idGenerator = new utils.initIdGenerator(conf.deterministicIds, conf.deterministicIDSeed);

  let txt: string;
  const errors: DetailedError[] = [];

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
      const mermaidError: DetailedError = {
        error,
        str: error.str,
        hash: error.hash,
        message: error.str,
      };
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

let lazyLoadingPromise: Promise<unknown> | undefined = undefined;
/**
 * @param conf
 * @deprecated This is an internal function and should not be used. Will be removed in v10.
 */
const registerLazyLoadedDiagrams = async (conf: MermaidConfig) => {
  // Only lazy load once
  // TODO: This is a hack. We should either throw error when new diagrams are added, or load them anyway.
  if (lazyLoadingPromise === undefined) {
    // Load all lazy loaded diagrams in parallel
    lazyLoadingPromise = Promise.allSettled(
      (conf?.lazyLoadedDiagrams ?? []).map(async (diagram: string) => {
        const { id, detector, loadDiagram } = await import(diagram);
        addDetector(id, detector, loadDiagram);
      })
    );
  }
  await lazyLoadingPromise;
};

let loadingPromise: Promise<unknown> | undefined = undefined;

const loadExternalDiagrams = async (conf: MermaidConfig) => {
  // Only lazy load once
  // TODO: This is a hack. We should either throw error when new diagrams are added, or load them anyway.
  if (loadingPromise === undefined) {
    log.debug(`Loading ${conf?.lazyLoadedDiagrams?.length} external diagrams`);
    // Load all lazy loaded diagrams in parallel
    loadingPromise = Promise.allSettled(
      (conf?.lazyLoadedDiagrams ?? []).map(async (url: string) => {
        const { id, detector, loadDiagram } = await import(url);
        const { diagram } = await loadDiagram();
        registerDiagram(id, diagram, detector, diagram.injectUtils);
      })
    );
  }
  await loadingPromise;
};

/**
 * @deprecated This is an internal function and should not be used. Will be removed in v10.
 */

const initThrowsErrorsAsync = async function (
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

  // generate the id of the diagram
  const idGenerator = new utils.initIdGenerator(conf.deterministicIds, conf.deterministicIDSeed);

  let txt: string;
  const errors: DetailedError[] = [];

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
      await mermaidAPI.renderAsync(
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
      const mermaidError: DetailedError = {
        error,
        str: error.str,
        hash: error.hash,
        message: error.str,
      };
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
 * @param config
 * @deprecated This is an internal function and should not be used. Will be removed in v10.
 */
const initializeAsync = async function (config: MermaidConfig) {
  if (config.loadExternalDiagramsAtStartup) {
    await loadExternalDiagrams(config);
  } else {
    await registerLazyLoadedDiagrams(config);
  }
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
 * @param newParseErrorHandler New parseError() callback.
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
 * @param txt
 * @deprecated This is an internal function and should not be used. Will be removed in v10.
 */
const parseAsync = (txt: string) => {
  return new Promise((resolve, reject) => {
    // This promise will resolve when the mermaidAPI.render call is done.
    // It will be queued first and will be executed when it is first in line
    const performCall = () =>
      new Promise((res, rej) => {
        mermaidAPI.parseAsync(txt, mermaid.parseError).then(
          (r) => {
            // This resolves for the promise for the queue handling
            res(r);
            // This fullfills the promise sent to the value back to the original caller
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
    executeQueue();
  });
};

// const asynco = (id: string, delay: number) =>
//   new Promise((res) => {
//     setTimeout(() => {
//       // This resolves for the promise for the queue handling
//       res(id);
//     }, delay);
//   });

/**
 * @param txt
 * @param id
 * @param delay
 * @deprecated This is an internal function and should not be used. Will be removed in v10.
 */
// const test1 = (id: string, delay: number) => {
//   const p = new Promise((resolve, reject) => {
//     // This promise will resolve when the mermaidAPI.render call is done.
//     // It will be queued first and will be executed when it is first in line
//     const performCall = () =>
//       new Promise((res) => {
//         asynco(id, delay).then((r) => {
//           // This resolves for the promise for the queue handling
//           res(r);
//           // This fullfills the promise sent to the value back to the original caller
//           resolve(r + ' result to caller');
//         });
//       });
//     executionQueue.push(performCall);
//   });
//   return p;
// };

/**
 * @param txt
 * @param id
 * @param text
 * @param cb
 * @param container
 * @deprecated This is an internal function and should not be used. Will be removed in v10.
 */
const renderAsync = (
  id: string,
  text: string,
  cb: (svgCode: string, bindFunctions?: (element: Element) => void) => void,
  container?: Element
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // This promise will resolve when the mermaidAPI.render call is done.
    // It will be queued first and will be executed when it is first in line
    const performCall = () =>
      new Promise((res, rej) => {
        mermaidAPI.renderAsync(id, text, cb, container).then(
          (r) => {
            // This resolves for the promise for the queue handling
            res(r);
            // This fullfills the promise sent to the value back to the original caller
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
    executeQueue();
  });
};

const mermaid: {
  startOnLoad: boolean;
  diagrams: any;
  // eslint-disable-next-line @typescript-eslint/ban-types
  parseError?: Function;
  mermaidAPI: typeof mermaidAPI;
  parse: typeof parse;
  parseAsync: typeof parseAsync;
  render: typeof mermaidAPI.render;
  renderAsync: typeof renderAsync;
  init: typeof init;
  initThrowsErrors: typeof initThrowsErrors;
  initialize: typeof initialize;
  initializeAsync: typeof initializeAsync;
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
  initialize,
  initializeAsync,
  parseError: undefined,
  contentLoaded,
  setParseErrorHandler,
};

export default mermaid;
