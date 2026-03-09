import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class VsmTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['vsm']);
  }
}
