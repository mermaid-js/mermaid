import { MermaidConfig } from '../config.type';

export type DiagramDetector = (text: string, config?: MermaidConfig) => boolean;

const directive =
  /[%]{2}[{]\s*(?:(?:(\w+)\s*:|(\w+))\s*(?:(?:(\w+))|((?:(?![}][%]{2}).|\r?\n)*))?\s*)(?:[}][%]{2})?/gi;
const anyComment = /\s*%%.*\n/gm;

const detectors: Record<string, DiagramDetector> = {};

/**
 * @function detectType Detects the type of the graph text. Takes into consideration the possible
 *   existence of an %%init directive
 *
 *   ```mermaid
 *   %%{initialize: {"startOnLoad": true, logLevel: "fatal" }}%%
 *   graph LR
 *    a-->b
 *    b-->c
 *    c-->d
 *    d-->e
 *    e-->f
 *    f-->g
 *    g-->h
 * ```
 * @param {string} text The text defining the graph
 * @param {{
 *   class: { defaultRenderer: string } | undefined;
 *   state: { defaultRenderer: string } | undefined;
 *   flowchart: { defaultRenderer: string } | undefined;
 * }} [config]
 * @returns {string} A graph definition key
 */
export const detectType = function (text: string, config?: MermaidConfig): string {
  text = text.replace(directive, '').replace(anyComment, '\n');

  // console.log(detectors);

  for (const [key, detector] of Object.entries(detectors)) {
    if (detector(text, config)) {
      return key;
    }
  }
  // TODO: #3391
  // throw new Error(`No diagram type detected for text: ${text}`);
  return 'flowchart';
};

export const addDetector = (key: string, detector: DiagramDetector) => {
  detectors[key] = detector;
};
