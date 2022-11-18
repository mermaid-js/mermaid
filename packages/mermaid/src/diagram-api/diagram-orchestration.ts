import { registerDiagram } from './diagramAPI';
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

// @ts-ignore: TODO Fix ts errors
import journeyParser from '../diagrams/user-journey/parser/journey';
import { journeyDetector } from '../diagrams/user-journey/journeyDetector';
import journeyDb from '../diagrams/user-journey/journeyDb';
import journeyRenderer from '../diagrams/user-journey/journeyRenderer';
import journeyStyles from '../diagrams/user-journey/styles';

import errorRenderer from '../diagrams/error/errorRenderer';
import errorStyles from '../diagrams/error/styles';
import { addDiagram } from './detectType';

let hasLoadedDiagrams = false;
export const addDiagrams = () => {
  if (hasLoadedDiagrams) {
    return;
  }
  // This is added here to avoid race-conditions.
  // We could optimize the loading logic somehow.
  hasLoadedDiagrams = true;
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
  addDiagram(c4);
  addDiagram(classDiagram);
  addDiagram(classDiagramV2);
  addDiagram(er);
  addDiagram(gantt);
  addDiagram(info);
  addDiagram(pie);
  addDiagram(requirement);
  addDiagram(sequence);
  addDiagram(flowchart);
  addDiagram(flowchartV2);
  addDiagram(git);
  addDiagram(state);
  addDiagram(stateV2);
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
};
