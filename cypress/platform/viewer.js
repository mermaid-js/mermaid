import mermaid2 from '../../packages/mermaid/src/mermaid';
import mindmap from '../../packages/mermaid-mindmap/src/detector';

function b64ToUtf8(str) {
  return decodeURIComponent(escape(window.atob(str)));
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

    await mermaid2.registerExternalDiagrams([mindmap]);
    mermaid2.initialize(graphObj.mermaid);
    mermaid2.init();
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
      !(current[key] instanceof Array)
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

const contentLoadedApi = function () {
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

      const defaultE2eCnf = { theme: 'forest' };

      const cnf = merge(defaultE2eCnf, graphObj.mermaid);

      mermaid2.initialize(cnf);

      for (let i = 0; i < numCodes; i++) {
        mermaid2.render(
          'newid' + i,
          graphObj.code[i],
          (svgCode, bindFunctions) => {
            div.innerHTML = svgCode;

            bindFunctions(div);
          },
          divs[i]
        );
      }
    } else {
      const div = document.createElement('div');
      div.id = 'block';
      div.className = 'mermaid';
      // div.innerHTML = graphObj.code
      console.warn('graphObj.mermaid', graphObj.mermaid);
      document.getElementsByTagName('body')[0].appendChild(div);
      mermaid2.initialize(graphObj.mermaid);

      mermaid2.render(
        'newid',
        graphObj.code,
        (svgCode, bindFunctions) => {
          div.innerHTML = svgCode;

          if (bindFunctions) bindFunctions(div);
        },
        div
      );
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
      if (this.location.href.match('xss.html')) {
        this.console.log('Using api');
        contentLoadedApi();
      } else {
        this.console.log('Not using api');
        contentLoaded();
      }
    },
    false
  );
}
