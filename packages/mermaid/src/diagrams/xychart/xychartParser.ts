import type { XY } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import db from './xychartDb.js';
import type { NormalTextType } from './xychartDb.js';

const populate = (ast: XY) => {
  populateCommonDb(ast, db);
  // Here we can add specific logic between the AST and the DB
  const { bar, line, orientation, title, xAxis, yAxis } = ast;
  if (orientation) {
    db.setOrientation(orientation);
  }
  if (title) {
    db.setDiagramTitle(title);
  }
  if (xAxis) {
    const { title, data } = xAxis;
    if (title) {
      db.setXAxisTitle({ text: title, type: 'text' });
    }
    if (data) {
      if (data.$type === 'BandData') {
        const normalTextLabels = data.labels.map((label) => {
          return { text: label, type: 'text' } as NormalTextType;
        });
        db.setXAxisBand(normalTextLabels);
      } else if (data.$type === 'RangeData') {
        db.setXAxisRangeData(data.start, data.end);
      }
    }
  }
  if (yAxis) {
    const { title, data } = yAxis;
    if (title) {
      db.setYAxisTitle({ text: title, type: 'text' });
    }
    if (data) {
      // yAxis data can only be of type RangeData
      db.setYAxisRangeData(data.start, data.end);
    }
  }
  if (line) {
    for (const lineData of line) {
      const { data, title } = lineData;
      db.setLineData({ text: title ?? '', type: 'text' }, data.values);
    }
  }
  if (bar) {
    for (const barData of bar) {
      const { data, title } = barData;
      db.setBarData({ text: title ?? '', type: 'text' }, data.values);
    }
  }
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: XY = await parse('xy', input);
    log.debug(ast);
    populate(ast);
  },
};
