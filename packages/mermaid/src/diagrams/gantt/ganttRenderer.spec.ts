// @ts-ignore: JISON doesn't support types
import ganttParser from './parser/gantt.jison';
import ganttDb from './ganttDb.js';
import ganttRenderer from './ganttRenderer.js';

const renderGantt = (text: string, displayMode = '') => {
  ganttDb.clear();
  ganttParser.parser.yy = ganttDb;
  ganttParser.parse(text);
  ganttDb.setDisplayMode(displayMode);
  ganttRenderer.draw(text, 'gantt-svg', '1.0.0', { db: ganttDb } as any);
};

/** Section labels as rendered, top to bottom. */
const getSectionTitles = () =>
  [...document.querySelectorAll('text.sectionTitle')]
    .map((el) => ({ text: el.textContent, y: Number(el.getAttribute('y')) }))
    .sort((a, b) => a.y - b.y)
    .map(({ text }) => text);

/** Section of each task bar, top to bottom. */
const getTaskSections = () => {
  const sections: string[] = [];
  [...document.querySelectorAll('rect.task')]
    .map((el: any) => ({ section: el.__data__.section, y: Number(el.getAttribute('y')) }))
    .sort((a, b) => a.y - b.y)
    .forEach(({ section }) => {
      if (sections.at(-1) !== section) {
        sections.push(section);
      }
    });
  return sections;
};

describe('ganttRenderer', () => {
  beforeAll(() => {
    // jsdom does not implement getBBox, which the renderer uses to place task text
    (window.SVGElement.prototype as any).getBBox ??= () => ({ x: 0, y: 0, width: 0, height: 0 });
  });

  beforeEach(() => {
    document.body.innerHTML = '<svg id="gantt-svg"></svg>';
  });

  // https://github.com/mermaid-js/mermaid/issues/5732
  describe.each(['', 'compact'])(
    'with number-like section names (displayMode: "%s")',
    (displayMode) => {
      const text = `gantt
        dateFormat YYYY-MM-DD
        section ZZ
        Main Development1 :2024-06-01, 10d
        Release Branch    :5d
        section 501
        Main Development3 :2024-06-15, 10d
        Validate          :2d
        section 2
        Stage             :2024-06-20, 1d`;

      it('should keep section labels in declaration order', () => {
        renderGantt(text, displayMode);
        expect(getSectionTitles()).toEqual(['ZZ', '501', '2']);
      });

      it('should draw each task row next to its own section label', () => {
        renderGantt(text, displayMode);
        expect(getTaskSections()).toEqual(getSectionTitles());
      });
    }
  );
});
