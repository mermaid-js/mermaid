import { select } from 'd3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfig } from '../../config.js';
import type * as ShapeUtils from '../../rendering-util/rendering-elements/shapes/util.js';
import { labelHelper } from '../../rendering-util/rendering-elements/shapes/util.js';
import { note } from '../../rendering-util/rendering-elements/shapes/note.js';
import type { Node } from '../../rendering-util/types.js';
import { ClassDB } from './classDb.js';
import getStyles from './styles.js';

// jsdom cannot measure labels, so stub the label and the bounds update.
vi.mock('../../rendering-util/rendering-elements/shapes/util.js', async (importOriginal) => ({
  ...(await importOriginal<typeof ShapeUtils>()),
  labelHelper: vi.fn(),
  updateNodeBounds: vi.fn(),
}));

const renderNote = async (look: string) => {
  const classDb = new ClassDB();
  classDb.addNote('a note', '');
  const node = classDb.getData().nodes.find((n) => n.shape === 'note')!;

  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  const parent = select(document.querySelector<SVGSVGElement>('svg')!);
  const shapeSvg = parent.append('g').attr('class', `node ${node.cssClasses}`);
  vi.mocked(labelHelper).mockResolvedValue({
    shapeSvg,
    bbox: { x: 0, y: 0, width: 50, height: 20 } as DOMRect,
    halfPadding: 0,
    label: shapeSvg.append('g'),
  });

  await note(parent, { ...node, look } as Node, { config: getConfig() });
  return { node, shapeSvg };
};

describe('class diagram note styles', () => {
  beforeEach(() => {
    vi.mocked(labelHelper).mockReset();
  });

  it.each(['classic', 'neo'])(
    'does not put fixed !important colours on a %s note container',
    async (look) => {
      const { node, shapeSvg } = await renderNote(look);

      const paths = shapeSvg.selectAll<SVGPathElement, unknown>('.outer-path path').nodes();
      expect(paths.length).toBeGreaterThan(0);
      for (const path of paths) {
        expect(path.getAttribute('style') ?? '').not.toContain('!important');
      }
      // The class the stylesheet rule hangs off.
      expect(node.cssClasses).toBe('note');
    }
  );

  it('colours notes from the stylesheet', () => {
    const css = getStyles({ noteBkgColor: '#fff5ad', noteBorderColor: '#aaaa33' });
    expect(css.replace(/\s+/g, ' ')).toContain(
      '.node.note .outer-path path { fill: #fff5ad; stroke: #aaaa33; }'
    );
  });
});
