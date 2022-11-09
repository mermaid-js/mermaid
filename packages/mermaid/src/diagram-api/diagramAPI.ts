import { addDetector } from './detectType';
import { log as _log, setLogLevel as _setLogLevel } from '../logger';
import { getConfig as _getConfig } from '../config';
import { sanitizeText as _sanitizeText } from '../diagrams/common/common';
import { setupGraphViewbox as _setupGraphViewbox } from '../setupGraphViewbox';
import { addStylesForDiagram } from '../styles';
import { DiagramDefinition, DiagramDetector } from './types';

/*
  Packaging and exposing resources for externa diagrams so that they can import
  diagramAPI and have access to selct parts of mermaid common code reqiored to
  create diagrams worling like the internal diagrams.
*/
export const log = _log;
export const setLogLevel = _setLogLevel;
export const getConfig = _getConfig;
export const sanitizeText = (text: string) => _sanitizeText(text, getConfig());
export const setupGraphViewbox = _setupGraphViewbox;

const diagrams: Record<string, DiagramDefinition> = {};
export interface Detectors {
  [key: string]: DiagramDetector;
}

/**
 * Registers the given diagram with Mermaid.
 *
 * Can be used for third-party custom diagrams.
 *
 * @param id - A unique ID for the given diagram.
 * @param diagram - The diagram definition.
 * @param detector - Function that returns `true` if a given mermaid text is this diagram definition.
 */
export const registerDiagram = (
  id: string,
  diagram: DiagramDefinition,
  detector?: DiagramDetector
) => {
  log.debug(`Registering diagram ${id}`);
  if (diagrams[id]) {
    log.warn(`Diagram ${id} already registered.`);
    // The error throw is commented out to as it breaks pages where you have multiple diagrams,
    // it can happen that rendering of the same type of diagram is initiated while the previous
    // one is still being imported. import deals with this and only one diagram is imported in
    // the end.
    // throw new Error(`Diagram ${id} already registered.`);
  }
  diagrams[id] = diagram;
  if (detector) {
    addDetector(id, detector);
  }
  addStylesForDiagram(id, diagram.styles);

  if (diagram.injectUtils) {
    diagram.injectUtils(log, setLogLevel, getConfig, sanitizeText, setupGraphViewbox);
  }
  log.debug(`Registered diagram ${id}. ${Object.keys(diagrams).join(', ')} diagrams registered.`);
};

export const getDiagram = (name: string): DiagramDefinition => {
  log.debug(`Getting diagram ${name}. ${Object.keys(diagrams).join(', ')} diagrams registered.`);
  if (name in diagrams) {
    return diagrams[name];
  }
  throw new DiagramNotFoundError(name);
};

export class DiagramNotFoundError extends Error {
  constructor(message: string) {
    super(`Diagram ${message} not found.`);
  }
}
