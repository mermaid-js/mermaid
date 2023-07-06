import { select } from 'd3';
import { getConfig } from '../config.js';
import type { HTML, SVG } from '../diagram-api/types.js';

interface SelectedElements {
  doc: Document;
  svg: SVG;
}

export const selectElementsForRender = (id: string): SelectedElements => {
  const { securityLevel } = getConfig();
  // Handle root and document for when rendering in sandbox mode
  let sandboxElement: HTML | undefined;
  let doc: Document = document;

  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  
  if(sandboxElement) {
    doc = sandboxElement.nodes()[0].contentDocument || doc;
  }
  
  // @ts-ignore - figure out how to assign HTML to document type
  const root: HTML = sandboxElement ? select(doc) : select('body');

  const svg: SVG = root.select('#' + id);
  return {
    doc,
    svg,
  };
};
