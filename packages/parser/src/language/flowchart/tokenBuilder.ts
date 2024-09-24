import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class FlowchartTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['flowchart']);
  }
}
