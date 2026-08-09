import type { WireframeComponent } from '@mermaid-js/parser';
import type { WireframeDiagramConfig } from '../../config.type.js';

export type CanvasSizePreset = 'dialog' | 'panel' | 'tablet' | 'desktop' | 'page';
export type { WireframeDiagramConfig };

export const CANVAS_SIZE_MAP: Record<CanvasSizePreset, { width: number; height: number }> = {
  dialog: { width: 450, height: 320 },
  panel: { width: 320, height: 480 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  page: { width: 1200, height: 900 },
};

export const LAYOUT_METRICS = {
  actionBar: { height: 44, buttonHeight: 32, minButtonWidth: 80, gap: 10, paddingY: 16 },
  button: { height: 36, paddingX: 20, minWidth: 90, gapY: 16 },
  input: { height: 36, maxWidth: 360, labelOffsetY: 16, gapY: 16 },
  textarea: { baseHeight: 80, maxWidth: 400, gapY: 16 },
  checkbox: { size: 18, gapY: 14, labelGap: 8 },
  radio: { size: 18, gapY: 14, labelGap: 8 },
  select: { height: 36, maxWidth: 240, gapY: 16 },
  heading: { fontSize: 20, height: 36, offsetY: 24, gapY: 10 },
  paragraph: { height: 28, offsetY: 18, gapY: 10 },
  section: { headerHeight: 28, paddingX: 20, titleOffsetY: 18, gapY: 16 },
  fieldset: { headerPaddingY: 24, paddingX: 20, baseHeight: 36, legendOffsetY: 16, gapY: 16 },
  titleWindow: { titleBarHeight: 36, paddingX: 16, baseHeight: 40, gapY: 16 },
  tabBar: { height: 36, paddingX: 16, gapY: 16 },
  icon: { size: 24, gapY: 14 },
  divider: { height: 16, gapY: 12 },
  treeNode: { itemHeight: 26, indent: 18, gapY: 6 },
  listNode: { itemHeight: 26, gapY: 6 },
  defaultComponent: { height: 32, maxWidth: 240, gapY: 16, textPaddingX: 10, textOffsetY: 20 },
} as const;

export interface WireframeRenderNode {
  astNode: WireframeComponent;
  x: number;
  y: number;
  width: number;
  height: number;
  children?: WireframeRenderNode[];
}
