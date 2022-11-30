import { MermaidConfig } from '../config.type';
import { log } from '../logger';
import { DetectorRecord, DiagramDetector, DiagramLoader } from './types';
import { ExternalDiagramDefinition } from '../diagram-api/types';
import { frontMatterRegex } from './frontmatter';

const directive = /%{2}{\s*(?:(\w+)\s*:|(\w+))\s*(?:(\w+)|((?:(?!}%{2}).|\r?\n)*))?\s*(?:}%{2})?/gi;
const anyComment = /\s*%%.*\n/gm;

const detectors: Record<string, DetectorRecord> = {};

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
  text = text.replace(frontMatterRegex, '').replace(directive, '').replace(anyComment, '\n');
  for (const [key, { detector }] of Object.entries(detectors)) {
    const diagram = detector(text, config);
    if (diagram) {
      return key;
    }
  }

  throw new Error(`No diagram type detected for text: ${text}`);
};

export const registerLazyLoadedDiagrams = (...diagrams: ExternalDiagramDefinition[]) => {
  for (const { id, detector, loader } of diagrams) {
    addDetector(id, detector, loader);
  }
};

export const addDetector = (key: string, detector: DiagramDetector, loader?: DiagramLoader) => {
  if (detectors[key]) {
    throw new Error(`Detector with key ${key} already exists`);
  }
  detectors[key] = { detector, loader };
  log.debug(`Detector with key ${key} added${loader ? ' with loader' : ''}`);
};

export const getDiagramLoader = (key: string) => detectors[key].loader;
