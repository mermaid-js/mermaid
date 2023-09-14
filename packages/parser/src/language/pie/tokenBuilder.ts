import { MermaidTokenBuilder } from '../common/index.js';

export class PieTokenBuilder extends MermaidTokenBuilder {
  public constructor() {
    super(['pie', 'showData']);
  }
}
