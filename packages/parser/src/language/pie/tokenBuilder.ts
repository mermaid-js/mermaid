import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class PieTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['pie', 'showData']);
  }
}
