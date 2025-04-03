import type { MermaidConfig } from '../config.type.js';
import { UnknownDiagramError } from '../errors.js';
import { log } from '../logger.js';
import { anyCommentRegex, directiveRegex, frontMatterRegex } from './regexes.js';
import type { DetectorRecord, ExternalDiagramDefinition } from './types.js';

export const diagramDefinitions: Record<string, Omit<DetectorRecord, 'id'>> = {};

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
  text = text
    .replace(frontMatterRegex, '')
    .replace(directiveRegex, '')
    .replace(anyCommentRegex, '\n');
  for (const [key, { detector }] of Object.entries(diagramDefinitions)) {
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
  for (const definition of diagrams) {
    addDiagramDefinition(definition);
  }
};

export const addDiagramDefinition = ({ id, ...definition }: DetectorRecord) => {
  if (diagramDefinitions[id]) {
    log.warn(`Detector with key ${id} already exists. Overwriting.`);
  }
  if (
    definition.examples &&
    definition.examples.filter(({ isDefault }) => isDefault).length !== 1
  ) {
    throw new Error(
      `Diagram with key ${id} must have exactly one default example. Set isDefault to true for one example.`
    );
  }
  diagramDefinitions[id] = definition;
  log.debug(`Detector with key ${id} added${definition.loader ? ' with loader' : ''}`);
};

export const getDiagramLoader = (key: string) => {
  return diagramDefinitions[key].loader;
};
