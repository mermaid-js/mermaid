import { registerDiagram } from './diagramAPI';
// @ts-ignore: TODO Fix ts errors
import gitGraphParser from '../diagrams/git/parser/gitGraph';
import { gitGraphDetector } from '../diagrams/git/gitGraphDetector';
import gitGraphDb from '../diagrams/git/gitGraphAst';
import gitGraphRenderer from '../diagrams/git/gitGraphRenderer';
import gitGraphStyles from '../diagrams/git/styles';

// @ts-ignore: TODO Fix ts errors
import c4Parser from '../diagrams/c4/parser/c4Diagram';
import { c4Detector } from '../diagrams/c4/c4Detector';
import c4Db from '../diagrams/c4/c4Db';
import c4Renderer from '../diagrams/c4/c4Renderer';
import c4Styles from '../diagrams/c4/styles';

// @ts-ignore: TODO Fix ts errors
import classParser from '../diagrams/class/parser/classDiagram';
import { classDetector } from '../diagrams/class/classDetector';
import { classDetectorV2 } from '../diagrams/class/classDetector-V2';
import classDb from '../diagrams/class/classDb';
import classRenderer from '../diagrams/class/classRenderer';
import classRendererV2 from '../diagrams/class/classRenderer-v2';
import classStyles from '../diagrams/class/styles';

// @ts-ignore: TODO Fix ts errors
import erParser from '../diagrams/er/parser/erDiagram';
import { erDetector } from '../diagrams/er/erDetector';
import erDb from '../diagrams/er/erDb';
import erRenderer from '../diagrams/er/erRenderer';
import erStyles from '../diagrams/er/styles';

// @ts-ignore: TODO Fix ts errors
import flowParser from '../diagrams/flowchart/parser/flow';
import { flowDetector } from '../diagrams/flowchart/flowDetector';
import { flowDetectorV2 } from '../diagrams/flowchart/flowDetector-v2';
import flowDb from '../diagrams/flowchart/flowDb';
import flowRenderer from '../diagrams/flowchart/flowRenderer';
import flowRendererV2 from '../diagrams/flowchart/flowRenderer-v2';
import flowStyles from '../diagrams/flowchart/styles';

// @ts-ignore: TODO Fix ts errors
import ganttParser from '../diagrams/gantt/parser/gantt';
import { ganttDetector } from '../diagrams/gantt/ganttDetector';
import ganttDb from '../diagrams/gantt/ganttDb';
import ganttRenderer from '../diagrams/gantt/ganttRenderer';
import ganttStyles from '../diagrams/gantt/styles';

// @ts-ignore: TODO Fix ts errors
import infoParser from '../diagrams/info/parser/info';
import infoDb from '../diagrams/info/infoDb';
import infoRenderer from '../diagrams/info/infoRenderer';
import { infoDetector } from '../diagrams/info/infoDetector';
import infoStyles from '../diagrams/info/styles';

// @ts-ignore: TODO Fix ts errors
import pieParser from '../diagrams/pie/parser/pie';
import { pieDetector } from '../diagrams/pie/pieDetector';
import pieDb from '../diagrams/pie/pieDb';
import pieRenderer from '../diagrams/pie/pieRenderer';
import pieStyles from '../diagrams/pie/styles';

// @ts-ignore: TODO Fix ts errors
import requirementParser from '../diagrams/requirement/parser/requirementDiagram';
import { requirementDetector } from '../diagrams/requirement/requirementDetector';
import requirementDb from '../diagrams/requirement/requirementDb';
import requirementRenderer from '../diagrams/requirement/requirementRenderer';
import requirementStyles from '../diagrams/requirement/styles';

// @ts-ignore: TODO Fix ts errors
import sequenceParser from '../diagrams/sequence/parser/sequenceDiagram';
import { sequenceDetector } from '../diagrams/sequence/sequenceDetector';
import sequenceDb from '../diagrams/sequence/sequenceDb';
import sequenceRenderer from '../diagrams/sequence/sequenceRenderer';
import sequenceStyles from '../diagrams/sequence/styles';

// @ts-ignore: TODO Fix ts errors
import stateParser from '../diagrams/state/parser/stateDiagram';
import { stateDetector } from '../diagrams/state/stateDetector';
import { stateDetectorV2 } from '../diagrams/state/stateDetector-V2';
import stateDb from '../diagrams/state/stateDb';
import stateRenderer from '../diagrams/state/stateRenderer';
import stateRendererV2 from '../diagrams/state/stateRenderer-v2';
import stateStyles from '../diagrams/state/styles';

// @ts-ignore: TODO Fix ts errors
import journeyParser from '../diagrams/user-journey/parser/journey';
import { journeyDetector } from '../diagrams/user-journey/journeyDetector';
import journeyDb from '../diagrams/user-journey/journeyDb';
import journeyRenderer from '../diagrams/user-journey/journeyRenderer';
import journeyStyles from '../diagrams/user-journey/styles';
import { setConfig } from '../config';

import errorRenderer from '../diagrams/error/errorRenderer';
import errorStyles from '../diagrams/error/styles';

import flowchartElk from '../diagrams/flowchart/elk/detector';
import { registerLazyLoadedDiagrams } from './detectType';

// Lazy loaded diagrams
import timelineDetector from '../diagrams/timeline/detector';
import mindmapDetector from '../diagrams/mindmap/detector';

