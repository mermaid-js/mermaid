import { MermaidTokenBuilder } from '../common/tokenBuilder.js';

export class InfoTokenBuilder extends MermaidTokenBuilder {
  constructor() {
    super(['info', 'showInfo']);
  }
}
