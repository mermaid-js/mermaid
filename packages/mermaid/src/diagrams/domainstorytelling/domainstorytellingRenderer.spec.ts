import { describe, expect } from 'vitest';
import type { Diagram } from '../../Diagram.js';
import type { MermaidConfig } from '../../config.type.js';
import type { D3Selection } from '../../types.js';
import { jsdomIt } from '../../tests/util.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import { reset } from '../../config.js';
import { DomainStorytellingDb } from './domainstorytellingDb.js';
// Importing the renderer registers the built-in mermaid-domainstorytelling
// icon pack as a module side effect — the default actor/workobject icons and
// prefix-less icon names resolve without any registerIconPacks call here.
import { renderer } from './domainstorytellingRenderer.js';

/**
 * Reset the jsdom SVG fixture (id + empty <g> host) and apply the loose security
 * level every render test needs. Extra config (e.g. domainstorytelling.rankdir)
 * is merged on top via configOverrides.
 */
const setupSvg = (
  svg: D3Selection<SVGSVGElement>,
  id: string,
  configOverrides: MermaidConfig = {}
) => {
  svg.attr('id', id);
  svg.html('');
  svg.append('g');
  // setConfig merges into the module-level currentConfig, so overrides from an
  // earlier render (e.g. domainstorytelling.rankdir) would otherwise persist.
  reset();
  setConfig({ securityLevel: 'loose', ...configOverrides });
};

