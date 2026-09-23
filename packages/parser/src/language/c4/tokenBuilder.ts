import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class C4TokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['c4-beta']);
  }
}
