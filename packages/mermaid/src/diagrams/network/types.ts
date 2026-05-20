import type { NetworkDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';

export type NetworkNodeKind = string;

export const BUILTIN_NETWORK_NODE_KINDS = [
  'router',
  'switch',
  'server',
  'firewall',
  'cloud',
  'internet',
  'database',
  'default',
] as const;

export interface NetworkNodeData {
  id: string;
  nodeType: NetworkNodeKind;
  label: string;
  meta?: { key: string; value: string }[];
  subnet?: string;
}

export type NetworkLinkDirection = 'none' | 'forward' | 'backward' | 'both';

export interface NetworkLinkData {
  source: string;
  target: string;
  label?: string;
  direction: NetworkLinkDirection;
}

export interface NetworkSubnetData {
  id: string;
  label: string;
  nodeIds: string[];
}

export interface NetworkStyleOptions {
  nodeStrokeColor?: string;
  nodeStrokeWidth?: string;
  nodeFillColor?: string;
  linkColor?: string;
  linkWidth?: string;
  labelColor?: string;
  linkLabelColor?: string;
  titleColor?: string;
  titleFontSize?: string;
  subnetStrokeColor?: string;
  subnetFillColor?: string;
  subnetLabelColor?: string;
}

export interface NetworkDB extends DiagramDBBase<NetworkDiagramConfig> {
  addNode: (node: NetworkNodeData) => void;
  addLink: (link: NetworkLinkData) => void;
  addSubnet: (subnet: NetworkSubnetData) => void;
  getNodes: () => NetworkNodeData[];
  getLinks: () => NetworkLinkData[];
  getSubnets: () => NetworkSubnetData[];
}
