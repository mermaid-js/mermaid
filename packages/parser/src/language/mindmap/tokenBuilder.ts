import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class MindMapTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['mindmap']);
  }
}
