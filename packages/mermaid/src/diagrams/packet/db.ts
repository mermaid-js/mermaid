import { getConfig as commonGetConfig } from '../../config.js';
import type { PacketDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import { CommonDB } from '../common/commonDb.js';
import type { PacketWord } from './types.js';
const DEFAULT_PACKET_CONFIG: Required<PacketDiagramConfig> = DEFAULT_CONFIG.packet;

export class PacketDB implements DiagramDB {
  private readonly common = new CommonDB();
  private packet: PacketWord[] = [];

  public getConfig() {
    const config = cleanAndMerge({
      ...DEFAULT_PACKET_CONFIG,
      ...commonGetConfig().packet,
    });
    if (config.showBits) {
      config.paddingY += 10;
    }
    return config;
  }

  public getPacket() {
    return this.packet;
  }

  public pushWord(word: PacketWord) {
    if (word.length > 0) {
      this.packet.push(word);
    }
  }

  public clear() {
    this.common.clear();
    this.packet = [];
  }

  public setAccTitle = this.common.setAccTitle;
  public getAccTitle = this.common.getAccTitle;
  public setDiagramTitle = this.common.setDiagramTitle;
  public getDiagramTitle = this.common.getDiagramTitle;
  public getAccDescription = this.common.getAccDescription;
  public setAccDescription = this.common.setAccDescription;
}
