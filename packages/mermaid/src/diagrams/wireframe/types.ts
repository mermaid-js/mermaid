import type { WireframeComponent } from '@mermaid-js/parser';
import type { BaseDiagramConfig } from '../../config.type.js';

export type CanvasSizePreset = 'dialog' | 'panel' | 'tablet' | 'desktop' | 'page';

export const CANVAS_SIZE_MAP: Record<CanvasSizePreset, { width: number; height: number }> = {
  dialog: { width: 450, height: 320 },
  panel: { width: 320, height: 480 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  page: { width: 1200, height: 900 },
};

export const LAYOUT_METRICS = {
  actionBar: { height: 40, buttonHeight: 28, minButtonWidth: 70, gap: 8, paddingY: 15 },
  button: { height: 32, paddingX: 20, minWidth: 80, gapY: 10 },
  input: { height: 30, maxWidth: 240, labelOffsetY: 14, gapY: 10 },
  heading: { fontSize: 20, height: 32, offsetY: 22 },
  paragraph: { height: 24, offsetY: 16 },
  section: { headerHeight: 24, paddingX: 10, titleOffsetY: 16 },
  fieldset: { headerPaddingY: 20, paddingX: 15, baseHeight: 30, legendOffsetY: 14, gapY: 10 },
  defaultComponent: { height: 28, maxWidth: 200, gapY: 36, textPaddingX: 8, textOffsetY: 18 },
} as const;

export interface WireframeDiagramConfig extends BaseDiagramConfig {
  padding?: number;
  containerPadding?: number;
  defaultCanvasSize?: CanvasSizePreset;
  fontFamily?: string;
  fontSize?: number;
}

export interface WireframeRenderNode {
  astNode: WireframeComponent;
  x: number;
  y: number;
  width: number;
  height: number;
  children?: WireframeRenderNode[];
}
