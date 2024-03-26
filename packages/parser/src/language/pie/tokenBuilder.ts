import { AbstractMermaidTokenBuilder } from '../common/index.js';
import type { PieServices } from './module.js';

export class PieTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor(services: PieServices) {
    super(['pie', 'showData'], services);
  }
}
