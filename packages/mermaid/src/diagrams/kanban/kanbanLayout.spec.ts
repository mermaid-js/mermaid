/**
 * Kanban lays its columns out itself and never reads `layout`, so choosing `layout: layered` (or any
 * other engine) in the front matter must not change what it draws.
 */
import { beforeAll, describe, expect } from 'vitest';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { mermaidAPI } from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';

const BOARD = `kanban
  todo[Todo]
    t1[Write the spec]
    t2[Review the spec]
  doing[Doing]
    d1[Build the engine]
  done[Done]
    x1[Ship it]`;

const withLayout = (layout: string): string => `---\nconfig:\n  layout: ${layout}\n---\n${BOARD}`;

const WIDER_SECTIONS = 300;
const withSectionWidth = (width: number): string =>
  `---\nconfig:\n  kanban:\n    sectionWidth: ${width}\n---\n${BOARD}`;

const renderBoard = async (source: string): Promise<string> =>
  (await mermaidAPI.render('kanban-board', source)).svg;

describe('kanban ignores the layout setting', () => {
  beforeAll(() => {
    addDiagrams();
  });

  jsdomIt('draws the same svg with layout: layered as with no layout', async () => {
    const plain = await renderBoard(BOARD);
    const layered = await renderBoard(withLayout('layered'));

    expect(plain).toContain('Write the spec');
    expect(layered).toBe(plain);
  });

  jsdomIt('sees a difference when a setting kanban does read changes', async () => {
    const plain = await renderBoard(BOARD);
    const wider = await renderBoard(withSectionWidth(WIDER_SECTIONS));

    expect(wider).not.toBe(plain);
  });

  jsdomIt('never marks a kanban svg as a layered fallback', async () => {
    const layered = await renderBoard(withLayout('layered'));

    expect(layered).not.toContain('data-layout-fallback');
  });
});
