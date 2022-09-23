// @ts-ignore: TODO Fix ts errors
// import mindmapParser from './parser/mindmap';
// import * as mindmapDb from './mindmapDb';
import { mindmapDetector } from './mindmapDetector';
// import mindmapRenderer from './mindmapRenderer';
// import mindmapStyles from './styles';

import mermaid from 'mermaid';

console.log('mindmapDb', mermaid.mermaidAPI.getConfig()); // eslint-disable-line no-console
// registerDiagram()

// if (typeof document !== 'undefined') {
//   /*!
//    * Wait for document loaded before starting the execution
//    */
//   window.addEventListener(
//     'load',
//     () => {
//       if (window.mermaid && typeof window.mermaid.detectors === 'object') {
//         window.mermaid.detectors.push(mindmapDetector);
//         console.log(window.mermaid.detectors); // eslint-disable-line no-console
//       }
//     },
//     false
//   );
// }
