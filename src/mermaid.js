/**
 * Web page integration module for the mermaid framework. It uses the mermaidAPI for mermaid
 * functionality and to render the diagrams to svg code.
 */
import { log } from './logger';
import mermaidAPI from './mermaidAPI';
import utils from './utils';

/**
 * ## init
 *
 * Function that goes through the document to find the chart definitions in there and render them.
 *
 * The function tags the processed attributes with the attribute data-processed and ignores found
 * elements with the attribute already set. This way the init function can be triggered several times.
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
 */
const init = function () {
  const conf = mermaidAPI.getConfig();
  // console.log('Starting rendering diagrams (init) - mermaid.init', conf);
  let nodes;
  if (arguments.length >= 2) {
    /*! sequence config was passed as #1 */
    if (typeof arguments[0] !== 'undefined') {
      mermaid.sequenceConfig = arguments[0];
    }

    nodes = arguments[1];
  } else {
    nodes = arguments[0];
  }

  // if last argument is a function this is the callback function
  let callback;
  if (typeof arguments[arguments.length - 1] === 'function') {
    callback = arguments[arguments.length - 1];
    log.debug('Callback function found');
  } else {
    if (typeof conf.mermaid !== 'undefined') {
      if (typeof conf.mermaid.callback === 'function') {
        callback = conf.mermaid.callback;
        log.debug('Callback function found');
      } else {
        log.debug('No Callback function found');
      }
    }
  }
  nodes =
    nodes === undefined
      ? document.querySelectorAll('.mermaid')
      : typeof nodes === 'string'
      ? document.querySelectorAll(nodes)
      : nodes instanceof window.Node
      ? [nodes]
      : nodes; // Last case  - sequence config was passed pick next

  log.debug('Start On Load before: ' + mermaid.startOnLoad);
  if (typeof mermaid.startOnLoad !== 'undefined') {
    log.debug('Start On Load inner: ' + mermaid.startOnLoad);
    mermaidAPI.updateSiteConfig({ startOnLoad: mermaid.startOnLoad });
  }

  if (typeof mermaid.ganttConfig !== 'undefined') {
    mermaidAPI.updateSiteConfig({ gantt: mermaid.ganttConfig });
  }

  const idGeneratior = new utils.initIdGeneratior(conf.deterministicIds, conf.deterministicIDSeed);

  let txt;

  for (let i = 0; i < nodes.length; i++) {
    const element = nodes[i];

    /*! Check if previously processed */
    if (!element.getAttribute('data-processed')) {
      element.setAttribute('data-processed', true);
    } else {
      continue;
    }

    const id = `mermaid-${idGeneratior.next()}`;

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
        (svgCode, bindFunctions) => {
          element.innerHTML = svgCode;
          if (typeof callback !== 'undefined') {
            callback(id);
          }
          if (bindFunctions) bindFunctions(element);
        },
        element
      );
    } catch (e) {
      log.warn('Syntax Error rendering');
      log.warn(e);
      if (this.parseError) {
        this.parseError(e);
      }
    }
  }
};

const initialize = function (config) {
  // mermaidAPI.reset();
  if (typeof config.mermaid !== 'undefined') {
    if (typeof config.mermaid.startOnLoad !== 'undefined') {
      mermaid.startOnLoad = config.mermaid.startOnLoad;
    }
    if (typeof config.mermaid.htmlLabels !== 'undefined') {
      mermaid.htmlLabels =
        config.mermaid.htmlLabels === 'false' || config.mermaid.htmlLabels === false ? false : true;
    }
  }
  mermaidAPI.initialize(config);
  // mermaidAPI.reset();
};

/**
 * ##contentLoaded Callback function that is called when page is loaded. This functions fetches
 * configuration for mermaid rendering and calls init for rendering the mermaid diagrams on the page.
 */
const contentLoaded = function () {
  let config;

  if (mermaid.startOnLoad) {
    // No config found, do check API config
    config = mermaidAPI.getConfig();
    if (config.startOnLoad) {
      mermaid.init();
    }
  } else {
    if (typeof mermaid.startOnLoad === 'undefined') {
      log.debug('In start, no config');
      config = mermaidAPI.getConfig();
      if (config.startOnLoad) {
        mermaid.init();
      }
    }
  }
};

if (typeof document !== 'undefined') {
  /*!
   * Wait for document loaded before starting the execution
   */
  window.addEventListener(
    'load',
    function () {
      contentLoaded();
    },
    false
  );
}

const mermaid = {
  startOnLoad: true,
  htmlLabels: true,

  mermaidAPI,
  parse: mermaidAPI.parse,
  render: mermaidAPI.render,

  init,
  initialize,

  contentLoaded,
};

export default mermaid;
