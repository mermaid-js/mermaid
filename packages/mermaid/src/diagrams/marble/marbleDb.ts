import type { MarbleDiagramConfig } from '../../config.type.js';
import { getConfig as commonGetConfig } from '../../config.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
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
import { buildTimeline, marbleError } from './marbleTimeline.js';
import type {
  MarbleDB as MarbleDBInterface,
  MarbleLabel,
  MarbleTimeline,
  RawMarbleLine,
  SourcePosition,
} from './marbleTypes.js';

const emptyTimeline = (): MarbleTimeline => ({ ticks: [], lanes: [], breaks: [], columns: 0 });

/**
 * Holds one marble diagram. The diagram definition hands out a new instance on every read
 * of `db`, so nothing here outlives a render and there is no module-level state.
 */
export class MarbleDB implements MarbleDBInterface {
  private lanes: RawMarbleLine[] = [];
  private axis: RawMarbleLine | undefined;
  private labels = new Map<string, MarbleLabel>();
  private timeline: MarbleTimeline = emptyTimeline();
  private lineOffset = 0;

  public getConfig(): Required<MarbleDiagramConfig> {
    return cleanAndMerge({
      ...DEFAULT_CONFIG.marble,
      ...commonGetConfig().marble,
    }) as Required<MarbleDiagramConfig>;
  }

  public setFrontmatterLineOffset(offset: number) {
    this.lineOffset = offset;
  }

  private sourceLine(line: number) {
    return line + this.lineOffset;
  }

  public addLane(lane: RawMarbleLine) {
    if (this.lanes.some(({ name }) => name === lane.name)) {
      throw marbleError(
        `lane "${lane.name}" is defined twice`,
        this.sourceLine(lane.line),
        lane.column
      );
    }
    this.lanes.push({ ...lane, line: this.sourceLine(lane.line) });
  }

  public setAxis(axis: RawMarbleLine) {
    if (this.axis) {
      throw marbleError('only one axis is allowed', this.sourceLine(axis.line), axis.column);
    }
    this.axis = { ...axis, line: this.sourceLine(axis.line) };
  }

  public addLabel(symbol: string, text: string, { line, column }: SourcePosition) {
    if (this.labels.has(symbol)) {
      throw marbleError(`"${symbol}" is labelled twice`, this.sourceLine(line), column);
    }
    this.labels.set(symbol, { symbol, text, colorIndex: this.labels.size });
  }

  public getLabel(symbol: string) {
    return this.labels.get(symbol);
  }

  public getLabels() {
    return [...this.labels.values()];
  }

  public build() {
    this.timeline = buildTimeline(this.lanes, this.axis);
  }

  public getTimeline() {
    return this.timeline;
  }

  public clear() {
    commonClear();
    this.lanes = [];
    this.axis = undefined;
    this.labels = new Map();
    this.timeline = emptyTimeline();
    this.lineOffset = 0;
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getAccDescription = getAccDescription;
  public setAccDescription = setAccDescription;
}
