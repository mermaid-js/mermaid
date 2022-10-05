// @ts-ignore: TODO Fix ts errors
import { mindmapDetector } from './mindmapDetector';

const scriptElement = document.currentScript as HTMLScriptElement;
const path = scriptElement.src;
const lastSlash = path.lastIndexOf('/');
const baseFolder = lastSlash < 0 ? path : path.substring(0, lastSlash + 1);

if (typeof document !== 'undefined') {
  if (window.mermaid && typeof window.mermaid.detectors === 'object') {
    window.mermaid.detectors.push({ id: 'mindmap', detector: mindmapDetector });
  } else {
    window.mermaid = {};
    window.mermaid.detectors = [{ id: 'mindmap', detector: mindmapDetector }];
  }

  /*!
   * Wait for document loaded before starting the execution.
   */
  window.addEventListener(
    'load',
    () => {
      if (window.mermaid && typeof window.mermaid.detectors === 'object') {
        window.mermaid.detectors.push({
          id: 'mindmap',
          detector: mindmapDetector,
          path: baseFolder,
        });
        console.error(window.mermaid.detectors); // eslint-disable-line no-console
      }
    },
    false
  );
}
