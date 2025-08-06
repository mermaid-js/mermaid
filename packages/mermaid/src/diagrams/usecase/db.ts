import type { DiagramDB } from '../../diagram-api/types.js';
import type { UsecaseDiagramConfig, UsecaseNode } from './types.js';
import { cleanAndMerge } from '../../utils.js';

export class UsecaseDiagramDB implements DiagramDB {
  public getNodes() {
    return [];
  }

  public getConfig() {
    return cleanAndMerge({}) as Required<UsecaseDiagramConfig>;
  }

  public addNode(node: UsecaseNode, level: number) {
    if (level === 0) {
      // TODO
    }
  }

  public getRoot() {
    return { name: '', children: [] };
  }

  public addClass(_id: string, _style: string) {
    // TODO
  }
  public getClasses() {
    // TODO
  }

  public getStylesForClass(_classSelector: string) {
    // TODO
  }

  public clear() {
    // commonClear();
  }
}
