import type { DomainBlock, Transition } from '@mermaid-js/parser';
import type { CynefinDiagramConfig } from '../../config.type.js';

export type DomainName = 'complex' | 'complicated' | 'clear' | 'chaotic' | 'confusion';

export interface CynefinItem {
  label: string;
}

export interface CynefinDomain {
  name: DomainName;
  items: CynefinItem[];
}

export interface CynefinTransition {
  from: DomainName;
  to: DomainName;
  label?: string;
}

export interface CynefinDB {
  clear(): void;
  getDiagramTitle(): string;
  setDiagramTitle(title: string): void;
  getAccTitle(): string;
  setAccTitle(title: string): void;
  getAccDescription(): string;
  setAccDescription(description: string): void;
  getDomains(): Map<DomainName, CynefinDomain>;
  getTransitions(): CynefinTransition[];
  setDomains(blocks: DomainBlock[]): void;
  setTransitions(transitions: Transition[]): void;
  getConfig(): Required<CynefinDiagramConfig>;
}
