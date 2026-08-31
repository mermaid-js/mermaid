// @ts-ignore: jison doesn't export types
import block from './parser/block.jison';
import db from './blockDB.js';
import * as configApi from '../../config.js';
import getStyles from './styles.js';

/**
 * Per-block palette slots, the same mechanism the flowchart uses for its subgraphs:
 * the db hands each block a `colorIndex`, the renderer stamps it as `data-color-id`,
 * and this stylesheet maps the slot to a border and a fill.
 *
 * Both halves are pinned here because either one alone is silent. A slot with no rule
 * renders uncoloured, and a rule with no slot is dead CSS — neither throws, so only a
 * test that checks them together catches a drift between them.
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

  it('numbers blocks in declaration order', () => {
    block.parse(`block-beta
      a
      b
      c
    `);

    expect([indexOf('a'), indexOf('b'), indexOf('c')]).toEqual([0, 1, 2]);
  });

  it('gives a composite its own slot before the blocks it contains', () => {
    // Source order, not completion order. A container is declared before its
    // children, so it must take the lower slot even though it closes last.
    block.parse(`block-beta
      outer["Outer"]
      block:group
        inner1
        inner2
      end
      tail
    `);

    expect(indexOf('outer')).toBe(0);
    expect(indexOf('group')).toBe(1);
    expect(indexOf('inner1')).toBe(2);
    expect(indexOf('inner2')).toBe(3);
    expect(indexOf('tail')).toBe(4);
  });

  it('does not spend a slot on a space', () => {
    // A space paints nothing, so giving it a slot would put a gap in the cycle and
    // shift every colour after it for no visible reason.
    block.parse(`block-beta
      a
      space
      b
    `);

    expect(indexOf('a')).toBe(0);
    expect(indexOf('b')).toBe(1);
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

  it('emits one rule per palette entry under a colour theme', () => {
    const styles = getStyles(paletteOptions);

    expect(styles).toContain('[data-look="neo"][data-color-id="color-0"]');
    expect(styles).toContain('[data-look="neo"][data-color-id="color-1"]');
    expect(styles).toContain('#111111');
    expect(styles).toContain('#eeeeee');
    // Exactly as many slots as the palette has entries: a slot with no rule renders
    // uncoloured, and a rule with no slot is dead CSS.
    expect(styles).not.toContain('color-2');
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
