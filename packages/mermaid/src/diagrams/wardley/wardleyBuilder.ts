export interface WardleyNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
  className?: string;
  labelOffsetX?: number;
  labelOffsetY?: number;
  inPipeline?: boolean;
  isPipelineParent?: boolean;
  inertia?: boolean;
  sourceStrategy?: 'build' | 'buy' | 'outsource' | 'market';
}

export interface WardleyLink {
  source: string;
  target: string;
  dashed?: boolean;
  label?: string;
  flow?: 'forward' | 'backward' | 'bidirectional';
}

export interface WardleyTrend {
  nodeId: string;
  targetX: number;
  targetY: number;
}

export interface WardleyArea {
  name: string;
  x: number;
  y: number;
}

export interface WardleyPipeline {
  nodeId: string;
  componentIds: string[];
}

export interface WardleyAnnotation {
  number: number;
  coordinates: { x: number; y: number }[];
  text?: string;
}

export interface WardleyNote {
  text: string;
  x: number;
  y: number;
}

export interface WardleyAccelerator {
  name: string;
  x: number;
  y: number;
}

export interface WardleyDeaccelerator {
  name: string;
  x: number;
  y: number;
}

export interface WardleyAxesConfig {
  xLabel?: string;
  yLabel?: string;
  stages?: string[];
  stageBoundaries?: number[]; // Optional custom boundaries for stages (0.0 to 1.0)
}

export interface WardleyBuildResult {
  nodes: WardleyNode[];
  links: WardleyLink[];
  trends: WardleyTrend[];
  areas: WardleyArea[];
  pipelines: WardleyPipeline[];
  annotations: WardleyAnnotation[];
  notes: WardleyNote[];
  accelerators: WardleyAccelerator[];
  deaccelerators: WardleyDeaccelerator[];
  annotationsBox?: { x: number; y: number };
  axes: WardleyAxesConfig;
  size?: { width: number; height: number };
}

export class WardleyBuilder {
  private nodes = new Map<string, WardleyNode>();
  private links: WardleyLink[] = [];
  private trends = new Map<string, WardleyTrend>();
  private areas: WardleyArea[] = [];
  private pipelines = new Map<string, WardleyPipeline>();
  private annotations: WardleyAnnotation[] = [];
  private notes: WardleyNote[] = [];
  private accelerators: WardleyAccelerator[] = [];
  private deaccelerators: WardleyDeaccelerator[] = [];
  private annotationsBox?: { x: number; y: number };
  private axes: WardleyAxesConfig = {};
  private size?: { width: number; height: number };

  public addNode(node: WardleyNode) {
    const existing = this.nodes.get(node.id) ?? { id: node.id, label: node.label };
    const merged: WardleyNode = {
      ...existing,
      ...node,
      className: node.className ?? existing.className,
      labelOffsetX: node.labelOffsetX ?? existing.labelOffsetX,
      labelOffsetY: node.labelOffsetY ?? existing.labelOffsetY,
    };
    this.nodes.set(node.id, merged);
  }

  public addLink(link: WardleyLink) {
    this.links.push(link);
  }

  public addTrend(trend: WardleyTrend) {
    this.trends.set(trend.nodeId, trend);
  }

  public addArea(area: WardleyArea) {
    this.areas.push(area);
  }

  public startPipeline(nodeId: string) {
    this.pipelines.set(nodeId, { nodeId, componentIds: [] });

    // Mark the parent node as a pipeline parent
    const node = this.nodes.get(nodeId);
    if (node) {
      node.isPipelineParent = true;
    }
  }

  public addPipelineComponent(pipelineNodeId: string, componentId: string) {
    const pipeline = this.pipelines.get(pipelineNodeId);
    if (pipeline) {
      pipeline.componentIds.push(componentId);
    }

    // Mark the node as being in a pipeline
    const node = this.nodes.get(componentId);
    if (node) {
      node.inPipeline = true;
    }
  }

  public addAnnotation(annotation: WardleyAnnotation) {
    this.annotations.push(annotation);
  }

  public addNote(note: WardleyNote) {
    this.notes.push(note);
  }

  public addAccelerator(accelerator: WardleyAccelerator) {
    this.accelerators.push(accelerator);
  }

  public addDeaccelerator(deaccelerator: WardleyDeaccelerator) {
    this.deaccelerators.push(deaccelerator);
  }

  public setAnnotationsBox(x: number, y: number) {
    this.annotationsBox = { x, y };
  }

  public setAxes(partial: WardleyAxesConfig) {
    this.axes = {
      ...this.axes,
      ...partial,
    };
  }

  public setSize(width: number, height: number) {
    this.size = { width, height };
  }

  public getNode(id: string): WardleyNode | undefined {
    return this.nodes.get(id);
  }

  public build(): WardleyBuildResult {
    const nodes: WardleyNode[] = [];
    for (const node of this.nodes.values()) {
      if (typeof node.x !== 'number' || typeof node.y !== 'number') {
        throw new Error(`Node "${node.label}" is missing coordinates`);
      }
      nodes.push(node as Required<WardleyNode>);
    }
    return {
      nodes,
      links: [...this.links],
      trends: [...this.trends.values()],
      areas: [...this.areas],
      pipelines: [...this.pipelines.values()],
      annotations: [...this.annotations],
      notes: [...this.notes],
      accelerators: [...this.accelerators],
      deaccelerators: [...this.deaccelerators],
      annotationsBox: this.annotationsBox,
      axes: { ...this.axes },
      size: this.size,
    };
  }

  public clear() {
    this.nodes.clear();
    this.links = [];
    this.trends.clear();
    this.areas = [];
    this.pipelines.clear();
    this.annotations = [];
    this.notes = [];
    this.accelerators = [];
    this.deaccelerators = [];
    this.annotationsBox = undefined;
    this.axes = {};
    this.size = undefined;
  }
}
