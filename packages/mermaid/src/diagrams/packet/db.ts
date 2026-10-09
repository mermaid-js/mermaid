import { getConfig as commonGetConfig } from '../../config.js';
import type { PacketDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { PacketWord } from './types.js';
const DEFAULT_PACKET_CONFIG: Required<PacketDiagramConfig> = DEFAULT_CONFIG.packet;

export class PacketDB implements DiagramDB {
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
    commonClear();
    this.packet = [];
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getAccDescription = getAccDescription;
  public setAccDescription = setAccDescription;
}
