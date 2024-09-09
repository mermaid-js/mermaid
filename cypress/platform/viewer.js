import externalExample from './mermaid-example-diagram.esm.mjs';
import layouts from './mermaid-layout-elk.esm.mjs';
import zenUml from './mermaid-zenuml.esm.mjs';
import mermaid from './mermaid.esm.mjs';

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

    await mermaid.registerExternalDiagrams([externalExample, zenUml]);

    mermaid.registerLayoutLoaders(layouts);
    mermaid.initialize(graphObj.mermaid);
    const staticBellIconPack = {
      prefix: 'fa6-regular',
      icons: {
        bell: {
          body: '<path fill="currentColor" d="M224 0c-17.7 0-32 14.3-32 32v19.2C119 66 64 130.6 64 208v25.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416h400c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6c-28.3-35.5-43.8-79.6-43.8-125V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32m0 96c61.9 0 112 50.1 112 112v25.4c0 47.9 13.9 94.6 39.7 134.6H72.3c25.8-40 39.7-86.7 39.7-134.6V208c0-61.9 50.1-112 112-112m64 352H160c0 17 6.7 33.3 18.7 45.3S207 512 224 512s33.3-6.7 45.3-18.7S288 465 288 448"/>',
          width: 448,
        },
      },
      width: 512,
      height: 512,
    };
    mermaid.registerIconPacks([
      {
        name: 'fa',
        loader: () => staticBellIconPack,
      },
    ]);
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
      if (/xss.html/.exec(this.location.href)) {
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
