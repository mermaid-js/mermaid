import type { DiagramDetector } from '../../diagram-api/detectType';
import { log } from '../../diagram-api/diagramAPI';
export const flowDetectorV2: DiagramDetector = (txt, config) => {
  log.info('Config in flowDetector-v2 defaultRenderer: ', config?.flowchart?.defaultRenderer);

  // If we have confgured to use cytoscape then we should always return false here
  if (config?.flowchart?.defaultRenderer === 'cytoscape') {
    log.info('flowDetector-v2 returning false');
    return false;
  } else {
    log.info('flowDetector-v2 not cytoscape');
  }

  // If we have confgured to use dagre-wrapper then we should return true in this function for graph code thus making it use the new flowchart diagram
  if (config?.flowchart?.defaultRenderer === 'dagre-wrapper' && txt.match(/^\s*graph/) !== null)
    return true;
  log.info('Config in flowDetector-v2 returning', txt.match(/^\s*flowchart/) !== null);
  return txt.match(/^\s*flowchart/) !== null;
};

/*
if (((_a = config === null || config === void 0 ? void 0 : config.flowchart) === null || _a === void 0 ? void 0 : _a.defaultRenderer) === 'dagre-wrapper1' && txt.match(/^\s*graph/) !== null)
*/
