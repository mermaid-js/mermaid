import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class XYTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['xy-beta', 'xychart-beta']);
  }
}
