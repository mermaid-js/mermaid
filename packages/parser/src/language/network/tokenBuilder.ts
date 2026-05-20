import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class NetworkTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['network', 'networkDiagram']);
  }
}
