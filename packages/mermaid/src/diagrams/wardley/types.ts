// ── Component types ──────────────────────────────────────────────────
export type ComponentType = 'standard' | 'anchor' | 'market' | 'ecosystem';
export type SourcingStrategy = 'build' | 'buy' | 'outsource';

export interface WardleyComponent {
  id: string;
  label: string;
  x: number; // 0 to 1, left to right (genesis to commodity) — also determines color
  y: number; // 0 to 1, bottom to top (infrastructure to user-facing)
  type: ComponentType;
  inertia: boolean;
  sourcing?: SourcingStrategy;
  labelOffset?: { dx: number; dy: number };
}

// ── Edges ────────────────────────────────────────────────────────────
export type EdgeType = 'dependency' | 'flow' | 'constraint';

export interface WardleyEdge {
  source: string;
  target: string;
  type: EdgeType;
  annotation?: string;
}

// ── Evolution ────────────────────────────────────────────────────────
export interface WardleyEvolution {
  sourceId: string;
  targetX: number; // target position on evolution axis (0-1)
  targetLabel?: string; // optional new label after evolution
}

// ── Pipeline ─────────────────────────────────────────────────────────
export interface WardleyPipelineChild {
  id: string;
  label: string;
  x: number; // evolution position (0-1)
}

export interface WardleyPipeline {
  id: string;
  label: string;
  x: number; // evolution center
  y: number; // visibility position
  startX: number; // leftmost evolution boundary
  endX: number; // rightmost evolution boundary
  children: WardleyPipelineChild[];
}

// ── Annotations & notes ──────────────────────────────────────────────
export interface WardleyNote {
  text: string;
  x: number;
  y: number;
}

export interface WardleyAnnotation {
  number: number;
  text: string;
  targetId: string;
}

// ── Areas & overlays ─────────────────────────────────────────────────
export type AreaType = 'pioneers' | 'settlers' | 'townplanners' | 'interest';

export interface WardleyArea {
  label: string;
  areaType: AreaType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// ── Submap ───────────────────────────────────────────────────────────
export interface WardleySubmap {
  id: string;
  label: string;
  x: number;
  y: number;
  ref: string;
}

// ── Accelerators ─────────────────────────────────────────────────────
export type AcceleratorType = 'accelerator' | 'deaccelerator';

export interface WardleyAccelerator {
  targetId: string;
  type: AcceleratorType;
}

// ── Theme variables passed to styles/renderer ────────────────────────
export interface WardleyThemeVars {
  genesisColor: string;
  customColor: string;
  productColor: string;
  commodityColor: string;
  stageBackground0: string;
  stageBackground1: string;
  stageBackground2: string;
  stageBackground3: string;
  axisColor: string;
  textColor: string;
  labelBackground: string;
  labelBorder: string;
  edgeColor: string;
  arrowColor: string;
  componentStroke: string;
  backgroundColor: string;
  pipelineFill: string;
  inertiaColor: string;
  evolveArrowColor: string;
  flowColor: string;
  constraintColor: string;
  pioneersColor: string;
  settlersColor: string;
  townplannersColor: string;
  interestColor: string;
}

// ── Database interface ───────────────────────────────────────────────
export interface WardleyDB {
  clear(): void;

  // Accessibility
  getDiagramTitle(): string;
  setDiagramTitle(title: string): void;
  getAccTitle(): string;
  setAccTitle(title: string): void;
  getAccDescription(): string;
  setAccDescription(description: string): void;

  // Components
  addComponent(
    id: string,
    label: string,
    x: number,
    y: number,
    options?: {
      type?: ComponentType;
      inertia?: boolean;
      sourcing?: SourcingStrategy;
      labelOffset?: { dx: number; dy: number };
    }
  ): void;
  getComponents(): WardleyComponent[];
  getComponent(id: string): WardleyComponent | undefined;

  // Edges
  addEdge(source: string, target: string, type?: EdgeType, annotation?: string): void;
  getEdges(): WardleyEdge[];

  // Evolution
  addEvolution(sourceId: string, targetX: number, targetLabel?: string): void;
  getEvolutions(): WardleyEvolution[];

  // Pipelines
  addPipeline(
    id: string,
    label: string,
    x: number,
    y: number,
    startX: number,
    endX: number,
    children: WardleyPipelineChild[]
  ): void;
  getPipelines(): WardleyPipeline[];

  // Notes
  addNote(text: string, x: number, y: number): void;
  getNotes(): WardleyNote[];

  // Annotations
  addAnnotation(number: number, text: string, targetId: string): void;
  getAnnotations(): WardleyAnnotation[];

  // Areas
  addArea(label: string, areaType: AreaType, x1: number, y1: number, x2: number, y2: number): void;
  getAreas(): WardleyArea[];

  // Submaps
  addSubmap(id: string, label: string, x: number, y: number, ref: string): void;
  getSubmaps(): WardleySubmap[];

  // Accelerators
  addAccelerator(targetId: string, type: AcceleratorType): void;
  getAccelerators(): WardleyAccelerator[];

  // Custom axis labels
  setXAxisLabels(labels: string[]): void;
  getXAxisLabels(): string[];
  setYAxisLabels(labels: string[]): void;
  getYAxisLabels(): string[];

  // Config
  getConfig(): Record<string, unknown>;
}
