// @ts-ignore: TODO Fix ts errors
import { mindmapDetector } from './mindmapDetector';

if (typeof document !== 'undefined') {
  /*!
   * Wait for document loaded before starting the execution
   */
  window.addEventListener(
    'load',
    () => {
      if (window.mermaid && typeof window.mermaid.detectors === 'object') {
        window.mermaid.detectors.push(mindmapDetector);
        console.log(window.mermaid.detectors); // eslint-disable-line no-console
      }
    },
    false
  );
}
