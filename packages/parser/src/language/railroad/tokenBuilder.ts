import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class RailroadTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['railroad', 'railroad-diagram']);
  }
}
