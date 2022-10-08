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
const connectCallbacks: Record<string, any> = {}; // TODO fix, eslint-disable-line @typescript-eslint/no-explicit-any
export interface Detectors {
  [key: string]: DiagramDetector;
}

export const registerDiagram = (
  id: string,
  diagram: DiagramDefinition,
  detector: DiagramDetector,
  callback?: (
    _log: any,
    _setLogLevel: any,
    _getConfig: any,
    _sanitizeText: any,
    _setupGraphViewbox: any
  ) => void
) => {
  if (diagrams[id]) {
    throw new Error(`Diagram ${id} already registered.`);
  }
  diagrams[id] = diagram;
  addDetector(id, detector);
  addStylesForDiagram(id, diagram.styles);
  if (typeof callback !== 'undefined') {
    callback(log, setLogLevel, getConfig, sanitizeText, setupGraphViewbox);
  }
};

export const getDiagram = (name: string): DiagramDefinition => {
  if (name in diagrams) {
    return diagrams[name];
  }
  throw new Error(`Diagram ${name} not found.`);
};

/**
 *
 * @param sScriptSrc
 */
export const loadDiagram = (sScriptSrc: string) =>
  new Promise((resolve) => {
    const oHead = document.getElementsByTagName('HEAD')[0];
    const oScript = document.createElement('script');
    oScript.type = 'text/javascript';
    oScript.src = sScriptSrc;
    oHead.appendChild(oScript);
    oScript.onload = () => {
      resolve(true);
    };
  });
