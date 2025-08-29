export interface Example {
  title: string;
  code: string;
  isDefault?: boolean;
}

export interface DiagramMetadata {
  id: string;
  name: string;
  description: string;
  examples: Example[];
}
