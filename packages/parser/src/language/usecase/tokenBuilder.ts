import { AbstractMermaidTokenBuilder } from '../common/index.js';

export class UsecaseTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['usecase']);
  }
}
