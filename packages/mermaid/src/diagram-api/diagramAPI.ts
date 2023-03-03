import { addDetector } from './detectType.ts';
import { log as _log, setLogLevel as _setLogLevel } from '../logger.ts';
import { getConfig as _getConfig } from '../config.ts';
import { sanitizeText as _sanitizeText } from '../diagrams/common/common.ts';
import { setupGraphViewbox as _setupGraphViewbox } from '../setupGraphViewbox.js';
import { addStylesForDiagram } from '../styles.ts';
import { DiagramDefinition, DiagramDetector } from './types.ts';
import * as _commonDb from '../commonDb.ts';
import { parseDirective as _parseDirective } from '../directiveUtils.ts';

/*
  Packaging and exposing resources for external diagrams so that they can import
  diagramAPI and have access to select parts of mermaid common code required to
  create diagrams working like the internal diagrams.
*/
export const log = _log;
export const setLogLevel = _setLogLevel;
export const getConfig = _getConfig;
export const sanitizeText = (text: string) => _sanitizeText(text, getConfig());
export const setupGraphViewbox = _setupGraphViewbox;
export const getCommonDb = () => {
  return _commonDb;
};
export const parseDirective = (p: any, statement: string, context: string, type: string) =>
  _parseDirective(p, statement, context, type);

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
  if (diagrams[id]) {
    throw new Error(`Diagram ${id} already registered.`);
  }
  diagrams[id] = diagram;
  if (detector) {
    addDetector(id, detector);
  }
  addStylesForDiagram(id, diagram.styles);

  if (diagram.injectUtils) {
    diagram.injectUtils(
      log,
      setLogLevel,
      getConfig,
      sanitizeText,
      setupGraphViewbox,
      getCommonDb(),
      parseDirective
    );
  }
};

export const getDiagram = (name: string): DiagramDefinition => {
  if (name in diagrams) {
    return diagrams[name];
  }
  throw new Error(`Diagram ${name} not found.`);
};

export class DiagramNotFoundError extends Error {
  constructor(message: string) {
    super(`Diagram ${message} not found.`);
  }
}
