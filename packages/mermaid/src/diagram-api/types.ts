import { Diagram } from '../Diagram.js';
import { MermaidConfig } from '../config.type.js';
import type * as d3 from 'd3';

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
export interface DiagramDB {
  clear?: () => void;
  setDiagramTitle?: (title: string) => void;
  setDisplayMode?: (title: string) => void;
  getAccTitle?: () => string;
  getAccDescription?: () => string;
  bindFunctions?: (element: Element) => void;
}

export interface DiagramDefinition {
  db: DiagramDB;
  renderer: any;
  parser: any;
  styles?: any;
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

export type DiagramDetector = (text: string, config?: MermaidConfig) => boolean;
export type DiagramLoader = () => Promise<{ id: string; diagram: DiagramDefinition }>;

/**
 * Type for function draws diagram in the tag with id: id based on the graph definition in text.
 *
 * @param text - The text of the diagram.
 * @param id - The id of the diagram which will be used as a DOM element id.
 * @param version - MermaidJS version from package.json.
 * @param diagramObject - A standard diagram containing the DB and the text and type etc of the diagram.
 */
export type DrawDefinition = (
  text: string,
  id: string,
  version: string,
  diagramObject: Diagram
) => void;

/**
 * Type for function parse directive from diagram code.
 *
 * @param statement -
 * @param context -
 * @param type -
 */
export type ParseDirectiveDefinition = (statement: string, context: string, type: string) => void;

export type HTML = d3.Selection<HTMLIFrameElement, unknown, Element, unknown>;

export type SVG = d3.Selection<SVGSVGElement, unknown, Element, unknown>;

export type getDiagramStyles = (options?: any) => string;
