import { setConfig } from '../../config.js';
import defaultConfig from '../../defaultConfig.js';
import getStyles from './styles.js';

const styles = () => getStyles({});

const BOUNDARY_RULE = /\.cluster\.c4-boundary \.cluster-label[^{]*{([^}]*)}/;
const MESSAGE_RULE = /g\.edgeLabel[^{]*{([^}]*)}/;

describe('c4 styles: boundary and relationship fonts', () => {
  afterEach(() => {
    setConfig({ c4: {} });
  });

  it('adds no font rule for either label with the default config', () => {
    const css = styles();
    expect(css).not.toMatch(BOUNDARY_RULE);
    expect(css).not.toMatch(MESSAGE_RULE);
  });

  it('adds no font rule for a value equal to its default', () => {
    const c4 = defaultConfig.c4;
    setConfig({
      c4: {
        messageFontSize: c4.messageFontSize,
        messageFontFamily: c4.messageFontFamily,
        boundaryFontWeight: c4.boundaryFontWeight,
      },
    });
    const css = styles();
    expect(css).not.toMatch(BOUNDARY_RULE);
    expect(css).not.toMatch(MESSAGE_RULE);
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

  it('sets boundary titles from c4.boundaryFont*, and only the values that differ', () => {
    setConfig({ c4: { boundaryFontSize: '1.5em', boundaryFontWeight: 600 } });
    const [, declarations] = BOUNDARY_RULE.exec(styles()) ?? [];
    expect(declarations).toContain('font-size: 1.5em;');
    expect(declarations).toContain('font-weight: 600;');
    expect(declarations).not.toContain('font-family');
  });

  it('keeps the element font rules', () => {
    setConfig({ c4: { personFontSize: 18 } });
    expect(styles()).toMatch(/\.c4-shape\.c4-person \.label {[^}]*font-size: 18px;/);
  });

  // An HTML label nests the text inside the label group, and both match a selector that
  // names the two; a relative size set on both would apply twice.
  it.each([
    ['boundary', 'boundaryFontSize', '.cluster.c4-boundary .cluster-label', '.nodeLabel'],
    ['message', 'messageFontSize', 'g.edgeLabel', '.edgeLabel'],
  ])(
    'sets a relative %s size once and lets the nested label inherit it',
    (_kind, key, outer, nested) => {
      setConfig({ c4: { [key]: '1.5em' } });
      const rules = styles()
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith(outer));
      const sizes = rules.map((rule) => {
        const [selectors, body] = rule.split('{');
        const size = /font-size: ([^;]+);/.exec(body)?.[1];
        return { nestedOnly: selectors.trim() === `${outer} ${nested}`, size };
      });
      expect(sizes).toContainEqual({ nestedOnly: false, size: '1.5em' });
      expect(sizes).toContainEqual({ nestedOnly: true, size: 'inherit' });
      expect(sizes.filter((entry) => entry.size === '1.5em')).toHaveLength(1);
    }
  );

  // An HTML label sits in a foreignObject, where the SVG `fill` of its ancestors does not
  // colour text; without `color` it took the host page's text colour.
  it.each([
    ['the theme text colour', { textColor: '#ccc', background: '#333' }, '#ccc'],
    ['a fallback without a theme', {}, '#333333'],
  ])('gives relationship labels %s', (_case, options, expected) => {
    const [, declarations] = /\n {2}\.edgeLabel {([^}]*)}/.exec(getStyles(options)) ?? [];
    expect(declarations).toContain(`color: ${expected};`);
  });

  // The legacy renderer drew a deployment node with a solid outline and every other
  // boundary dashed.
  it('draws a deployment node solid and leaves other boundaries dashed', () => {
    const css = styles();
    const [, deployment] = /\.cluster\.c4-deployment-node > rect {([^}]*)}/.exec(css) ?? [];
    expect(deployment).toContain('stroke-dasharray: none;');
    const [, boundary] = /\n {2}\.cluster rect {([^}]*)}/.exec(css) ?? [];
    expect(boundary).toContain('stroke-dasharray: 8 4;');
  });
});
