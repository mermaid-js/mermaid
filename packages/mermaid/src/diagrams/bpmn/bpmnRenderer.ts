import type { DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { LayoutData } from '../../rendering-util/types.js';
import utils from '../../utils.js';
import type { BpmnDB } from './bpmnTypes.js';

/** Main draw function using the unified rendering system. */
const draw: DrawDefinition = async (_text, id, _version, diag) => {
  log.info('Drawing bpmn diagram (unified)', id);

  const bpmnDb = diag.db as BpmnDB;
  const data4Layout = bpmnDb.getData() as LayoutData & {
    layoutAlgorithm: string;
    diagramPadding: number;
    useMaxWidth: boolean;
    diagramId: string;
  };
  // Required so edge/node DOM ids are unique across multiple diagrams on a page.
  data4Layout.diagramId = id;

  // The band-based diagrams pin themselves to the swimlane engine; a plain flow
  // falls back to whatever is registered (dagre by default).
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(data4Layout.layoutAlgorithm, {
    fallback: 'dagre',
  });

  const svg = getDiagramElement(id, data4Layout.config.securityLevel);

  await render(data4Layout, svg);

  const padding = data4Layout.diagramPadding ?? 8;
  utils.insertTitle(svg, 'bpmnDiagramTitleText', 0, bpmnDb.getDiagramTitle?.() ?? '');
  setupViewPortForSVG(svg, padding, 'bpmnDiagram', data4Layout.useMaxWidth);
};

export const renderer = { draw };