let hasLoadedDiagrams = false;
export const addDiagrams = () => {
  if (hasLoadedDiagrams) {
    return;
  }
  // This is added here to avoid race-conditions.
  // We could optimize the loading logic somehow.
  hasLoadedDiagrams = true;
  registerLazyLoadedDiagrams(flowchartElk, timelineDetector, mindmapDetector);

  registerDiagram(
    'error',
    // Special diagram with error messages but setup as a regular diagram
    {
      db: {
        clear: () => {
          // Quite ok, clear needs to be there for error to work as a regular diagram
        },
      },
      styles: errorStyles,
      renderer: errorRenderer,
      parser: {
        parser: { yy: {} },
        parse: () => {
          // no op
        },
      },
      init: () => {
        // no op
      },
    },
    (text) => text.toLowerCase().trim() === 'error'
  );
  registerDiagram(
    '---',
    // --- diagram type may appear if YAML front-matter is not parsed correctly
    {
      db: {
        clear: () => {
          // Quite ok, clear needs to be there for --- to work as a regular diagram
        },
      },
      styles: errorStyles, // should never be used
      renderer: errorRenderer, // should never be used
      parser: {
        parser: { yy: {} },
        parse: () => {
          throw new Error(
            'Diagrams beginning with --- are not valid. ' +
              'If you were trying to use a YAML front-matter, please ensure that ' +
              "you've correctly opened and closed the YAML front-matter with unindented `---` blocks"
          );
        },
      },
      init: () => null, // no op
    },
    (text) => {
      return text.toLowerCase().trimStart().startsWith('---');
    }
  );

  registerDiagram(
    'c4',
    {
      parser: c4Parser,
      db: c4Db,
      renderer: c4Renderer,
      styles: c4Styles,
      init: (cnf) => {
        c4Renderer.setConf(cnf.c4);
      },
    },
    c4Detector
  );
  registerDiagram(
    'class',
    {
      parser: classParser,
      db: classDb,
      renderer: classRenderer,
      styles: classStyles,
      init: (cnf) => {
        if (!cnf.class) {
          cnf.class = {};
        }
        cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        classDb.clear();
      },
    },
    classDetector
  );
  registerDiagram(
    'classDiagram',
    {
      parser: classParser,
      db: classDb,
      renderer: classRendererV2,
      styles: classStyles,
      init: (cnf) => {
        if (!cnf.class) {
          cnf.class = {};
        }
        cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        classDb.clear();
      },
    },
    classDetectorV2
  );
  registerDiagram(
    'er',
    {
      parser: erParser,
      db: erDb,
      renderer: erRenderer,
      styles: erStyles,
    },
    erDetector
  );
  registerDiagram(
    'gantt',
    {
      parser: ganttParser,
      db: ganttDb,
      renderer: ganttRenderer,
      styles: ganttStyles,
    },
    ganttDetector
  );
  registerDiagram(
    'info',
    {
      parser: infoParser,
      db: infoDb,
      renderer: infoRenderer,
      styles: infoStyles,
    },
    infoDetector
  );
  registerDiagram(
    'pie',
    {
      parser: pieParser,
      db: pieDb,
      renderer: pieRenderer,
      styles: pieStyles,
    },
    pieDetector
  );
  registerDiagram(
    'requirement',
    {
      parser: requirementParser,
      db: requirementDb,
      renderer: requirementRenderer,
      styles: requirementStyles,
    },
    requirementDetector
  );
  registerDiagram(
    'sequence',
    {
      parser: sequenceParser,
      db: sequenceDb,
      renderer: sequenceRenderer,
      styles: sequenceStyles,
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
    },
    sequenceDetector
  );
  registerDiagram(
    'state',
    {
      parser: stateParser,
      db: stateDb,
      renderer: stateRenderer,
      styles: stateStyles,
      init: (cnf) => {
        if (!cnf.state) {
          cnf.state = {};
        }
        cnf.state.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        stateDb.clear();
      },
    },
    stateDetector
  );
  registerDiagram(
    'stateDiagram',
    {
      parser: stateParser,
      db: stateDb,
      renderer: stateRendererV2,
      styles: stateStyles,
      init: (cnf) => {
        if (!cnf.state) {
          cnf.state = {};
        }
        cnf.state.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        stateDb.clear();
      },
    },
    stateDetectorV2
  );
  registerDiagram(
    'journey',
    {
      parser: journeyParser,
      db: journeyDb,
      renderer: journeyRenderer,
      styles: journeyStyles,
      init: (cnf) => {
        journeyRenderer.setConf(cnf.journey);
        journeyDb.clear();
      },
    },
    journeyDetector
  );

  registerDiagram(
    'flowchart',
    {
      parser: flowParser,
      db: flowDb,
      renderer: flowRendererV2,
      styles: flowStyles,
      init: (cnf) => {
        if (!cnf.flowchart) {
          cnf.flowchart = {};
        }
        // TODO, broken as of 2022-09-14 (13809b50251845475e6dca65cc395761be38fbd2)
        cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        flowRenderer.setConf(cnf.flowchart);
        flowDb.clear();
        flowDb.setGen('gen-1');
      },
    },
    flowDetector
  );
  registerDiagram(
    'flowchart-v2',
    {
      parser: flowParser,
      db: flowDb,
      renderer: flowRendererV2,
      styles: flowStyles,
      init: (cnf) => {
        if (!cnf.flowchart) {
          cnf.flowchart = {};
        }
        cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        // flowchart-v2 uses dagre-wrapper, which doesn't have access to flowchart cnf
        setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
        flowRendererV2.setConf(cnf.flowchart);
        flowDb.clear();
        flowDb.setGen('gen-2');
      },
    },
    flowDetectorV2
  );
  registerDiagram(
    'gitGraph',
    { parser: gitGraphParser, db: gitGraphDb, renderer: gitGraphRenderer, styles: gitGraphStyles },
    gitGraphDetector
  );
};
