import { createCommonLayoutRenderer, defaultMeasureLayout } from '../common/index.js';
import type { LayoutData } from '../../types.js';
import { runOnionLayoutCore } from './layoutCore.js';
import { findSideGroupIds } from './structure.js';

interface LayoutDataTap {
  mermaidCaptureLayoutData?: boolean;
  mermaidLastLayoutData?: unknown;
}

/** Dev tap: with `window.mermaidCaptureLayoutData` set, keeps the measured graph for offline iteration. */
function captureLayoutData(data4Layout: LayoutData): void {
  const tap = globalThis as unknown as LayoutDataTap;
  if (tap.mermaidCaptureLayoutData) {
    const { config: _config, ...rest } = data4Layout;
    tap.mermaidLastLayoutData = JSON.parse(JSON.stringify(rest));
  }
}

export const render = createCommonLayoutRenderer({
  // Frames size their title band from a one-line title, as the painter draws it.
  measureLayout: (data4Layout, context) =>
    defaultMeasureLayout(data4Layout, context, { unwrapGroupLabels: true }),
  runLayoutCore: (data4Layout, context) => {
    captureLayoutData(data4Layout);
    runOnionLayoutCore(
      data4Layout,
      context.options?.algorithm === 'onion-vertical' ? 'vertical' : 'horizontal'
    );
  },
  // A rectangle frame cannot draw a sector, so the side groups are laid out but never painted.
  paintOptions: {
    getNodes: (data4Layout) => {
      const sideGroupIds = findSideGroupIds(data4Layout.nodes);
      return data4Layout.nodes.filter((node) => !sideGroupIds.has(node.id));
    },
  },
});
