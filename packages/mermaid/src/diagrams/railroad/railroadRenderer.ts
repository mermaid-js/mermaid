import { Diagram } from '../../Diagram.js';
import * as configApi from '../../config.js';
import type { DrawDefinition, HTML, SVG } from '../../diagram-api/types.js';
import { select } from 'd3';
// import { configureSvgSize } from '../../setupGraphViewbox.js';
// import { Uid } from '../../rendering-util/uid.js';

const fetchSVGElement = (id: string): SVG => {
  // Get config
  const { securityLevel } = configApi.getConfig();

  // Handle root and document for when rendering in sandbox mode
  let sandboxElement: HTML | undefined;
  let document: Document | null | undefined;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
    document = sandboxElement.nodes()[0].contentDocument;
  }

  // @ts-ignore - figure out how to assign HTML to document type
  const root: HTML = (sandboxElement && document) ? select(document) : select('body');
  const svg: SVG = root.select('#' + id);
  return svg;
}

/**
 * Draws Railroad diagram.
 *
 * @param text - The text of the diagram
 * @param id - The id of the diagram which will be used as a DOM element id¨
 * @param _version - Mermaid version from package.json
 * @param diagObj - A standard diagram containing the db and the text and type etc of the diagram
 */
export const draw: DrawDefinition = (text: string, id: string, _version: string, diagObj: Diagram): void => {
  const svg: SVG = fetchSVGElement(id);
  
  // const defaultRailroadConfig = configApi!.defaultConfig!.railroad!;
  // Establish svg dimensions and get width and height
  //
  // const width = conf?.width || defaultRailroadConfig.width!;
  // const height = conf?.height || defaultRailroadConfig.width!;
  // const useMaxWidth = conf?.useMaxWidth || defaultRailroadConfig.useMaxWidth!;

  // configureSvgSize(svg, height, width, useMaxWidth);

  // Compute layout
  // 
};

export default {
  draw,
};
