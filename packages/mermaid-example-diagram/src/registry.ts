// @ts-ignore: TODO Fix ts errors
import { detector } from './exampleDetector';

const scriptElement = document.currentScript as HTMLScriptElement;
const path = scriptElement.src;
const lastSlash = path.lastIndexOf('/');
const baseFolder = lastSlash < 0 ? path : path.substring(0, lastSlash + 1);

if (typeof document !== 'undefined') {
  if (window.mermaid && typeof window.mermaid.detectors === 'object') {
    window.mermaid.detectors.push({ id: 'example-diagram', detector });
  } else {
    window.mermaid = {};
    window.mermaid.detectors = [{ id: 'example-diagram', detector }];
  }

  /*
   * Wait for document loaded before starting the execution.
   */
  window.addEventListener(
    'load',
    () => {
      if (window.mermaid && typeof window.mermaid.detectors === 'object') {
        window.mermaid.detectors.push({
          id: 'example-diagram',
          detector,
          path: baseFolder,
        });
      }
    },
    false
  );
}
