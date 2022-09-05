import c4Db from '../diagrams/c4/c4Db';
import c4Renderer from '../diagrams/c4/c4Renderer';
import c4Styles from '../diagrams/c4/styles';
// @ts-ignore
import c4Parser from '../diagrams/c4/parser/c4Diagram';
import classDb from '../diagrams/class/classDb';
import classRenderer from '../diagrams/class/classRenderer';
import classRendererV2 from '../diagrams/class/classRenderer-v2';
import classStyles from '../diagrams/class/styles';
// @ts-ignore
import classParser from '../diagrams/class/parser/classDiagram';
import erDb from '../diagrams/er/erDb';
import erRenderer from '../diagrams/er/erRenderer';
// @ts-ignore
import erParser from '../diagrams/er/parser/erDiagram';
import erStyles from '../diagrams/er/styles';
import flowDb from '../diagrams/flowchart/flowDb';
import flowRenderer from '../diagrams/flowchart/flowRenderer';
import flowRendererV2 from '../diagrams/flowchart/flowRenderer-v2';
import flowStyles from '../diagrams/flowchart/styles';
// @ts-ignore
import flowParser from '../diagrams/flowchart/parser/flow';
import ganttDb from '../diagrams/gantt/ganttDb';
import ganttRenderer from '../diagrams/gantt/ganttRenderer';
// @ts-ignore
import ganttParser from '../diagrams/gantt/parser/gantt';
import ganttStyles from '../diagrams/gantt/styles';

import infoDb from '../diagrams/info/infoDb';
import infoRenderer from '../diagrams/info/infoRenderer';
// @ts-ignore
import infoParser from '../diagrams/info/parser/info';
import infoStyles from '../diagrams/info/styles';
// @ts-ignore
import pieParser from '../diagrams/pie/parser/pie';
import pieDb from '../diagrams/pie/pieDb';
import pieRenderer from '../diagrams/pie/pieRenderer';
import pieStyles from '../diagrams/pie/styles';
// @ts-ignore
import requirementParser from '../diagrams/requirement/parser/requirementDiagram';
import requirementDb from '../diagrams/requirement/requirementDb';
import requirementRenderer from '../diagrams/requirement/requirementRenderer';
import requirementStyles from '../diagrams/requirement/styles';
// @ts-ignore
import sequenceParser from '../diagrams/sequence/parser/sequenceDiagram';
import sequenceDb from '../diagrams/sequence/sequenceDb';
import sequenceRenderer from '../diagrams/sequence/sequenceRenderer';
import sequenceStyles from '../diagrams/sequence/styles';
// @ts-ignore
import stateParser from '../diagrams/state/parser/stateDiagram';
import stateDb from '../diagrams/state/stateDb';
import stateRenderer from '../diagrams/state/stateRenderer';
import stateRendererV2 from '../diagrams/state/stateRenderer-v2';
import stateStyles from '../diagrams/state/styles';
import journeyDb from '../diagrams/user-journey/journeyDb';
import journeyRenderer from '../diagrams/user-journey/journeyRenderer';
import journeyStyles from '../diagrams/user-journey/styles';
// @ts-ignore
import journeyParser from '../diagrams/user-journey/parser/journey';
import { addDetector, DiagramDetector } from './detectType';
import { log as _log } from '../logger';
import { getConfig as _getConfig } from '../config';
import { sanitizeText as _sanitizeText } from '../diagrams/common/common';
import { MermaidConfig } from '../config.type';
import { setupGraphViewbox as _setupGraphViewbox } from '../setupGraphViewbox';
import { addStylesForDiagram } from '../styles';

export interface DiagramDefinition {
  db: any;
  renderer: any;
  parser: any;
  styles: any;
  init?: (config: MermaidConfig) => void;
}

const diagrams: Record<string, DiagramDefinition> = {
  c4: {
    db: c4Db,
    renderer: c4Renderer,
    parser: c4Parser,
    init: (cnf) => {
      c4Renderer.setConf(cnf.c4);
    },
    styles: c4Styles,
  },
  class: {
    db: classDb,
    renderer: classRenderer,
    parser: classParser,
    init: (cnf) => {
      if (!cnf.class) {
        cnf.class = {};
      }
      cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      classDb.clear();
    },
    styles: classStyles,
  },
  classDiagram: {
    db: classDb,
    renderer: classRendererV2,
    parser: classParser,
    init: (cnf) => {
      if (!cnf.class) {
        cnf.class = {};
      }
      cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      classDb.clear();
    },
    styles: classStyles,
  },
  er: {
    db: erDb,
    renderer: erRenderer,
    parser: erParser,
    styles: erStyles,
  },
  flowchart: {
    db: flowDb,
    renderer: flowRenderer,
    parser: flowParser,
    init: (cnf) => {
      flowRenderer.setConf(cnf.flowchart);
      if (!cnf.flowchart) {
        cnf.flowchart = {};
      }
      cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      flowDb.clear();
      flowDb.setGen('gen-1');
    },
    styles: flowStyles,
  },
  'flowchart-v2': {
    db: flowDb,
    renderer: flowRendererV2,
    parser: flowParser,
    init: (cnf) => {
      flowRendererV2.setConf(cnf.flowchart);
      if (!cnf.flowchart) {
        cnf.flowchart = {};
      }
      cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      flowDb.clear();
      flowDb.setGen('gen-2');
    },
    styles: flowStyles,
  },
  gantt: {
    db: ganttDb,
    renderer: ganttRenderer,
    parser: ganttParser,
    styles: ganttStyles,
  },
  info: {
    db: infoDb,
    renderer: infoRenderer,
    parser: infoParser,
    styles: infoStyles,
  },
  pie: {
    db: pieDb,
    renderer: pieRenderer,
    parser: pieParser,
    styles: pieStyles,
  },
  requirement: {
    db: requirementDb,
    renderer: requirementRenderer,
    parser: requirementParser,
    styles: requirementStyles,
  },
  sequence: {
    db: sequenceDb,
    renderer: sequenceRenderer,
    parser: sequenceParser,
    init: (cnf) => {
      if (!cnf.sequence) {
        cnf.sequence = {};
      }
      cnf.sequence.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      if ('sequenceDiagram' in cnf) {
        throw new Error(
          '`mermaid config.sequenceDiagram` has been renamed to `config.sequence`. Please update your mermaid config.'
        );
      }
      sequenceDb.setWrap(cnf.wrap);
      sequenceRenderer.setConf(cnf.sequence);
    },
    styles: sequenceStyles,
  },
  state: {
    db: stateDb,
    renderer: stateRenderer,
    parser: stateParser,
    init: (cnf) => {
      if (!cnf.state) {
        cnf.state = {};
      }
      cnf.state.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      stateDb.clear();
    },
    styles: stateStyles,
  },
  stateDiagram: {
    db: stateDb,
    renderer: stateRendererV2,
    parser: stateParser,
    init: (cnf) => {
      if (!cnf.state) {
        cnf.state = {};
      }
      cnf.state.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      stateDb.clear();
    },
    styles: stateStyles,
  },
  journey: {
    db: journeyDb,
    renderer: journeyRenderer,
    parser: journeyParser,
    init: (cnf) => {
      journeyRenderer.setConf(cnf.journey);
      journeyDb.clear();
    },
    styles: journeyStyles,
  },
};

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

export const log = _log;
export const getConfig = _getConfig;
export const sanitizeText = (text:string) => _sanitizeText(text, getConfig());
export const setupGraphViewbox = _setupGraphViewbox;
