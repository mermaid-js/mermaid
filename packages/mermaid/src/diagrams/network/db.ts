import { getConfig as commonGetConfig } from '../../config.js';
import type { NetworkDiagramConfig } from '../../config.type.js';
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
import type { NetworkLinkData, NetworkNodeData, NetworkSubnetData } from './types.js';

const DEFAULT_NETWORK_CONFIG: Required<NetworkDiagramConfig> = DEFAULT_CONFIG.network;

export class NetworkDBImpl implements DiagramDB {
  private nodes: NetworkNodeData[] = [];
  private nodesById = new Map<string, NetworkNodeData>();
  private links: NetworkLinkData[] = [];
  private subnets: NetworkSubnetData[] = [];

  public getConfig(): Required<NetworkDiagramConfig> {
    return cleanAndMerge({
      ...DEFAULT_NETWORK_CONFIG,
      ...commonGetConfig().network,
    });
  }

  public addNode(node: NetworkNodeData) {
    if (this.nodesById.has(node.id)) {
      const existing = this.nodesById.get(node.id)!;
      if (node.nodeType && node.nodeType !== 'default') {
        existing.nodeType = node.nodeType;
      }
      if (node.label && node.label !== node.id) {
        existing.label = node.label;
      }
      if (node.subnet) {
        existing.subnet = node.subnet;
      }
      if (node.meta && node.meta.length > 0) {
        existing.meta = [...(existing.meta ?? []), ...node.meta];
      }
      return;
    }
    this.nodes.push(node);
    this.nodesById.set(node.id, node);
  }

  public addLink(link: NetworkLinkData) {
    if (!this.nodesById.has(link.source)) {
      this.addNode({ id: link.source, nodeType: 'default', label: link.source });
    }
    if (!this.nodesById.has(link.target)) {
      this.addNode({ id: link.target, nodeType: 'default', label: link.target });
    }
    this.links.push(link);
  }

  public addSubnet(subnet: NetworkSubnetData) {
    this.subnets.push(subnet);
    for (const nodeId of subnet.nodeIds) {
      const node = this.nodesById.get(nodeId);
      if (node) {
        node.subnet = subnet.id;
      }
    }
  }

  public getNodes() {
    return this.nodes;
  }

  public getLinks() {
    return this.links;
  }

  public getSubnets() {
    return this.subnets;
  }

  public clear() {
    commonClear();
    this.nodes = [];
    this.nodesById = new Map();
    this.links = [];
    this.subnets = [];
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getAccDescription = getAccDescription;
  public setAccDescription = setAccDescription;
}
