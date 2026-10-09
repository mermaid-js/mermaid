import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class TreeViewTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['treeView-beta']);
  }
}
