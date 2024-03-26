import { AbstractMermaidTokenBuilder } from '../common/index.js';
import type { InfoServices } from './module.js';

export class InfoTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor(services: InfoServices) {
    super(['info', 'showInfo'], services);
  }
}
