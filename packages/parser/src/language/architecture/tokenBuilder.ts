import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class ArchitectureTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['architecture']);
  }
}
