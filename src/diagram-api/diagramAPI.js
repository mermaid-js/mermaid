import c4Db from '../diagrams/c4/c4Db';
import c4Renderer from '../diagrams/c4/c4Renderer';
import c4Parser from '../diagrams/c4/parser/c4Diagram';
import classDb from '../diagrams/class/classDb';
import classRenderer from '../diagrams/class/classRenderer';
import classRendererV2 from '../diagrams/class/classRenderer-v2';
import classParser from '../diagrams/class/parser/classDiagram';
import erDb from '../diagrams/er/erDb';
import erRenderer from '../diagrams/er/erRenderer';
import errorRenderer from '../diagrams/error/errorRenderer';
import erParser from '../diagrams/er/parser/erDiagram';
import flowDb from '../diagrams/flowchart/flowDb';
import flowRenderer from '../diagrams/flowchart/flowRenderer';
import flowRendererV2 from '../diagrams/flowchart/flowRenderer-v2';
import flowParser from '../diagrams/flowchart/parser/flow';
import ganttDb from '../diagrams/gantt/ganttDb';
import ganttRenderer from '../diagrams/gantt/ganttRenderer';
import ganttParser from '../diagrams/gantt/parser/gantt';
import infoDb from '../diagrams/info/infoDb';
import infoRenderer from '../diagrams/info/infoRenderer';
import infoParser from '../diagrams/info/parser/info';
import pieParser from '../diagrams/pie/parser/pie';
import pieDb from '../diagrams/pie/pieDb';
import pieRenderer from '../diagrams/pie/pieRenderer';
import requirementParser from '../diagrams/requirement/parser/requirementDiagram';
import requirementDb from '../diagrams/requirement/requirementDb';
import requirementRenderer from '../diagrams/requirement/requirementRenderer';
import sequenceParser from '../diagrams/sequence/parser/sequenceDiagram';
import sequenceDb from '../diagrams/sequence/sequenceDb';
import sequenceRenderer from '../diagrams/sequence/sequenceRenderer';
import stateParser from '../diagrams/state/parser/stateDiagram';
import stateDb from '../diagrams/state/stateDb';
import stateRenderer from '../diagrams/state/stateRenderer';
import stateRendererV2 from '../diagrams/state/stateRenderer-v2';
import journeyDb from '../diagrams/user-journey/journeyDb';
import journeyRenderer from '../diagrams/user-journey/journeyRenderer';
import journeyParser from '../diagrams/user-journey/parser/journey';
import { addDetector } from './detectType';

const diagrams = {
  c4: {
    db: c4Db,
    renderer: c4Renderer,
    parser: c4Parser,
    init: (cnf) => {
      c4Renderer.setConf(cnf.c4);
    },
  },
  class: {
    db: classDb,
    renderer: classRenderer,
    parser: classParser,
    init: (cnf) => {
      cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      classDb.clear();
    },
  },
  // Special diagram with error messages but setup as a regular diagram
  error: {
    db: {},
    renderer: errorRenderer,
    parser: { parser: { yy: {} }, parse: () => {} },
    init: () => {},
  },
  classDiagram: {
    db: classDb,
    renderer: classRendererV2,
    parser: classParser,
    init: (cnf) => {
      cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      classDb.clear();
    },
  },
  er: {
    db: erDb,
    renderer: erRenderer,
    parser: erParser,
  },
  flowchart: {
    db: flowDb,
    renderer: flowRenderer,
    parser: flowParser,
    init: (cnf) => {
      flowRenderer.setConf(cnf.flowchart);
      cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      flowDb.clear();
      flowDb.setGen('gen-1');
    },
  },
  'flowchart-v2': {
    db: flowDb,
    renderer: flowRendererV2,
    parser: flowParser,
    init: (cnf) => {
      flowRendererV2.setConf(cnf.flowchart);
      cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      flowDb.clear();
      flowDb.setGen('gen-2');
    },
  },
  gantt: {
    db: ganttDb,
    renderer: ganttRenderer,
    parser: ganttParser,
    init: (cnf) => {
      ganttRenderer.setConf(cnf.gantt);
    },
  },
  // git: {
  //   db: gitGraphAst,
  //   renderer: gitGraphRenderer,
  //   parser: gitGraphParser,
  // },
  info: {
    db: infoDb,
    renderer: infoRenderer,
    parser: infoParser,
  },
  pie: {
    db: pieDb,
    renderer: pieRenderer,
    parser: pieParser,
  },
  requirement: {
    db: requirementDb,
    renderer: requirementRenderer,
    parser: requirementParser,
  },
  sequence: {
    db: sequenceDb,
    renderer: sequenceRenderer,
    parser: sequenceParser,
    init: (cnf) => {
      cnf.sequence.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      if (cnf.sequenceDiagram) {
        // backwards compatibility
        sequenceRenderer.setConf(Object.assign(cnf.sequence, cnf.sequenceDiagram));
        console.error(
          '`mermaid config.sequenceDiagram` has been renamed to `config.sequence`. Please update your mermaid config.'
        );
      }
      sequenceDb.setWrap(cnf.wrap);
      sequenceRenderer.setConf(cnf.sequence);
    },
  },
  state: {
    db: stateDb,
    renderer: stateRenderer,
    parser: stateParser,
    init: (cnf) => {
      cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      stateDb.clear();
    },
  },
  stateDiagram: {
    db: stateDb,
    renderer: stateRendererV2,
    parser: stateParser,
    init: (cnf) => {
      cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
      stateDb.clear();
    },
  },
  journey: {
    db: journeyDb,
    renderer: journeyRenderer,
    parser: journeyParser,
    init: (cnf) => {
      journeyRenderer.setConf(cnf.journey);
      journeyDb.clear();
    },
  },
};
// console.log(sequenceDb);
export const registerDiagram = (id, parser, db, renderer, init, detector) => {
  diagrams[id] = { parser, db, renderer, init };
  addDetector(id, detector);
};

export const getDiagrams = () => {
  // console.log('diagrams', diagrams);
  return diagrams;
};
