import c4 from '../diagrams/c4/c4Detector';
import flowchart from '../diagrams/flowchart/flowDetector';
import flowchartV2 from '../diagrams/flowchart/flowDetector-v2';
import er from '../diagrams/er/erDetector';
import git from '../diagrams/git/gitGraphDetector';
import gantt from '../diagrams/gantt/ganttDetector';
import info from '../diagrams/info/infoDetector';
import pie from '../diagrams/pie/pieDetector';
import requirement from '../diagrams/requirement/requirementDetector';
import sequence from '../diagrams/sequence/sequenceDetector';
import classDiagram from '../diagrams/class/classDetector';
import classDiagramV2 from '../diagrams/class/classDetector-V2';
import state from '../diagrams/state/stateDetector';
import stateV2 from '../diagrams/state/stateDetector-V2';
import journey from '../diagrams/user-journey/journeyDetector';
import error from '../diagrams/error/errorDetector';
import flowchartElk from '../diagrams/flowchart/elk/detector';
import timeline from '../diagrams/timeline/detector';
import mindmap from '../diagrams/mindmap/detector';
import { registerLazyLoadedDiagrams } from './detectType';
import { registerDiagram } from './diagramAPI';

let hasLoadedDiagrams = false;
export const addDiagrams = () => {
  if (hasLoadedDiagrams) {
    return;
  }
  // This is added here to avoid race-conditions.
  // We could optimize the loading logic somehow.
  hasLoadedDiagrams = true;
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
      renderer: {}, // should never be used
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
    error,
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
    // TODO @knsv: Should v2 come before flowchart?
    // This will fail few unit tests as they expect graph to be detected as flowchart, but it is detected as flowchart-v2.
    flowchart,
    flowchartV2,
    mindmap,
    timeline,
    git,
    stateV2,
    state,
    journey
  );
};
