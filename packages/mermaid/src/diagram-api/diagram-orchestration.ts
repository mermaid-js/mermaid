import c4 from '../diagrams/c4/c4Detector.js';
import flowchart from '../diagrams/flowchart/flowDetector.js';
import flowchartV2 from '../diagrams/flowchart/flowDetector-v2.js';
import er from '../diagrams/er/erDetector.js';
import git from '../diagrams/git/gitGraphDetector.js';
import gantt from '../diagrams/gantt/ganttDetector.js';
import { info } from '../diagrams/info/infoDetector.js';
import { pie } from '../diagrams/pie/pieDetector.js';
import quadrantChart from '../diagrams/quadrant-chart/quadrantDetector.js';
import xychart from '../diagrams/xychart/xychartDetector.js';
import requirement from '../diagrams/requirement/requirementDetector.js';
import sequence from '../diagrams/sequence/sequenceDetector.js';
import classDiagram from '../diagrams/class/classDetector.js';
import classDiagramV2 from '../diagrams/class/classDetector-V2.js';
import state from '../diagrams/state/stateDetector.js';
import stateV2 from '../diagrams/state/stateDetector-V2.js';
import journey from '../diagrams/user-journey/journeyDetector.js';
import errorDiagram from '../diagrams/error/errorDiagram.js';
import flowchartElk from '../diagrams/flowchart/elk/detector.js';
import timeline from '../diagrams/timeline/detector.js';
import mindmap from '../diagrams/mindmap/detector.js';
import sankey from '../diagrams/sankey/sankeyDetector.js';
import { registerLazyLoadedDiagrams } from './detectType.js';
import { registerDiagram } from './diagramAPI.js';

let hasLoadedDiagrams = false;
export const addDiagrams = () => {
  if (hasLoadedDiagrams) {
    return;
  }
  // This is added here to avoid race-conditions.
  // We could optimize the loading logic somehow.
  hasLoadedDiagrams = true;
  registerDiagram('error', errorDiagram, (text) => {
    return text.toLowerCase().trim() === 'error';
  });
  registerDiagram(
    '---',
    // --- diagram type may appear if YAML front-matter is not parsed correctly
    {
      db: {
        clear: () => {
          // Quite ok, clear needs to be there for --- to work as a regular diagram
        },
      },
      styles: {}, // should never be used
      renderer: {
        draw: () => {
          // should never be used
        },
      },
      parser: {
        parser: { yy: {} },
        parse: () => {
          throw new Error(
            'Diagrams beginning with --- are not valid. ' +
              'If you were trying to use a YAML front-matter, please ensure that ' +
              "you've correctly opened and closed the YAML front-matter with un-indented `---` blocks"
          );
        },
      },
      init: () => null, // no op
    },
    (text) => {
      return text.toLowerCase().trimStart().startsWith('---');
    }
  );
  // Ordering of detectors is important. The first one to return true will be used.
  registerLazyLoadedDiagrams(
    c4,
    classDiagramV2,
    classDiagram,
    er,
    gantt,
    info,
    pie,
    requirement,
    sequence,
    flowchartElk,
    flowchartV2,
    flowchart,
    mindmap,
    timeline,
    git,
    stateV2,
    state,
    journey,
    quadrantChart,
    sankey,
    xychart
  );
};
