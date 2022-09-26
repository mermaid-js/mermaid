// @ts-ignore: TODO Fix ts errors
import { mindmapDetector } from './mindmapDetector';

if (typeof document !== 'undefined') {
  if (window.mermaid && typeof window.mermaid.detectors === 'object') {
    window.mermaid.detectors.push({ id: 'mindmap', detector: mindmapDetector });
  } else {
    // console.error('window.mermaid.detectors was not found!'); // eslint-disable-line no-console
    window.mermaid = {};
    window.mermaid.detectors = [{ id: 'mindmap', detector: mindmapDetector }];
    // console.error('Detectors now:', window.mermaid.detectors); // eslint-disable-line no-console
  }

  /*!
   * Wait for document loaded before starting the execution.
   */
  window.addEventListener(
    'load',
    () => {
      if (window.mermaid && typeof window.mermaid.detectors === 'object') {
        window.mermaid.detectors.push({ id: 'mindmap', detector: mindmapDetector });
        // console.error(window.mermaid.detectors); // eslint-disable-line no-console
      }
    },
    false
  );
}
