import { buildEdgeLabel } from './c4ShapeAdapter.js';

const rel = (label: string, techn?: string, descr?: string) => ({
  label: { text: label },
  techn: techn === undefined ? undefined : { text: techn },
  descr: descr === undefined ? undefined : { text: descr },
});

describe('buildEdgeLabel', () => {
  it('emphasises the name and the technology in an HTML label', () => {
    expect(buildEdgeLabel(rel('Uses', 'HTTPS', 'to read accounts'), true)).toBe(
      '<b>Uses</b><br/><small><i>[HTTPS]</i></small><br/><small>to read accounts</small>'
    );
  });

  it('omits the parts a relationship does not have', () => {
    expect(buildEdgeLabel(rel('Uses'), true)).toBe('<b>Uses</b>');
    expect(buildEdgeLabel(rel('Uses', undefined, 'why'), true)).toBe(
      '<b>Uses</b><br/><small>why</small>'
    );
  });

  // With htmlLabels off the label is rendered as SVG text, where markup would show up as
  // literal characters rather than as emphasis. `<br/>` survives either way: it is a line
  // break in an HTML label and a line delimiter in a plain one.
  it('carries the same words without markup when HTML labels are off', () => {
    expect(buildEdgeLabel(rel('Uses', 'HTTPS', 'to read accounts'), false)).toBe(
      'Uses<br/>[HTTPS]<br/>to read accounts'
    );
  });

  it('escapes user text in an HTML label, and leaves it alone in a plain one', () => {
    const hostile = rel('<script>alert(1)</script> & "x"');
    expect(buildEdgeLabel(hostile, true)).toBe(
      '<b>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot;</b>'
    );
    // The plain form is set as text content, so the characters need no escaping here.
    expect(buildEdgeLabel(hostile, false)).toBe('<script>alert(1)</script> & "x"');
  });

  it('builds an HTML label by default', () => {
    expect(buildEdgeLabel(rel('Uses'))).toBe('<b>Uses</b>');
  });
});
