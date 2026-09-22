// @ts-ignore: jison doesn't export types
import block from './parser/block.jison';
import db from './blockDB.js';
import * as configApi from '../../config.js';
import getStyles from './styles.js';

/**
 * Palette slots for composites, the same mechanism the flowchart uses for its subgraphs:
 * the db hands each container a `colorIndex`, the renderer stamps it as `data-color-id`,
 * and this stylesheet maps the slot to a border and a fill.
 *
 * Containers only, deliberately. `flowDb` builds its `declarationIndex` by walking
 * `subGraphs` and nothing else, and every selector its stylesheet emits is a `.cluster`
 * or a collapsed subgraph — a plain node never takes a slot. A block diagram's containers
 * are its composites, so those are what take one here, and the simple shapes keep the
 * flat theme colour.
 *
 * Both halves are pinned because either one alone is silent: a slot with no rule renders
 * uncoloured, and a rule with no slot is dead CSS. Neither throws.
 */
describe('block colour slots', () => {
  beforeEach(() => {
    configApi.setSiteConfig({});
    configApi.reset();
    block.parser.yy = db;
    block.parser.yy.clear();
    block.parser.yy.getLogger = () => console;
  });

  const indexOf = (id: string) => db.getBlock(id)?.colorIndex;

  it('numbers composites in declaration order', () => {
    block.parse(`block-beta
      block:first
        a
      end
      block:second
        b
      end
      block:third
        c
      end
    `);

    expect([indexOf('first'), indexOf('second'), indexOf('third')]).toEqual([0, 1, 2]);
  });

  it('gives no slot to a simple block', () => {
    // The flowchart colours containers and leaves its nodes alone; so does this.
    block.parse(`block-beta
      a
      b
      block:group
        c
      end
    `);

    expect(indexOf('a')).toBeUndefined();
    expect(indexOf('b')).toBeUndefined();
    expect(indexOf('c')).toBeUndefined();
    expect(indexOf('group')).toBe(0);
  });

  it('numbers an outer composite before one nested inside it', () => {
    // Source order, not completion order: a container is declared before its children,
    // so it must take the lower slot even though it closes last.
    block.parse(`block-beta
      block:outer
        block:inner
          a
        end
      end
      block:sibling
        b
      end
    `);

    expect(indexOf('outer')).toBe(0);
    expect(indexOf('inner')).toBe(1);
    expect(indexOf('sibling')).toBe(2);
  });

  it('runs one counter across the whole diagram', () => {
    // Not per container. Restarting the count inside each one would open every
    // container's first child on the same colour as its cousins.
    block.parse(`block-beta
      block:a1
        block:a2
          x
        end
      end
      block:b1
        block:b2
          y
        end
      end
    `);

    expect([indexOf('a1'), indexOf('a2'), indexOf('b1'), indexOf('b2')]).toEqual([0, 1, 2, 3]);
  });

  // The base variables every block stylesheet reads, so these tests fail on the
  // palette rather than on a missing colour somewhere unrelated.
  const paletteOptions = {
    arrowheadColor: '#333333',
    border2: '#333333',
    clusterBkg: '#f4f4f4',
    clusterBorder: '#cccccc',
    edgeLabelBackground: '#ffffff',
    fontFamily: 'trebuchet ms',
    lineColor: '#333333',
    mainBkg: '#eeeeee',
    nodeBorder: '#999999',
    nodeTextColor: '#333333',
    tertiaryColor: '#ffffde',
    textColor: '#333333',
    titleColor: '#333333',
    theme: 'redux-color',
    look: 'neo',
    borderColorArray: ['#111111', '#222222'],
    bkgColorArray: ['#eeeeee', '#dddddd'],
  } as any;

  it('emits one composite rule per palette entry under a colour theme', () => {
    const styles = getStyles(paletteOptions);

    expect(styles).toContain('[data-look="neo"][data-color-id="color-0"].node rect.composite');
    expect(styles).toContain('[data-look="neo"][data-color-id="color-1"].node rect.composite');
    expect(styles).toContain('#111111');
    expect(styles).toContain('#eeeeee');
    // Exactly as many slots as the palette has entries: a slot with no rule renders
    // uncoloured, and a rule with no slot is dead CSS.
    expect(styles).not.toContain('color-2');
  });

  it('leaves the simple shapes to the flat theme colour', () => {
    const styles = getStyles(paletteOptions);
    const paletteRules = styles.slice(0, styles.indexOf('.label {'));

    // Every palette selector names `rect.composite`; nothing reaches a plain block.
    for (const selector of paletteRules.match(/\[data-color-id="color-\d+"][^{]*/g) ?? []) {
      expect(selector).toContain('rect.composite');
    }
  });

  it('emits nothing for a theme that carries no palette', () => {
    const styles = getStyles({ ...paletteOptions, theme: 'default' });

    expect(styles).not.toContain('data-color-id');
  });

  it('rejects a look that would break out of the selector', () => {
    // `look` is a top-level config key, so it is reachable from diagram frontmatter,
    // and `config.sanitize` leaves braces and quotes intact.
    const styles = getStyles({ ...paletteOptions, look: 'neo"] { fill: red } [x="' });

    expect(styles).not.toContain('fill: red');
    expect(styles).toContain('[data-look="classic"]');
  });
});
