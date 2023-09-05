import { MermaidTokenBuilder } from '../common/tokenBuilder.js';

export class PieTokenBuilder extends MermaidTokenBuilder {
  constructor() {
    super(['pie', 'showData']);
  }
}