describe('domainstorytelling renderer annotations', () => {
  jsdomIt('renders default actor and workobject icons when none are declared', async ({ svg }) => {
    const id = 'domainstorytelling-render-default-icons';
    setupSvg(svg, id);

    const db = new DomainStorytellingDb();
    db.addActor('A_A', 'Actor');
    db.addWorkobject('W_W-1', 'Workobject', 'W_W');
    db.addEdge('A_A', 'W_W-1', 'works on', 1);

    const fakeDiagram = { db } as unknown as Diagram;

    await renderer.draw('', id, '1.0.0', fakeDiagram);

    const svgMarkup = svg.node()?.outerHTML ?? '';
    expect(svgMarkup).toContain('domainstorytelling-node');
    expect(svgMarkup).toContain('domainstorytelling-icon');
    // Default icons resolve to inline Iconify SVGs from the built-in
    // mermaid-domainstorytelling pack (not the unknown placeholder).
    expect(svgMarkup).toContain('<svg');
    expect(svgMarkup).toContain('currentColor');
    expect(svgMarkup).not.toContain('087ebf');
  });

  jsdomIt('resolves prefix-less declared icons against the built-in pack', async ({ svg }) => {
    const id = 'domainstorytelling-render-builtin-icons';
    setupSvg(svg, id);

    const db = new DomainStorytellingDb();
    // Icon definitions must exist before the node is added — addActor/addWorkobject
    // snapshot the icon at add time.
    db.addIconDefinition('A_A', 'folder');
    db.addActor('A_A', 'Actor');
    db.addWorkobject('W_W-1', 'Workobject', 'W_W');
    db.addEdge('A_A', 'W_W-1', 'works on', 1);

    const fakeDiagram = { db } as unknown as Diagram;

    await renderer.draw('', id, '1.0.0', fakeDiagram);

    const svgMarkup = svg.node()?.outerHTML ?? '';
    // Distinctive path start of the built-in `folder` icon.
    expect(svgMarkup).toContain('M3 6.5v-1');
    expect(svgMarkup).not.toContain('087ebf');
  });

  jsdomIt('renders diagram title from the domainstorytelling db', async ({ svg }) => {
    const id = 'domainstorytelling-render-title';
    setupSvg(svg, id);

    const db = new DomainStorytellingDb();
    db.setDiagramTitle('Domain Storytelling Title');
    db.addActor('A_A', 'Actor A');
    db.addWorkobject('W_W-1', 'Workobject W', 'W_W');
    db.addEdge('A_A', 'W_W-1', 'works on', 1, 'S_Work');

    const fakeDiagram = {
      db,
    } as unknown as Diagram;

    await renderer.draw('', id, '1.0.0', fakeDiagram);

    const svgMarkup = svg.node()?.outerHTML ?? '';
    expect(svgMarkup).toContain('Domain Storytelling Title');
    expect(svgMarkup).toContain('domainstorytellingTitleText');
  });

  jsdomIt(
    'renders annotations as nodes with dashed links and auto-oriented one-sided bracket',
    async ({ svg }) => {
      const id = 'domainstorytelling-render-test';
      setupSvg(svg, id);

      const db = new DomainStorytellingDb();
      db.addActor('A_A', 'Actor A');
      db.addWorkobject('W_W-1', 'Workobject W', 'W_W');
      db.addEdge('A_A', 'W_W-1', 'works on', 1, 'S_Work');

      db.setActorComment('A_A', 'actor note');
      db.setSentenceTarget('S_Work', 'W_W-1');
      db.setSentenceComment('S_Work', 'sentence note');

      const fakeDiagram = { db } as unknown as Diagram;

      await renderer.draw('', id, '1.0.0', fakeDiagram);

      const svgMarkup = svg.node()?.outerHTML ?? '';
      expect(svgMarkup).toContain('domainstorytelling-annotation-content');
      expect(svgMarkup).toContain('domainstorytelling-annotation-link');
      expect(svgMarkup).toMatch(/domainstorytelling-annotation-side-(left|right|top|bottom)/);
    }
  );

  jsdomIt(
    'changes annotation bracket orientation when layout direction changes',
    async ({ svg }) => {
      const renderAndGetSide = async (id: string, rankdir: 'LR' | 'RL') => {
        setupSvg(svg, id, { domainstorytelling: { rankdir } });

        const db = new DomainStorytellingDb();
        db.addActor('A_A', 'Actor A');
        db.addWorkobject('W_W-1', 'Workobject W', 'W_W');
        db.addEdge('A_A', 'W_W-1', 'works on', 1, 'S_Work');
        db.setActorComment('A_A', 'actor note');

        const fakeDiagram = { db } as unknown as Diagram;
        await renderer.draw('', id, '1.0.0', fakeDiagram);

        const svgMarkup = svg.node()?.outerHTML ?? '';
        const sideMatch = /domainstorytelling-annotation-side-(left|right|top|bottom)/.exec(
          svgMarkup
        );
        expect(sideMatch).not.toBeNull();
        return sideMatch?.[1] ?? '';
      };

      const lrSide = await renderAndGetSide('domainstorytelling-render-test-lr', 'LR');
      const rlSide = await renderAndGetSide('domainstorytelling-render-test-rl', 'RL');

      expect(lrSide).not.toBe(rlSide);
    }
  );

  jsdomIt('routes sentence annotation link to sequence number circle', async ({ svg }) => {
    const id = 'domainstorytelling-render-sentence-seq-target';
    setupSvg(svg, id);

    const db = new DomainStorytellingDb();
    db.addActor('A_A', 'Actor A');
    db.addWorkobject('W_W-S_Work', 'Workobject W', 'W_W');
    db.addEdge('A_A', 'W_W-S_Work', 'works on', 1, 'S_Work');
    db.setSentenceTarget('S_Work', 'A_A');
    db.setSentenceComment('S_Work', 'sentence note');

    const fakeDiagram = { db } as unknown as Diagram;

    await renderer.draw('', id, '1.0.0', fakeDiagram);

    const svgNode = svg.node();
    const seqGroup = svgNode?.querySelector('.sequence-number-group[data-sentence-ref="S_Work"]');
    expect(seqGroup).not.toBeNull();
    const transform = seqGroup?.getAttribute('transform') ?? '';
    const transformMatch = /translate\(([\d.-]+),\s*([\d.-]+)\)/.exec(transform);
    expect(transformMatch).not.toBeNull();

    const seqX = Number(transformMatch?.[1]);
    const seqY = Number(transformMatch?.[2]);

    const svgMarkup = svg.node()?.outerHTML ?? '';
    expect(svgMarkup).toContain(`id="${id}-ANNO_sentence_S_Work"`);
    expect(svgMarkup).toContain('data-sentence-ref="S_Work"');
    // The annotation link runs from the sentence annotation node to the
    // sentence's target actor (A_A); its path is then redirected to the
    // sequence-number circle above.
    expect(svgMarkup).toContain(`id="${id}-L-ANNO_sentence_S_Work-A_A-`);

    // Sanity check that seq position is numeric and therefore routable target data exists.
    expect(Number.isFinite(seqX)).toBe(true);
    expect(Number.isFinite(seqY)).toBe(true);
  });

  jsdomIt('sanitizes malicious actor, workobject, and group labels', async ({ svg }) => {
    const id = 'domainstorytelling-render-xss';
    setupSvg(svg, id);

    const db = new DomainStorytellingDb();
    db.addGroup('G_Z', 'Group<svg onload=alert(3)></svg>End');
    db.addActor('A_X', 'Hello<script>alert(1)</script>World');
    db.setActorGroup('A_X', 'G_Z');
    db.addWorkobject('W_Y-1', 'Item<a href="javascript:alert(2)">click</a>End', 'W_Y');
    db.addEdge('A_X', 'W_Y-1', 'works on', 1);

    const fakeDiagram = { db } as unknown as Diagram;

    await renderer.draw('', id, '1.0.0', fakeDiagram);

    const svgMarkup = svg.node()?.outerHTML ?? '';
    expect(svgMarkup).not.toMatch(/<script\b/i);
    expect(svgMarkup).not.toMatch(/\bonerror\s*=/i);
    expect(svgMarkup).not.toMatch(/\bonload\s*=/i);
  });

  jsdomIt('sanitizes malicious actor, workobject, and group annotation bodies', async ({ svg }) => {
    const id = 'domainstorytelling-render-annotation-xss';
    setupSvg(svg, id);

    const db = new DomainStorytellingDb();
    db.addGroup('G_X', 'Group');
    db.addActor('A_A', 'Actor');
    db.setActorGroup('A_A', 'G_X');
    db.addWorkobject('W_W-1', 'Workobject', 'W_W');
    db.addEdge('A_A', 'W_W-1', 'works on', 1);

    db.setActorComment('A_A', 'noteX<script>alert(1)</script>End');
    db.setWorkobjectComment('W_W-1', 'noteY<svg onerror=alert(2)></svg>End');
    db.setGroupComment('G_X', 'noteZ<svg onload=alert(3)></svg>End');

    const fakeDiagram = { db } as unknown as Diagram;

    await renderer.draw('', id, '1.0.0', fakeDiagram);

    const svgMarkup = svg.node()?.outerHTML ?? '';
    expect(svgMarkup).not.toMatch(/<script\b/i);
    expect(svgMarkup).not.toMatch(/\bonerror\s*=/i);
    expect(svgMarkup).not.toMatch(/\bonload\s*=/i);
  });

  jsdomIt('sanitizes malicious edge labels', async ({ svg }) => {
    const id = 'domainstorytelling-render-edge-label-xss';
    setupSvg(svg, id);

    const db = new DomainStorytellingDb();
    db.addActor('A_A', 'Actor');
    db.addWorkobject('W_W-1', 'Workobject', 'W_W');
    db.addEdge('A_A', 'W_W-1', 'works on<script>alert(1)</script>', 1);

    const fakeDiagram = { db } as unknown as Diagram;

    await renderer.draw('', id, '1.0.0', fakeDiagram);

    const svgMarkup = svg.node()?.outerHTML ?? '';
    expect(svgMarkup).not.toMatch(/<script\b/i);
    expect(svgMarkup).not.toMatch(/\bonerror\s*=/i);
    expect(svgMarkup).not.toMatch(/\bonload\s*=/i);
  });

  jsdomIt('sanitizes malicious sentence annotation body', async ({ svg }) => {
    const id = 'domainstorytelling-render-sentence-annotation-xss';
    setupSvg(svg, id);

    const db = new DomainStorytellingDb();
    db.addActor('A_A', 'Actor');
    db.addWorkobject('W_W-S_Work', 'Workobject', 'W_W');
    db.addEdge('A_A', 'W_W-S_Work', 'works on', 1, 'S_Work');
    db.setSentenceTarget('S_Work', 'A_A');
    db.setSentenceComment('S_Work', 'noteS<script>alert(5)</script>End');

    const fakeDiagram = { db } as unknown as Diagram;

    await renderer.draw('', id, '1.0.0', fakeDiagram);

    const svgMarkup = svg.node()?.outerHTML ?? '';
    expect(svgMarkup).not.toMatch(/<script\b/i);
  });

  jsdomIt('renders a multiline annotation body as a line break', async ({ svg }) => {
    const id = 'domainstorytelling-render-annotation-multiline';
    setupSvg(svg, id);

    const db = new DomainStorytellingDb();
    db.addActor('A_A', 'Actor');
    db.addWorkobject('W_W-1', 'Workobject', 'W_W');
    db.addEdge('A_A', 'W_W-1', 'works on', 1);
    // A newline inside the quoted body must survive to a <br> in the HTML label.
    db.setActorComment('A_A', 'line one\nline two');

    const fakeDiagram = { db } as unknown as Diagram;

    await renderer.draw('', id, '1.0.0', fakeDiagram);

    const svgMarkup = svg.node()?.outerHTML ?? '';
    const label = /<div class="domainstorytelling-annotation-content[^>]*>([\S\s]*?)<\/div>/.exec(
      svgMarkup
    );
    expect(label?.[1]).toBe('line one<br>line two');
  });

  jsdomIt('renders grouped domainstorytelling without crashing', async ({ svg }) => {
    const id = 'domainstorytelling-render-groups-smoke';
    setupSvg(svg, id);

    const db = new DomainStorytellingDb();
    db.addGroup('G_Company', 'Company');
    db.addGroup('G_Engineering', 'Engineering', 'G_Company');
    db.addGroup('G_QA', 'QA', 'G_Company');
    db.setGroupComment('G_Engineering', 'engineering note');

    db.addActor('A_Manager', 'Manager');
    db.setActorGroup('A_Manager', 'G_Company');
    db.addActor('A_Dev', 'Dev');
    db.setActorGroup('A_Dev', 'G_Engineering');
    db.setActorComment('A_Dev', 'dev note');
    db.addActor('A_QA', 'QA');
    db.setActorGroup('A_QA', 'G_QA');
    db.addWorkobject('W_Task', 'Task', 'W_Task');
    db.addWorkobject('W_Build', 'Build', 'W_Build');

    db.addEdge('A_Manager', 'W_Task', 'assigns', 1, 'S1');
    db.addEdge('A_Dev', 'W_Build', 'builds', 2, 'S2');
    db.addEdge('A_QA', 'W_Build', 'verifies', 3, 'S3');
    db.setSentenceTarget('S2', 'A_Dev');
    db.setSentenceComment('S2', 'sentence note');

    const fakeDiagram = { db } as unknown as Diagram;

    await expect(renderer.draw('', id, '1.0.0', fakeDiagram)).resolves.toBeUndefined();

    const svgMarkup = svg.node()?.outerHTML ?? '';
    expect(svgMarkup).toContain(`id="${id}-A_Manager"`);
    expect(svgMarkup).toContain(`id="${id}-G_Company"`);
    expect(svgMarkup).toContain(`id="${id}-ANNO_group_G_Engineering"`);
    expect(svgMarkup).toContain(`id="${id}-ANNO_actor_A_Dev"`);
    expect(svgMarkup).toContain(`id="${id}-ANNO_sentence_S2"`);
    expect(svgMarkup).toContain('domainstorytelling-annotation-link');
  });

  jsdomIt('honors the domainstorytelling.useMaxWidth config', async ({ svg }) => {
    const buildDiagram = () => {
      const db = new DomainStorytellingDb();
      db.addActor('A_A', 'Actor');
      db.addWorkobject('W_W-1', 'Workobject', 'W_W');
      db.addEdge('A_A', 'W_W-1', 'works on', 1);
      return { db } as unknown as Diagram;
    };

    // useMaxWidth: true keeps the responsive width="100%" behavior.
    const maxWidthId = 'domainstorytelling-usemaxwidth-true';
    setupSvg(svg, maxWidthId, { domainstorytelling: { useMaxWidth: true } });
    await renderer.draw('', maxWidthId, '1.0.0', buildDiagram());
    expect(svg.node()?.getAttribute('width')).toBe('100%');

    // useMaxWidth: false switches to a fixed pixel width instead.
    const fixedId = 'domainstorytelling-usemaxwidth-false';
    setupSvg(svg, fixedId, { domainstorytelling: { useMaxWidth: false } });
    await renderer.draw('', fixedId, '1.0.0', buildDiagram());
    expect(svg.node()?.getAttribute('width')).not.toBe('100%');
  });
});
