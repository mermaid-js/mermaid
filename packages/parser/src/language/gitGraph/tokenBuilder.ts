import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class GitGraphTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['gitGraph']);
  }
}
