import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class MindmapTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['mindmap']);
  }
}
