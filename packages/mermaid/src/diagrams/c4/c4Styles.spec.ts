import { setConfig } from '../../config.js';
import defaultConfig from '../../defaultConfig.js';
import getStyles from './styles.js';

const styles = () => getStyles({});

const MESSAGE_RULE = /g\.edgeLabel[^{]*{([^}]*)}/;

describe('c4 styles: relationship fonts', () => {
  afterEach(() => {
    setConfig({ c4: {} });
  });

  it('adds no font rule for relationship labels with the default config', () => {
    expect(styles()).not.toMatch(MESSAGE_RULE);
  });

  it('adds no font rule for a value equal to its default', () => {
    const c4 = defaultConfig.c4;
    setConfig({
      c4: {
        messageFontSize: c4.messageFontSize,
        messageFontFamily: c4.messageFontFamily,
      },
    });
    expect(styles()).not.toMatch(MESSAGE_RULE);
  });

  it('sets relationship labels from c4.messageFont*', () => {
    setConfig({
      c4: { messageFontSize: 20, messageFontFamily: 'serif', messageFontWeight: 'bold' },
    });
    const [, declarations] = MESSAGE_RULE.exec(styles()) ?? [];
    expect(declarations).toContain('font-family: serif;');
    expect(declarations).toContain('font-size: 20px;');
    expect(declarations).toContain('font-weight: bold;');
  });

  it('keeps the element font rules', () => {
    setConfig({ c4: { personFontSize: 18 } });
    expect(styles()).toMatch(/\.c4-shape\.c4-person \.label {[^}]*font-size: 18px;/);
  });

  // An HTML label nests the text inside the label group, and both match a selector that
  // names the two; a relative size set on both would apply twice.
  it('sets a relative message size once and lets the nested label inherit it', () => {
    setConfig({ c4: { messageFontSize: '1.5em' } });
    const rules = styles()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('g.edgeLabel'));
    const sizes = rules.map((rule) => {
      const [selectors, body] = rule.split('{');
      const size = /font-size: ([^;]+);/.exec(body)?.[1];
      return { nestedOnly: selectors.trim() === 'g.edgeLabel .edgeLabel', size };
    });
    expect(sizes).toContainEqual({ nestedOnly: false, size: '1.5em' });
    expect(sizes).toContainEqual({ nestedOnly: true, size: 'inherit' });
    expect(sizes.filter((entry) => entry.size === '1.5em')).toHaveLength(1);
  });

  // An HTML label sits in a foreignObject, where the SVG `fill` of its ancestors does not
  // colour text; without `color` it took the host page's text colour.
  it.each([
    ['the theme text colour', { textColor: '#ccc', background: '#333' }, '#ccc'],
    ['a fallback without a theme', {}, '#333333'],
  ])('gives relationship labels %s', (_case, options, expected) => {
    const [, declarations] = /\n {2}\.edgeLabel {([^}]*)}/.exec(getStyles(options)) ?? [];
    expect(declarations).toContain(`color: ${expected};`);
  });
});
