import { log } from '../../logger.js';
import { getWardleyConfig } from './wardleyConfig.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type {
  WardleyComponent,
  WardleyEdge,
  WardleyEvolution,
  WardleyPipeline,
  WardleyPipelineChild,
  WardleyNote,
  WardleyAnnotation,
  WardleyArea,
  WardleySubmap,
  WardleyAccelerator,
  WardleyDB,
  ComponentType,
  EdgeType,
  SourcingStrategy,
  AreaType,
  AcceleratorType,
} from './types.js';

// ── Default data ─────────────────────────────────────────────────────

interface WardleyData {
  components: Map<string, WardleyComponent>;
  edges: WardleyEdge[];
  evolutions: WardleyEvolution[];
  pipelines: Map<string, WardleyPipeline>;
  notes: WardleyNote[];
  annotations: WardleyAnnotation[];
  areas: WardleyArea[];
  submaps: WardleySubmap[];
  accelerators: WardleyAccelerator[];
  xAxisLabels: string[];
  yAxisLabels: string[];
}

const createDefaultData = (): WardleyData => ({
  components: new Map(),
  edges: [],
  evolutions: [],
  pipelines: new Map(),
  notes: [],
  annotations: [],
  areas: [],
  submaps: [],
  accelerators: [],
  xAxisLabels: [],
  yAxisLabels: [],
});

let data: WardleyData = createDefaultData();

// ── Config ───────────────────────────────────────────────────────────

const getConfig = (): Record<string, unknown> => getWardleyConfig();

// ── Helpers ──────────────────────────────────────────────────────────

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

const validateNonEmptyString = (value: string, name: string): boolean => {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    log.error(`Validation failed: ${name} must be a non-empty string`);
    return false;
  }
  return true;
};

const validateNumber = (value: number, name: string): boolean => {
  if (typeof value !== 'number' || isNaN(value)) {
    log.error(`Validation failed: ${name} must be a valid number`);
    return false;
  }
  return true;
};

// ── Components ───────────────────────────────────────────────────────

const addComponent = (
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
): void => {
  if (!validateNonEmptyString(id, 'component id')) {
    return;
  }
  if (!validateNonEmptyString(label, `component "${id}" label`)) {
    return;
  }
  if (!validateNumber(x, `component "${id}" x`)) {
    return;
  }
  if (!validateNumber(y, `component "${id}" y`)) {
    return;
  }

  if (data.components.has(id)) {
    log.warn(`Component "${id}" already exists, skipping duplicate`);
    return;
  }

  data.components.set(id, {
    id,
    label,
    x: clamp01(x),
    y: clamp01(y),
    type: options?.type ?? 'standard',
    inertia: options?.inertia ?? false,
    sourcing: options?.sourcing,
    labelOffset: options?.labelOffset,
  });
  log.debug(`Added component "${id}" (${options?.type ?? 'standard'}) at (${x}, ${y})`);
};

const getComponents = (): WardleyComponent[] => [...data.components.values()];
const getComponent = (id: string): WardleyComponent | undefined => data.components.get(id);

// ── Edges ────────────────────────────────────────────────────────────

const addEdge = (
  source: string,
  target: string,
  type: EdgeType = 'dependency',
  annotation?: string
): void => {
  if (!validateNonEmptyString(source, 'edge source')) {
    return;
  }
  if (!validateNonEmptyString(target, 'edge target')) {
    return;
  }

  if (!data.components.has(source)) {
    log.error(`Cannot add edge: source component "${source}" not found`);
    return;
  }
  if (!data.components.has(target)) {
    log.error(`Cannot add edge: target component "${target}" not found`);
    return;
  }

  if (source === target) {
    log.warn(`Skipping self-loop edge from "${source}" to itself`);
    return;
  }

  const exists = data.edges.some(
    (e) => e.source === source && e.target === target && e.type === type
  );
  if (exists) {
    log.warn(`${type} edge from "${source}" to "${target}" already exists, skipping`);
    return;
  }

  data.edges.push({ source, target, type, annotation });
  log.debug(`Added ${type} edge: "${source}" -> "${target}"`);
};

const getEdges = (): WardleyEdge[] => data.edges;

// ── Evolution ────────────────────────────────────────────────────────

const addEvolution = (sourceId: string, targetX: number, targetLabel?: string): void => {
  if (!validateNonEmptyString(sourceId, 'evolve source id')) {
    return;
  }
  if (!validateNumber(targetX, `evolve "${sourceId}" target`)) {
    return;
  }

  if (!data.components.has(sourceId)) {
    log.error(`Cannot add evolution: component "${sourceId}" not found`);
    return;
  }

  data.evolutions.push({
    sourceId,
    targetX: clamp01(targetX),
    targetLabel,
  });
  log.debug(
    `Added evolution: "${sourceId}" -> ${targetX}${targetLabel ? ` (renamed to "${targetLabel}")` : ''}`
  );
};

const getEvolutions = (): WardleyEvolution[] => data.evolutions;

// ── Pipelines ────────────────────────────────────────────────────────

