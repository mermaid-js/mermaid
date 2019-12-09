import { Base64 } from 'js-base64';
import mermaid2 from '../../src/mermaid';

/**
 * ##contentLoaded
 * Callback function that is called when page is loaded. This functions fetches configuration for mermaid rendering and
 * calls init for rendering the mermaid diagrams on the page.
 */
const contentLoaded = function() {
  let pos = document.location.href.indexOf('?graph=');
  if (pos > 0) {
    pos = pos + 7;
    const graphBase64 = document.location.href.substr(pos);
    const graphObj = JSON.parse(Base64.decode(graphBase64));
    // const graph = 'hello'
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
    global.mermaid.initialize(graphObj.mermaid);
    global.mermaid.init();
  }
};
const contentLoadedApi = function() {
  let pos = document.location.href.indexOf('?graph=');
  if (pos > 0) {
    pos = pos + 7;
    const graphBase64 = document.location.href.substr(pos);
    const graphObj = JSON.parse(Base64.decode(graphBase64));
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

      mermaid2.initialize(graphObj.mermaid);

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
    function() {
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
