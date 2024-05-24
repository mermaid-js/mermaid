import mermaid from './mermaid.esm.mjs';
import flowchartELK from './mermaid-flowchart-elk.esm.mjs';
import externalExample from './mermaid-example-diagram.esm.mjs';
import zenUml from './mermaid-zenuml.esm.mjs';

function b64ToUtf8(str) {
  return decodeURIComponent(escape(window.atob(str)));
}

// Adds a rendered flag to window when rendering is done, so cypress can wait for it.
function markRendered() {
  if (window.Cypress) {
    window.rendered = true;
  }
}

/**
 * ##contentLoaded Callback function that is called when page is loaded. This functions fetches
 * configuration for mermaid rendering and calls init for rendering the mermaid diagrams on the
 * page.
 */
const contentLoaded = async function () {
  let pos = document.location.href.indexOf('?graph=');
  if (pos > 0) {
    pos = pos + 7;
    const graphBase64 = document.location.href.substr(pos);
    const graphObj = JSON.parse(b64ToUtf8(graphBase64));
    if (graphObj.mermaid && graphObj.mermaid.theme === 'dark') {
      document.body.style.background = '#3f3f3f';
    }
    console.log(graphObj);
    if (Array.isArray(graphObj.code)) {
      const numCodes = graphObj.code.length;
      for (let i = 0; i < numCodes; i++) {
        const div = document.createElement('div');
        div.id = 'block' + i;
        div.className = 'mermaid';
        div.innerHTML = graphObj.code[i];
        document.getElementsByTagName('body')[0].appendChild(div);
      }
    } else {
      const div = document.createElement('div');
      div.id = 'block';
      div.className = 'mermaid';
      div.innerHTML = graphObj.code;
      document.getElementsByTagName('body')[0].appendChild(div);
    }

    await mermaid.registerExternalDiagrams([externalExample, zenUml, flowchartELK]);
    mermaid.initialize(graphObj.mermaid);
    await mermaid.run();
  }
};

/**
 * @param current
 * @param update
 */
function merge(current, update) {
  Object.keys(update).forEach(function (key) {
    // if update[key] exist, and it's not a string or array,
    // we go in one level deeper
    if (
      current.hasOwnProperty(key) &&
      typeof current[key] === 'object' &&
      !Array.isArray(current[key])
    ) {
      merge(current[key], update[key]);

      // if update[key] doesn't exist in current, or it's a string
      // or array, then assign/overwrite current[key] to update[key]
    } else {
      current[key] = update[key];
    }
  });
  return current;
}

const contentLoadedApi = async function () {
  let pos = document.location.href.indexOf('?graph=');
  if (pos > 0) {
    pos = pos + 7;
    const graphBase64 = document.location.href.substr(pos);
    const graphObj = JSON.parse(b64ToUtf8(graphBase64));
    // const graph = 'hello'
    if (Array.isArray(graphObj.code)) {
      const numCodes = graphObj.code.length;
      const divs = [];
      let div;
      for (let i = 0; i < numCodes; i++) {
        div = document.createElement('div');
        div.id = 'block' + i;
        div.className = 'mermaid';
        // div.innerHTML = graphObj.code
        document.getElementsByTagName('body')[0].appendChild(div);
        divs[i] = div;
      }

      const defaultE2eCnf = { theme: 'forest', startOnLoad: false };

      const cnf = merge(defaultE2eCnf, graphObj.mermaid);

      mermaid.initialize(cnf);

      for (let i = 0; i < numCodes; i++) {
        const { svg, bindFunctions } = await mermaid.render('newid' + i, graphObj.code[i], divs[i]);
        div.innerHTML = svg;
        bindFunctions(div);
      }
    } else {
      const div = document.createElement('div');
      div.id = 'block';
      div.className = 'mermaid';
      console.warn('graphObj', graphObj);
      document.getElementsByTagName('body')[0].appendChild(div);
      mermaid.initialize(graphObj.mermaid);
      const { svg, bindFunctions } = await mermaid.render('newid', graphObj.code, div);
      div.innerHTML = svg;
      console.log(div.innerHTML);
      bindFunctions(div);
    }
  }
};

if (typeof document !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
  });
  /*!
   * Wait for document loaded before starting the execution
   */
  window.addEventListener(
    'load',
    function () {
      if (this.location.href.match('xss.html')) {
        this.console.log('Using api');
        void contentLoadedApi().finally(markRendered);
      } else {
        this.console.log('Not using api');
        void contentLoaded().finally(markRendered);
      }
    },
    false
  );
}
