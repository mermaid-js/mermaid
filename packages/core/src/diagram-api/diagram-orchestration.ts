import c4 from '../diagrams/c4/c4Detector.js';
import flowchartV2 from '../diagrams/flowchart/flowDetector-v2.js';
import agentflow from '../diagrams/agentflow/afDetector.js';
import swimlanes from '../diagrams/swimlanes/detector.js';
import git from '../diagrams/git/gitGraphDetector.js';
import xychart from '../diagrams/xychart/xychartDetector.js';
import sequence from '../diagrams/sequence/sequenceDetector.js';
import classDiagramV2 from '../diagrams/class/classDetector-V2.js';
import stateV2 from '../diagrams/state/stateDetector-V2.js';
import errorDiagram from '../diagrams/error/errorDiagram.js';
import flowchartElk from '../diagrams/flowchart/elk/detector.js';
import { registerLazyLoadedDiagrams } from './detectType.js';
import { registerDiagram } from './diagramAPI.js';
import { usecase } from '../diagrams/usecase/usecaseDetector.js';
import '../type.d.ts';

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

  if (injected.includeLargeFeatures) {
    registerLazyLoadedDiagrams(flowchartElk);
  }

  // Ordering of detectors is important. The first one to return true will be used.
  registerLazyLoadedDiagrams(
    agentflow,
    c4,
    classDiagramV2,
    sequence,
    swimlanes,
    flowchartV2,
    git,
    stateV2,
    xychart,
    usecase
  );
};
