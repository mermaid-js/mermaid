import { MermaidConfig } from '../config.type';

export interface InjectUtils {
  _log: any;
  _setLogLevel: any;
  _getConfig: any;
  _sanitizeText: any;
  _setupGraphViewbox: any;
}

export interface DiagramDefinition {
  db: any;
  renderer: any;
  parser: any;
  styles: any;
  init?: (config: MermaidConfig) => void;
  injectUtils?: (
    _log: InjectUtils['_log'],
    _setLogLevel: InjectUtils['_setLogLevel'],
    _getConfig: InjectUtils['_getConfig'],
    _sanitizeText: InjectUtils['_sanitizeText'],
    _setupGraphViewbox: InjectUtils['_setupGraphViewbox']
  ) => void;
}

export interface DetectorRecord {
  detector: DiagramDetector;
  loader?: DiagramLoader;
}

export type DiagramDetector = (text: string, config?: MermaidConfig) => boolean;
export type DiagramLoader = (() => Promise<{ id: string; diagram: DiagramDefinition }>) | null;
