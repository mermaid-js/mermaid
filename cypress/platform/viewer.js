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
    /* MIT License

    Copyright (c) Microsoft Corporation.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE */
    const staticAwsLogoIconPack = {
      prefix: 'fluent-emoji',
      icons: {
        'tropical-fish': {
          width: 32,
          height: 32,
          body: '<g fill="none"><circle cx="3.055" cy="19.945" r="1.055" fill="url(#f2515id0)" /><circle cx="3.055" cy="19.945" r="1.055" fill="url(#f2515id1)" /><circle cx="3.055" cy="17.945" r="1.055" fill="url(#f2515id2)" /><path fill="url(#f2515idj)" d="M14.375 7H23a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3h-8.625z" /><path fill="url(#f2515id3)" d="M14.375 7H23a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3h-8.625z" /><path fill="url(#f2515id4)" d="M14.375 7H23a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3h-8.625z" /><path fill="url(#f2515idk)" d="M14.375 7H23a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3h-8.625z" /><path fill="url(#f2515id5)" d="M14.375 7H23a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3h-8.625z" /><path fill="url(#f2515id6)" d="M14.375 7H23a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3h-8.625z" /><path fill="url(#f2515id7)" d="M14.375 7H23a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3h-8.625z" /><path fill="url(#f2515idl)" d="M14.375 7H23a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3h-8.625z" /><circle cx="14.5" cy="18.5" r="11.5" fill="url(#f2515id8)" /><circle cx="14.5" cy="18.5" r="11.5" fill="url(#f2515id9)" /><circle cx="14.5" cy="18.5" r="11.5" fill="url(#f2515ida)" /><circle cx="14.5" cy="18.5" r="11.5" fill="url(#f2515idb)" /><path fill="url(#f2515idc)" d="M6.7 10.05a10.8 10.8 0 0 1 3.988 8.388c0 3.417-1.586 6.464-4.06 8.445A11.47 11.47 0 0 1 3 18.5a11.47 11.47 0 0 1 3.7-8.45" /><g filter="url(#f2515idp)"><path fill="#4d82fd" d="M17.61 21.717v-5.873a.7.7 0 0 0-1.174-.516l-2.998 2.753a1 1 0 0 0 .01 1.483l2.995 2.675a.7.7 0 0 0 1.166-.522" /></g><path fill="url(#f2515idm)" d="M18 21.452v-5.874a.7.7 0 0 0-1.174-.516l-2.997 2.754a1 1 0 0 0 .01 1.482l2.995 2.676A.7.7 0 0 0 18 21.452" /><path fill="url(#f2515idn)" d="M18 21.452v-5.874a.7.7 0 0 0-1.174-.516l-2.997 2.754a1 1 0 0 0 .01 1.482l2.995 2.676A.7.7 0 0 0 18 21.452" /><path fill="url(#f2515idd)" d="M18 21.452v-5.874a.7.7 0 0 0-1.174-.516l-2.997 2.754a1 1 0 0 0 .01 1.482l2.995 2.676A.7.7 0 0 0 18 21.452" /><circle cx="7.422" cy="16.391" r=".5" fill="url(#f2515ide)" /><circle cx="7.422" cy="16.391" r=".5" fill="url(#f2515idf)" /><circle cx="7.422" cy="16.391" r=".5" fill="url(#f2515ido)" /><path fill="url(#f2515idg)" d="M30.063 15.955c0-.672-.766-1.476-1.82-.956A4.5 4.5 0 0 0 26 18.893c0 1.662.901 3.114 2.242 3.893c.759.441 1.82-.073 1.82-.83z" /><path fill="url(#f2515idh)" d="M30.063 15.955c0-.672-.766-1.476-1.82-.956A4.5 4.5 0 0 0 26 18.893c0 1.662.901 3.114 2.242 3.893c.759.441 1.82-.073 1.82-.83z" /><path fill="url(#f2515idi)" d="M30.063 15.955c0-.672-.766-1.476-1.82-.956A4.5 4.5 0 0 0 26 18.893c0 1.662.901 3.114 2.242 3.893c.759.441 1.82-.073 1.82-.83z" /><defs><radialGradient id="f2515id0" cx="0" cy="0" r="1" gradientTransform="matrix(1.3125 -.53906 .83075 2.02268 2 20.484)" gradientUnits="userSpaceOnUse"><stop stop-color="#6d5a93" /><stop offset="1" stop-color="#5f498c" /></radialGradient><radialGradient id="f2515id1" cx="0" cy="0" r="1" gradientTransform="rotate(98.219 -6.59 10.698)scale(.71042 .794)" gradientUnits="userSpaceOnUse"><stop stop-color="#442e79" /><stop offset="1" stop-color="#442e79" stop-opacity="0" /></radialGradient><radialGradient id="f2515id2" cx="0" cy="0" r="1" gradientTransform="matrix(1.625 0 0 2.50428 1.875 17.945)" gradientUnits="userSpaceOnUse"><stop stop-color="#6d5a93" /><stop offset="1" stop-color="#5f498c" /></radialGradient><radialGradient id="f2515id3" cx="0" cy="0" r="1" gradientTransform="matrix(8.0625 -3.625 5.13835 11.4284 17.188 31.625)" gradientUnits="userSpaceOnUse"><stop stop-color="#ff835d" /><stop offset="1" stop-color="#ff835d" stop-opacity="0" /></radialGradient><radialGradient id="f2515id4" cx="0" cy="0" r="1" gradientTransform="rotate(46.65 -12.942 36.264)scale(5.37182 7.61442)" gradientUnits="userSpaceOnUse"><stop stop-color="#ff835d" /><stop offset="1" stop-color="#ff835d" stop-opacity="0" /></radialGradient><radialGradient id="f2515id5" cx="0" cy="0" r="1" gradientTransform="matrix(16.7498 18.68764 -12.28497 11.01107 9.25 10.625)" gradientUnits="userSpaceOnUse"><stop offset=".943" stop-color="#ff835d" stop-opacity="0" /><stop offset="1" stop-color="#ff835d" /></radialGradient><radialGradient id="f2515id6" cx="0" cy="0" r="1" gradientTransform="rotate(143.673 11.127 8.392)scale(3.95643 5.87059)" gradientUnits="userSpaceOnUse"><stop stop-color="#ffe65e" /><stop offset=".654" stop-color="#ffe65e" stop-opacity="0" /></radialGradient><radialGradient id="f2515id7" cx="0" cy="0" r="1" gradientTransform="matrix(0 -6.0625 11.8125 0 27.125 14.938)" gradientUnits="userSpaceOnUse"><stop stop-color="#ffe65e" /><stop offset="1" stop-color="#ffe65e" stop-opacity="0" /></radialGradient><radialGradient id="f2515id8" cx="0" cy="0" r="1" gradientTransform="matrix(-10.49993 18.125 -19.41091 -11.24487 22.813 9.75)" gradientUnits="userSpaceOnUse"><stop stop-color="#76cdff" /><stop offset="1" stop-color="#5181ff" /></radialGradient><radialGradient id="f2515id9" cx="0" cy="0" r="1" gradientTransform="matrix(0 23.0625 -17.9752 0 14.5 9.063)" gradientUnits="userSpaceOnUse"><stop offset=".786" stop-color="#5a67ff" stop-opacity="0" /><stop offset=".929" stop-color="#5a67ff" /></radialGradient><radialGradient id="f2515ida" cx="0" cy="0" r="1" gradientTransform="matrix(-3.6875 0 0 -6.17092 28.5 18.813)" gradientUnits="userSpaceOnUse"><stop offset=".017" stop-color="#5a67ff" /><stop offset="1" stop-color="#5a67ff" stop-opacity="0" /></radialGradient><radialGradient id="f2515idb" cx="0" cy="0" r="1" gradientTransform="matrix(2.37499 2.81251 -7.52137 6.35133 7.875 8.125)" gradientUnits="userSpaceOnUse"><stop stop-color="#65afe3" /><stop offset="1" stop-color="#65afe3" stop-opacity="0" /></radialGradient><radialGradient id="f2515idc" cx="0" cy="0" r="1" gradientTransform="matrix(23.875 0 0 34.7797 .625 18.467)" gradientUnits="userSpaceOnUse"><stop offset=".065" stop-color="#80739f" /><stop offset=".262" stop-color="#6f53a3" /></radialGradient><radialGradient id="f2515idd" cx="0" cy="0" r="1" gradientTransform="matrix(0 4.5 -.71873 0 18 15.844)" gradientUnits="userSpaceOnUse"><stop stop-color="#ffd65c" /><stop offset="1" stop-color="#ffd65c" stop-opacity="0" /></radialGradient><radialGradient id="f2515ide" cx="0" cy="0" r="1" gradientTransform="matrix(-.40625 .5625 -.5015 -.3622 7.57 16.23)" gradientUnits="userSpaceOnUse"><stop offset=".006" stop-color="#433437" /><stop offset="1" stop-color="#3b2838" /></radialGradient><radialGradient id="f2515idf" cx="0" cy="0" r="1" gradientTransform="rotate(137.643 .653 9.607)scale(.35946 .31624)" gradientUnits="userSpaceOnUse"><stop stop-color="#5c5051" /><stop offset="1" stop-color="#5c5051" stop-opacity="0" /></radialGradient><radialGradient id="f2515idg" cx="0" cy="0" r="1" gradientTransform="matrix(-4.375 0 0 -8.85937 30.375 18.89)" gradientUnits="userSpaceOnUse"><stop offset=".329" stop-color="#ffc256" /><stop offset="1" stop-color="#ff8646" /></radialGradient><radialGradient id="f2515idh" cx="0" cy="0" r="1" gradientTransform="matrix(0 4.59375 -1.28023 0 30.063 17.094)" gradientUnits="userSpaceOnUse"><stop stop-color="#ffd661" /><stop offset="1" stop-color="#ffd661" stop-opacity="0" /></radialGradient><radialGradient id="f2515idi" cx="0" cy="0" r="1" gradientTransform="matrix(-5.375 0 0 -5.125 31.188 18.89)" gradientUnits="userSpaceOnUse"><stop offset=".892" stop-color="#f37539" stop-opacity="0" /><stop offset="1" stop-color="#f37539" /></radialGradient><linearGradient id="f2515idj" x1="30.813" x2="20.5" y1="17.375" y2="17.375" gradientUnits="userSpaceOnUse"><stop stop-color="#ffe359" /><stop offset="1" stop-color="#ffbe3e" /></linearGradient><linearGradient id="f2515idk" x1="26" x2="26" y1="30.656" y2="29.438" gradientUnits="userSpaceOnUse"><stop offset=".118" stop-color="#ff835d" /><stop offset="1" stop-color="#ff835d" stop-opacity="0" /></linearGradient><linearGradient id="f2515idl" x1="19.094" x2="19.219" y1="6.313" y2="7.625" gradientUnits="userSpaceOnUse"><stop stop-color="#ffb941" /><stop offset="1" stop-color="#ffb941" stop-opacity="0" /></linearGradient><linearGradient id="f2515idm" x1="18" x2="13.813" y1="17.875" y2="17.875" gradientUnits="userSpaceOnUse"><stop stop-color="#ffd65c" /><stop offset="1" stop-color="#ff8c42" /></linearGradient><linearGradient id="f2515idn" x1="15.752" x2="14.281" y1="19.594" y2="20.625" gradientUnits="userSpaceOnUse"><stop stop-color="#ff8c42" stop-opacity="0" /><stop offset="1" stop-color="#ff8c42" /></linearGradient><linearGradient id="f2515ido" x1="7.324" x2="6.98" y1="15.998" y2="15.779" gradientUnits="userSpaceOnUse"><stop stop-color="#5c5051" stop-opacity="0" /><stop offset="1" stop-color="#5c5051" /></linearGradient><filter id="f2515idp" width="5.995" height="8.777" x="12.364" y="14.392" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur result="effect1_foregroundBlur_28327_5989" stdDeviation=".375" /></filter></defs></g>',
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
        name: 'fluent-emoji',
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
