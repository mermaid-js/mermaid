import type { DiagramDB } from './types.js';

/**
 * Base class for diagram DBs that need scoped DOM element IDs.
 * Provides the diagramId field and setter used to prefix domIds
 * for uniqueness across multiple diagrams on the same page.
 */
export abstract class ScopedDiagramDB implements DiagramDB {
  protected diagramId = '';

  public setDiagramId(svgElementId: string) {
    this.diagramId = svgElementId;
  }
}
