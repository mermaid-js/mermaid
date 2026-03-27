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
  setDomains(blocks: any[]): void;
  setTransitions(transitions: any[]): void;
  getConfig(): Record<string, unknown>;
}
