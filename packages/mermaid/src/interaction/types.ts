/**
 * 单个节点的位置覆盖数据
 */
export interface NodeOverride {
  /** 节点在 SVG viewBox 坐标系中的 X 锚点坐标 */
  x: number;
  /** 节点在 SVG viewBox 坐标系中的 Y 锚点坐标 */
  y: number;
  /** 是否锁定该节点（锁定后不可拖拽） */
  locked?: boolean;
}

/**
 * 边的覆盖数据（MVP 阶段预留，暂不实现边的独立拖拽）
 */
export interface EdgeOverride {
  /** 手动调整后的路径点列表 */
  points?: { x: number; y: number }[];
}

/**
 * 完整的覆盖数据持久化格式
 */
export interface OverrideData {
  /** 格式版本号 */
  version: number;
  /** 使用的布局引擎名称 */
  layout: string;
  /** 节点覆盖数据，key 为用户定义的节点 ID */
  overrides: {
    nodes: Record<string, NodeOverride>;
    edges: Record<string, EdgeOverride>;
  };
}

/**
 * MermaidDragEditor 配置选项
 */
export interface DragEditorOptions {
  /** 已渲染的 SVG 元素 */
  svgElement: SVGElement;
  /** 用户定义的 Mermaid 代码（用于 resetLayout 后重新渲染） */
  mermaidCode?: string;
  /** 存储键名（用于 localStorage），默认使用 SVG 的 id */
  storageKey?: string;
  /** 最大撤销步数，默认 50 */
  maxUndoDepth?: number;
  /** 自定义保存回调，返回保存是否成功 */
  onSave?: (data: OverrideData) => Promise<void>;
  /** 自定义加载回调，返回已保存的数据或 null */
  onLoad?: () => Promise<OverrideData | null>;
  /** 自定义渲染函数：传入 mermaidCode，返回渲染后的 SVG 元素 */
  renderFn?: (code: string) => Promise<SVGElement>;
}

/**
 * 节点在 SVG viewBox 坐标系中的位置
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * 扫描到的节点信息
 */
export interface ScannedNode {
  /** 对应的 SVG <g> 元素 */
  element: SVGGElement;
  /** 用户定义的节点 ID（如 "A", "B", "node-A"） */
  userNodeId: string;
  /** 当前在 viewBox 坐标系中的 X 锚点坐标 */
  currentX: number;
  /** 当前在 viewBox 坐标系中的 Y 锚点坐标 */
  currentY: number;
  /** 节点宽度（viewBox 坐标），用于连接点计算 */
  nodeWidth: number;
  /** 节点高度（viewBox 坐标），用于连接点计算 */
  nodeHeight: number;
  /** 是否锁定该节点 */
  locked: boolean;
}

/**
 * 撤销/重做历史条目
 */
export interface HistoryEntry {
  /** 被移动的节点 ID 列表 */
  nodeIds: string[];
  /** 移动前的覆盖数据快照 */
  before: Record<string, NodePosition>;
  /** 移动后的覆盖数据快照 */
  after: Record<string, NodePosition>;
}

/**
 * 边模型：记录边的 source/target 节点映射与对应的 SVG path 元素
 */
export interface EdgeModel {
  /** 边的逻辑 ID */
  id: string;
  /** 边的源节点用户 ID */
  source: string;
  /** 边的目标节点用户 ID */
  target: string;
  /** 对应的 SVG <path> 元素 */
  pathElement: SVGPathElement;
}

/**
 * 拖拽开始时的状态快照
 */
export interface DragSnapshot {
  /** 被拖拽节点在 viewBox 坐标中的原始位置 */
  originalPositions: Map<string, NodePosition>;
  /** pointerdown 时在 viewBox 坐标中的位置 */
  startPoint: NodePosition;
  /** 上一帧已经应用到边路径的位移量 */
  lastAppliedDelta: NodePosition;
}
