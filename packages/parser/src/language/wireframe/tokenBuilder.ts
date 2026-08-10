import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class WireframeTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['wireframe-beta']);
  }
}
