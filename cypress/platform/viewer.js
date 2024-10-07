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
    const staticAwsLogoIconPack = {
      prefix: 'logos',
      icons: {
        aws: {
          body: '<path fill="#252F3E" d="M72.392 55.438c0 3.137.34 5.68.933 7.545a45.4 45.4 0 0 0 2.712 6.103c.424.678.593 1.356.593 1.95c0 .847-.508 1.695-1.61 2.543l-5.34 3.56c-.763.509-1.526.763-2.205.763c-.847 0-1.695-.424-2.543-1.187a26 26 0 0 1-3.051-3.984c-.848-1.44-1.696-3.052-2.628-5.001q-9.919 11.697-24.922 11.698c-7.12 0-12.8-2.035-16.954-6.103c-4.153-4.07-6.272-9.495-6.272-16.276c0-7.205 2.543-13.054 7.714-17.462c5.17-4.408 12.037-6.612 20.768-6.612c2.882 0 5.849.254 8.985.678c3.137.424 6.358 1.102 9.749 1.865V29.33c0-6.443-1.357-10.935-3.985-13.563c-2.712-2.628-7.29-3.9-13.817-3.9c-2.967 0-6.018.34-9.155 1.103s-6.188 1.695-9.155 2.882c-1.356.593-2.373.932-2.967 1.102s-1.017.254-1.356.254c-1.187 0-1.78-.848-1.78-2.628v-4.154c0-1.356.17-2.373.593-2.966c.424-.594 1.187-1.187 2.374-1.78q4.45-2.29 10.68-3.815C33.908.763 38.316.255 42.978.255c10.088 0 17.463 2.288 22.21 6.866c4.662 4.577 7.036 11.528 7.036 20.853v27.464zM37.976 68.323c2.798 0 5.68-.508 8.731-1.526c3.052-1.017 5.765-2.882 8.053-5.425c1.357-1.61 2.374-3.39 2.882-5.425c.509-2.034.848-4.493.848-7.375v-3.56a71 71 0 0 0-7.799-1.441a64 64 0 0 0-7.968-.509c-5.68 0-9.833 1.102-12.63 3.391s-4.154 5.51-4.154 9.748c0 3.984 1.017 6.951 3.136 8.986c2.035 2.119 5.002 3.136 8.901 3.136m68.069 9.155c-1.526 0-2.543-.254-3.221-.848c-.678-.508-1.272-1.695-1.78-3.305L81.124 7.799c-.51-1.696-.764-2.798-.764-3.391c0-1.356.678-2.12 2.035-2.12h8.307c1.61 0 2.713.255 3.306.848c.678.509 1.187 1.696 1.695 3.306l14.241 56.117l13.224-56.117c.424-1.695.933-2.797 1.61-3.306c.679-.508 1.866-.847 3.392-.847h6.781c1.61 0 2.713.254 3.39.847c.679.509 1.272 1.696 1.611 3.306l13.394 56.795L168.01 6.442c.508-1.695 1.102-2.797 1.695-3.306c.678-.508 1.78-.847 3.306-.847h7.883c1.357 0 2.12.678 2.12 2.119c0 .424-.085.848-.17 1.356s-.254 1.187-.593 2.12l-20.43 65.525q-.762 2.544-1.78 3.306c-.678.509-1.78.848-3.22.848h-7.29c-1.611 0-2.713-.254-3.392-.848c-.678-.593-1.271-1.695-1.61-3.39l-13.14-54.676l-13.054 54.59c-.423 1.696-.932 2.798-1.61 3.391c-.678.594-1.865.848-3.39.848zm108.927 2.289c-4.408 0-8.816-.509-13.054-1.526c-4.239-1.017-7.544-2.12-9.748-3.39c-1.357-.764-2.29-1.611-2.628-2.374a6 6 0 0 1-.509-2.374V65.78c0-1.78.678-2.628 1.95-2.628a4.8 4.8 0 0 1 1.526.255c.508.17 1.271.508 2.119.847a46 46 0 0 0 9.324 2.967a51 51 0 0 0 10.088 1.017c5.34 0 9.494-.932 12.376-2.797s4.408-4.577 4.408-8.053c0-2.373-.763-4.323-2.289-5.934s-4.408-3.051-8.561-4.408l-12.292-3.814c-6.188-1.95-10.765-4.832-13.563-8.647c-2.797-3.73-4.238-7.883-4.238-12.291q0-5.34 2.289-9.41c1.525-2.712 3.56-5.085 6.103-6.95c2.543-1.95 5.425-3.391 8.816-4.408c3.39-1.017 6.95-1.441 10.68-1.441c1.865 0 3.815.085 5.68.339c1.95.254 3.73.593 5.51.932c1.695.424 3.306.848 4.832 1.357q2.288.762 3.56 1.525c1.187.679 2.034 1.357 2.543 2.12q.763 1.017.763 2.797v3.984c0 1.78-.678 2.713-1.95 2.713c-.678 0-1.78-.34-3.22-1.018q-7.25-3.306-16.276-3.306c-4.832 0-8.647.763-11.275 2.374c-2.627 1.61-3.984 4.069-3.984 7.544c0 2.374.848 4.408 2.543 6.019s4.832 3.221 9.325 4.662l12.037 3.815c6.103 1.95 10.511 4.662 13.139 8.137s3.9 7.46 3.9 11.868c0 3.645-.764 6.951-2.205 9.833c-1.525 2.882-3.56 5.425-6.188 7.46c-2.628 2.119-5.764 3.645-9.409 4.747c-3.815 1.187-7.799 1.78-12.122 1.78"/><path fill="#F90" d="M230.993 120.964c-27.888 20.599-68.408 31.534-103.247 31.534c-48.827 0-92.821-18.056-126.05-48.064c-2.628-2.373-.255-5.594 2.881-3.73c35.942 20.854 80.276 33.484 126.136 33.484c30.94 0 64.932-6.442 96.212-19.666c4.662-2.12 8.646 3.052 4.068 6.442m11.614-13.224c-3.56-4.577-23.566-2.204-32.636-1.102c-2.713.34-3.137-2.034-.678-3.814c15.936-11.19 42.13-7.968 45.181-4.239c3.052 3.815-.848 30.008-15.767 42.554c-2.288 1.95-4.492.933-3.475-1.61c3.39-8.393 10.935-27.296 7.375-31.789"/>',
          height: 153,
        },
      },
      width: 256,
      height: 256,
    };
    mermaid.registerIconPacks([
      {
        name: 'fa',
        loader: () => staticBellIconPack,
      },
      {
        name: 'logos',
        loader: () => staticAwsLogoIconPack,
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
