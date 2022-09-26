import { addDetector, DiagramDetector as _DiagramDetector } from './detectType';
import { log as _log, setLogLevel as _setLogLevel } from '../logger';
import { getConfig as _getConfig } from '../config';
import { sanitizeText as _sanitizeText } from '../diagrams/common/common';
import { MermaidConfig } from '../config.type';
import { setupGraphViewbox as _setupGraphViewbox } from '../setupGraphViewbox';
import { addStylesForDiagram } from '../styles';

/*
  Packaging and exposing resources for externa diagrams so that they can import
  diagramAPI and have access to selct parts of mermaid common code reqiored to
  create diagrams worling like the internal diagrams.
*/
export const log = _log;
export const setLogLevel = _setLogLevel;
export type DiagramDetector = _DiagramDetector;
export const getConfig = _getConfig;
export const sanitizeText = (text: string) => _sanitizeText(text, getConfig());
export const setupGraphViewbox = _setupGraphViewbox;

export interface DiagramDefinition {
  db: any;
  renderer: any;
  parser: any;
  styles: any;
  init?: (config: MermaidConfig) => void;
}

const diagrams: Record<string, DiagramDefinition> = {};
const connectCallbacks: Record<string, any> = {}; // TODO fix, eslint-disable-line @typescript-eslint/no-explicit-any
export interface Detectors {
  [key: string]: DiagramDetector;
}

export const registerDetector = (id: string, detector: DiagramDetector) => {
  addDetector(id, detector);
};

export const registerDiagram = (
  id: string,
  diagram: DiagramDefinition,
  callback: (
    _log: any,
    _setLogLevel: any,
    _getConfig: any,
    _sanitizeText: any,
    _setupGraphViewbox: any
  ) => void
) => {
  if (diagrams[id]) {
    log.warn(`Diagram ${id} already registered.`);
  }
  diagrams[id] = diagram;
  addStylesForDiagram(id, diagram.styles);
  connectCallbacks[id] = callback;
};

export const getDiagram = (name: string): DiagramDefinition => {
  if (name in diagrams) {
    return diagrams[name];
  }
  throw new Error(`Diagram ${name} not found.`);
};
