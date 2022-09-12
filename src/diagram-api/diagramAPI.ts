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

export const registerDiagram = (
  id: string,
  diagram: DiagramDefinition,
  detector: DiagramDetector
) => {
  if (diagrams[id]) {
    log.warn(`Diagram ${id} already registered.`);
  }
  diagrams[id] = diagram;
  addDetector(id, detector);
  addStylesForDiagram(id, diagram.styles);
};

export const getDiagram = (name: string): DiagramDefinition => {
  if (name in diagrams) {
    return diagrams[name];
  }
  throw new Error(`Diagram ${name} not found.`);
};
