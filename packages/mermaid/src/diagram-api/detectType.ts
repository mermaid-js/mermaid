import type { MermaidConfig } from '../config.type.js';
import { log } from '../logger.js';
import type {
  DetectorRecord,
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from './types.js';
import { anyCommentRegex, directiveRegex, frontMatterRegex } from './regexes.js';
import { UnknownDiagramError } from '../errors.js';

export const detectors: Record<string, DetectorRecord> = {};

/**
 * Detects the type of the graph text.
 *
 * Takes into consideration the possible existence of an `%%init` directive
 *
 * @param text - The text defining the graph. For example:
 *
 * ```mermaid
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
 *
 * @param config - The mermaid config.
 * @returns A graph definition key
 */
export const detectType = function (text: string, config?: MermaidConfig): string {
  // Strip header prelude (front matter, directives, comments, blank lines) only at the top
  // Then detect based on the first significant keyword to avoid false positives in labels/strings
  const headerlessText = stripHeaderPrelude(text);
  const cleanedText = text
    .replace(frontMatterRegex, '') // no-op after stripHeaderPrelude, but safe
    .replace(directiveRegex, '') // defensive if any directive remains at the top
    .replace(anyCommentRegex, '\n');

  // Robust anchored check for sequence only (after header prelude);
  // keep inside the loop so that detection before diagram registration still throws
  if (detectors.flowchart.detector(headerlessText, config)) {
    return 'flowchart';
  }
  if (detectors.sequence.detector(headerlessText, config)) {
    return 'sequence';
  }

  if (detectors.classDiagram.detector(headerlessText, config)) {
    return 'classDiagram';
  }
  if (detectors.class.detector(headerlessText, config)) {
    return 'class';
  }

  // Fallback to registered detectors in order
  for (const [key, { detector }] of Object.entries(detectors)) {
    const diagram = detector(cleanedText, config);
    if (diagram) {
      return key;
    }
  }

  throw new UnknownDiagramError(
    `No diagram type detected matching given configuration for text: ${text}`
  );
};

// Remove header prelude (front matter, directives, comments, blank lines) from the start only
function stripHeaderPrelude(input: string): string {
  let s = input;

  // Remove leading BOM if present
  s = s.replace(/^\uFEFF/, '');

  // Remove Jekyll-style front matter at the very top
  s = s.replace(frontMatterRegex, '');

  // Iteratively remove top-of-file blocks: directives, comment lines, and blank lines
  // - Directives: %%{ ... }%% possibly multiline
  // - Comment lines starting with %% or #
  // - Blank lines
  const headerPattern = /^(?:\s*%%{[\S\s]*?}%{2}\s*|\s*%%.*\r?\n|\s*#.*\r?\n|\s*\r?\n)*/;
  const before = s;
  s = s.replace(headerPattern, '');

  // If nothing changed, return; otherwise, there could be another front matter after directives (rare)
  if (s === before) {
    return s;
  }

  // One extra pass for safety (handles stacked front matter blocks or multiple directives)
  s = s.replace(frontMatterRegex, '');
  s = s.replace(headerPattern, '');

  return s;
}

/**
 * Registers lazy-loaded diagrams to Mermaid.
 *
 * The diagram function is loaded asynchronously, so that diagrams are only loaded
 * if the diagram is detected.
 *
 * @remarks
 * Please note that the order of diagram detectors is important.
 * The first detector to return `true` is the diagram that will be loaded
 * and used, so put more specific detectors at the beginning!
 *
 * @param diagrams - Diagrams to lazy load, and their detectors, in order of importance.
 */
export const registerLazyLoadedDiagrams = (...diagrams: ExternalDiagramDefinition[]) => {
  for (const { id, detector, loader } of diagrams) {
    addDetector(id, detector, loader);
  }
};

export const addDetector = (key: string, detector: DiagramDetector, loader?: DiagramLoader) => {
  if (detectors[key]) {
    log.warn(`Detector with key ${key} already exists. Overwriting.`);
  }
  detectors[key] = { detector, loader };
  log.debug(`Detector with key ${key} added${loader ? ' with loader' : ''}`);
};

export const getDiagramLoader = (key: string) => {
  return detectors[key].loader;
};
