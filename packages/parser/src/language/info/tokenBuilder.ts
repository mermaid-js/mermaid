import { MermaidTokenBuilder } from '../common/index.js';

export class InfoTokenBuilder extends MermaidTokenBuilder {
  public constructor() {
    super(['info', 'showInfo']);
  }
}
