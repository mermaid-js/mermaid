import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class InfoTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['info', 'showInfo']);
  }
}