const addPipeline = (
  id: string,
  label: string,
  x: number,
  y: number,
  startX: number,
  endX: number,
  children: WardleyPipelineChild[]
): void => {
  if (!validateNonEmptyString(id, 'pipeline id')) {
    return;
  }
  if (!validateNonEmptyString(label, `pipeline "${id}" label`)) {
    return;
  }

  if (data.pipelines.has(id)) {
    log.warn(`Pipeline "${id}" already exists, skipping`);
    return;
  }

  const clampedStartX = clamp01(Math.min(startX, endX));
  const clampedEndX = clamp01(Math.max(startX, endX));

  data.pipelines.set(id, {
    id,
    label,
    x: clamp01(x),
    y: clamp01(y),
    startX: clampedStartX,
    endX: clampedEndX,
    children,
  });
  log.debug(`Added pipeline "${id}" with ${children.length} children`);
};

const getPipelines = (): WardleyPipeline[] => [...data.pipelines.values()];

// ── Notes ────────────────────────────────────────────────────────────

const addNote = (text: string, x: number, y: number): void => {
  if (!validateNonEmptyString(text, 'note text')) {
    return;
  }
  if (!validateNumber(x, 'note x')) {
    return;
  }
  if (!validateNumber(y, 'note y')) {
    return;
  }

  data.notes.push({ text, x: clamp01(x), y: clamp01(y) });
  log.debug(`Added note at (${x}, ${y})`);
};

const getNotes = (): WardleyNote[] => data.notes;

// ── Annotations ──────────────────────────────────────────────────────

const addAnnotation = (number: number, text: string, targetId: string): void => {
  if (!validateNumber(number, 'annotation number') || !Number.isInteger(number) || number <= 0) {
    log.error('Annotation number must be a positive integer');
    return;
  }
  if (!validateNonEmptyString(text, 'annotation text')) {
    return;
  }
  if (!validateNonEmptyString(targetId, 'annotation target')) {
    return;
  }

  if (!data.components.has(targetId)) {
    log.warn(`Annotation #${number} references unknown component "${targetId}", storing anyway`);
  }

  data.annotations.push({ number, text, targetId });
  log.debug(`Added annotation #${number} for "${targetId}"`);
};

const getAnnotations = (): WardleyAnnotation[] => data.annotations;

// ── Areas ────────────────────────────────────────────────────────────

const addArea = (
  label: string,
  areaType: AreaType,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void => {
  if (!validateNumber(x1, 'area x1')) {
    return;
  }
  if (!validateNumber(y1, 'area y1')) {
    return;
  }
  if (!validateNumber(x2, 'area x2')) {
    return;
  }
  if (!validateNumber(y2, 'area y2')) {
    return;
  }

  data.areas.push({
    label,
    areaType,
    x1: clamp01(Math.min(x1, x2)),
    y1: clamp01(Math.min(y1, y2)),
    x2: clamp01(Math.max(x1, x2)),
    y2: clamp01(Math.max(y1, y2)),
  });
  log.debug(`Added ${areaType} area "${label}"`);
};

const getAreas = (): WardleyArea[] => data.areas;

// ── Submaps ──────────────────────────────────────────────────────────

const addSubmap = (id: string, label: string, x: number, y: number, ref: string): void => {
  if (!validateNonEmptyString(id, 'submap id')) {
    return;
  }
  if (!validateNonEmptyString(label, `submap "${id}" label`)) {
    return;
  }
  if (!validateNonEmptyString(ref, `submap "${id}" ref`)) {
    return;
  }
  data.submaps.push({ id, label, x: clamp01(x), y: clamp01(y), ref });
  log.debug(`Added submap "${id}" referencing "${ref}"`);
};

const getSubmaps = (): WardleySubmap[] => data.submaps;

// ── Accelerators ─────────────────────────────────────────────────────

const addAccelerator = (targetId: string, type: AcceleratorType): void => {
  if (!validateNonEmptyString(targetId, 'accelerator target')) {
    return;
  }

  if (!data.components.has(targetId)) {
    log.warn(`${type} references unknown component "${targetId}", storing anyway`);
  }

  data.accelerators.push({ targetId, type });
  log.debug(`Added ${type} for "${targetId}"`);
};

const getAccelerators = (): WardleyAccelerator[] => data.accelerators;

// ── Axis Labels ──────────────────────────────────────────────────────

const setXAxisLabels = (labels: string[]): void => {
  data.xAxisLabels = labels;
};
const getXAxisLabels = (): string[] => data.xAxisLabels;

const setYAxisLabels = (labels: string[]): void => {
  data.yAxisLabels = labels;
};
const getYAxisLabels = (): string[] => data.yAxisLabels;

// ── Clear ────────────────────────────────────────────────────────────

const clear = (): void => {
  commonClear();
  data = createDefaultData();
};

// ── Export ────────────────────────────────────────────────────────────

export const db: WardleyDB = {
  clear,
  // Accessibility
  getDiagramTitle,
  setDiagramTitle,
  getAccTitle,
  setAccTitle,
  getAccDescription,
  setAccDescription,
  // Components
  addComponent,
  getComponents,
  getComponent,
  // Edges
  addEdge,
  getEdges,
  // Evolution
  addEvolution,
  getEvolutions,
  // Pipelines
  addPipeline,
  getPipelines,
  // Notes
  addNote,
  getNotes,
  // Annotations
  addAnnotation,
  getAnnotations,
  // Areas
  addArea,
  getAreas,
  // Submaps
  addSubmap,
  getSubmaps,
  // Accelerators
  addAccelerator,
  getAccelerators,
  // Axis labels
  setXAxisLabels,
  getXAxisLabels,
  setYAxisLabels,
  getYAxisLabels,
  // Config
  getConfig,
};
