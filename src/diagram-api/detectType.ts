// @ts-nocheck
const directive =
  /[%]{2}[{]\s*(?:(?:(\w+)\s*:|(\w+))\s*(?:(?:(\w+))|((?:(?![}][%]{2}).|\r?\n)*))?\s*)(?:[}][%]{2})?/gi;
const anyComment = /\s*%%.*\n/gm;
const detectors = {};
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
 * }} [cnf]
 * @returns {string} A graph definition key
 */
const detectType = function (text, cnf) {
  text = text.replace(directive, '').replace(anyComment, '\n');
  if (text.match(/^\s*C4Context|C4Container|C4Component|C4Dynamic|C4Deployment/)) {
    return 'c4';
  }

  if (text.match(/^\s*sequenceDiagram/)) {
    return 'sequence';
  }

  if (text.match(/^\s*gantt/)) {
    return 'gantt';
  }
  if (text.match(/^\s*classDiagram-v2/)) {
    return 'classDiagram';
  }
  if (text.match(/^\s*classDiagram/)) {
    if (cnf && cnf.class && cnf.class.defaultRenderer === 'dagre-wrapper') return 'classDiagram';
    return 'class';
  }

  if (text.match(/^\s*stateDiagram-v2/)) {
    return 'stateDiagram';
  }

  if (text.match(/^\s*stateDiagram/)) {
    if (cnf && cnf.class && cnf.state.defaultRenderer === 'dagre-wrapper') return 'stateDiagram';
    return 'state';
  }

  // if (text.match(/^\s*gitGraph/)) {
  //   return 'gitGraph';
  // }
  if (text.match(/^\s*flowchart/)) {
    return 'flowchart-v2';
  }

  if (text.match(/^\s*info/)) {
    return 'info';
  }
  if (text.match(/^\s*pie/)) {
    return 'pie';
  }

  if (text.match(/^\s*erDiagram/)) {
    return 'er';
  }

  if (text.match(/^\s*journey/)) {
    return 'journey';
  }

  if (text.match(/^\s*requirement/) || text.match(/^\s*requirementDiagram/)) {
    return 'requirement';
  }
  if (cnf && cnf.flowchart && cnf.flowchart.defaultRenderer === 'dagre-wrapper')
    return 'flowchart-v2';
  const k = Object.keys(detectors);
  for (let i = 0; i < k.length; i++) {
    const key = k[i];
    const dia = detectors[key];
    if (dia && dia.detector(text)) {
      return key;
    }
  }
  return 'flowchart';
};
export const addDetector = (key, detector) => {
  detectors[key] = {
    detector,
  };
};
export default detectType;
