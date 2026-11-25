import { jsdomIt } from '../../tests/util.js';
// @ts-ignore: JISON doesn't support types
import { parser } from './parser/timeline.jison';
import * as db from './timelineDb.js';
import { draw } from './timelineRendererVertical.js';

describe('timelineRendererVertical', () => {
  jsdomIt('should point every marker-end at the arrowhead marker of the diagram', () => {
    db.clear();
    parser.yy = db;
    parser.parse(`timeline TD
      title History
      2002 : LinkedIn
      2004 : Facebook : Google`);

    draw('', 'svg', '1.0.0', { db } as any);

    const lines = [...document.querySelectorAll('[marker-end]')];
    // one dashed connector per event, plus the activity line
    expect(lines).toHaveLength(4);
    for (const line of lines) {
      expect(line.getAttribute('marker-end')).toBe('url(#svg-arrowhead)');
    }
    expect(document.querySelectorAll('marker#svg-arrowhead')).toHaveLength(1);
    expect(document.querySelectorAll('[id^="undefined"]')).toHaveLength(0);
  });
});
