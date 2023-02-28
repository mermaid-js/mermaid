import { MermaidConfig } from '../config.type';
import { log } from '../logger';
import type {
  DetectorRecord,
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from './types';
import { frontMatterRegex } from './frontmatter';
import { getDiagram, registerDiagram } from './diagramAPI';
import { UnknownDiagramError } from '../errors';

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

  throw new UnknownDiagramError(
    `No diagram type detected matching given configuration for text: ${text}`
  );
};

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

export const loadRegisteredDiagrams = async () => {
  log.debug(`Loading registered diagrams`);
  // Load all lazy loaded diagrams in parallel
  const results = await Promise.allSettled(
    Object.entries(detectors).map(async ([key, { detector, loader }]) => {
      if (loader) {
        try {
          getDiagram(key);
        } catch (error) {
          try {
            // Register diagram if it is not already registered
            const { diagram, id } = await loader();
            registerDiagram(id, diagram, detector);
          } catch (err) {
            // Remove failed diagram from detectors
            log.error(`Failed to load external diagram with key ${key}. Removing from detectors.`);
            delete detectors[key];
            throw err;
          }
        }
      }
    })
  );
  const failed = results.filter((result) => result.status === 'rejected');
  if (failed.length > 0) {
    log.error(`Failed to load ${failed.length} external diagrams`);
    for (const res of failed) {
      log.error(res);
    }
    throw new Error(`Failed to load ${failed.length} external diagrams`);
  }
};

export const addDetector = (key: string, detector: DiagramDetector, loader?: DiagramLoader) => {
  if (detectors[key]) {
    log.error(`Detector with key ${key} already exists`);
  } else {
    detectors[key] = { detector, loader };
  }
  log.debug(`Detector with key ${key} added${loader ? ' with loader' : ''}`);
};

export const getDiagramLoader = (key: string) => {
  return detectors[key].loader;
};
