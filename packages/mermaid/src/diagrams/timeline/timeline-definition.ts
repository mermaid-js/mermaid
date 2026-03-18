// @ts-ignore: JISON doesn't support types
import parser from './parser/timeline.jison';
import * as db from './timelineDb.js';
import renderer from './timelineRenderer.js';
import verticalRenderer from './timelineRendererVertical.js';
import styles from './styles.js';

const rendererSelector = {
  setConf: () => {
    // no-op
  },
  draw: (text: string, id: string, version: string, diagObj: any) => {
    const direction = diagObj?.db?.getDirection?.() ?? 'LR';
    if (direction === 'TD') {
      return verticalRenderer.draw(text, id, version, diagObj);
    }
    return renderer.draw(text, id, version, diagObj);
  },
};

export const diagram = {
  db,
  renderer: rendererSelector,
  parser,
  styles,
};
