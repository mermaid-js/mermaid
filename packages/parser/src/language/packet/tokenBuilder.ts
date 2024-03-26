import { AbstractMermaidTokenBuilder } from '../common/index.js';
import type { PacketServices } from './module.js';

export class PacketTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor(services: PacketServices) {
    super(['packet-beta'], services);
  }
}
