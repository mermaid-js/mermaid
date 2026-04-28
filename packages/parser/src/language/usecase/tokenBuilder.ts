import { AbstractMermaidTokenBuilder } from '../common/tokenBuilder.js';

export class UsecaseTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super(['usecaseDiagram', 'useCase']);
  }
}
