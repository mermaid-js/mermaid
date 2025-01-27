import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class FileTreeTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['fileTree-beta']);
  }
}
