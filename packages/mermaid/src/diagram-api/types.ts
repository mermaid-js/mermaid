import { MermaidConfig } from '../config.type.js';

export interface InjectUtils {
  _log: any;
  _setLogLevel: any;
  _getConfig: any;
  _sanitizeText: any;
  _setupGraphViewbox: any;
  _commonDb: any;
  _parseDirective: any;
}

/**
 * Generic Diagram DB that may apply to any diagram type.
 */
export interface DiagramDb {
  clear?: () => void;
  setDiagramTitle?: (title: string) => void;
  setDisplayMode?: (title: string) => void;
  getAccTitle?: () => string;
  getAccDescription?: () => string;
  bindFunctions?: (element: Element) => void;
}

export interface DiagramDefinition {
  db: DiagramDb;
  renderer: any;
  parser: any;
  styles: any;
  init?: (config: MermaidConfig) => void;
  injectUtils?: (
    _log: InjectUtils['_log'],
    _setLogLevel: InjectUtils['_setLogLevel'],
    _getConfig: InjectUtils['_getConfig'],
    _sanitizeText: InjectUtils['_sanitizeText'],
    _setupGraphViewbox: InjectUtils['_setupGraphViewbox'],
    _commonDb: InjectUtils['_commonDb'],
    _parseDirective: InjectUtils['_parseDirective']
  ) => void;
}

export interface DetectorRecord {
  detector: DiagramDetector;
  loader?: DiagramLoader;
}

export interface ExternalDiagramDefinition {
  id: string;
  detector: DiagramDetector;
  loader: DiagramLoader;
}

export interface ParseDirectiveDefinition {
  (statement: string, context: string, type: string): void;
}

export type DiagramDetector = (text: string, config?: MermaidConfig) => boolean;
export type DiagramLoader = () => Promise<{ id: string; diagram: DiagramDefinition }>;
