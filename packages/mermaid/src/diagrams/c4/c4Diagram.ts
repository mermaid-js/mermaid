// @ts-ignore: JISON doesn't support types
import parser from './parser/c4Diagram.jison';
import db from './c4Db.js';
import renderer from './c4Renderer.js';
import unifiedRenderer from './c4Renderer-unified.js';
import styles from './styles.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { MermaidConfig } from '../../config.type.js';
import type { DiagramDefinition } from '../../diagram-api/types.js';

/**
 * Dispatches between the legacy row-based renderer (default) and the unified
 * rendering pipeline (opt-in via the `c4.useUnifiedRenderer` config flag).
 */
const dispatchingRenderer = {
  setConf: renderer.setConf,
  draw: async (text: string, id: string, version: string, diag: any) => {
    if (getConfig().c4?.useUnifiedRenderer) {
      return unifiedRenderer.draw(text, id, version, diag);
    }
    return renderer.draw(text, id, version, diag);
  },
};

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer: dispatchingRenderer,
  styles,
  init: ({ c4, wrap }: MermaidConfig) => {
    renderer.setConf(c4);
    db.setWrap(wrap);
  },
};
