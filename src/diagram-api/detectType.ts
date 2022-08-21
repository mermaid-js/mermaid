import { MermaidConfig } from '../config.type';

export type DiagramDetector = (text: string) => boolean;

const directive =
  /[%]{2}[{]\s*(?:(?:(\w+)\s*:|(\w+))\s*(?:(?:(\w+))|((?:(?![}][%]{2}).|\r?\n)*))?\s*)(?:[}][%]{2})?/gi;
const anyComment = /\s*%%.*\n/gm;

const detectors: Record<string, DiagramDetector> = {};
const diagramMatchers: Record<string, RegExp> = {
  c4: /^\s*C4Context|C4Container|C4Component|C4Dynamic|C4Deployment/,
  sequence: /^\s*sequenceDiagram/,
  gantt: /^\s*gantt/,
  classDiagram: /^\s*classDiagram-v2/,
  stateDiagram: /^\s*stateDiagram-v2/,
  'flowchart-v2': /^\s*flowchart/,
  info: /^\s*info/,
  pie: /^\s*pie/,
  er: /^\s*erDiagram/,
  journey: /^\s*journey/,
  // gitGraph: /^\s*gitGraph/,
  requirement: /^\s*requirement(Diagram)?/,
};

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
  for (const [diagram, matcher] of Object.entries(diagramMatchers)) {
    if (text.match(matcher)) {
      return diagram;
    }
  }

  if (text.match(/^\s*classDiagram/)) {
    if (config?.class?.defaultRenderer === 'dagre-wrapper') return 'classDiagram';
    return 'class';
  }

  if (text.match(/^\s*stateDiagram/)) {
    if (config?.state?.defaultRenderer === 'dagre-wrapper') return 'stateDiagram';
    return 'state';
  }

  if (config?.flowchart?.defaultRenderer === 'dagre-wrapper') {
    return 'flowchart-v2';
  }

  for (const [key, detector] of Object.entries(detectors)) {
    if (detector(text)) {
      return key;
    }
  }

  return 'flowchart';
};

export const addDetector = (key: string, detector: DiagramDetector) => {
  detectors[key] = detector;
};
