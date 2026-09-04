import { setConfig } from '../../config.js';
import c4Db from './c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './parser/c4Diagram.jison';
import { getData } from './c4LayoutData.js';
import type { MermaidConfig } from '../../config.type.js';

setConfig({ securityLevel: 'strict' });

const parse = (text: string) => {
  c4.parser.yy = c4Db;
  c4.parser.yy.clear();
  c4.parser.parse(text);
  return c4.parser.yy;
};

const config = (): MermaidConfig => ({ c4: { width: 216, c4ShapePadding: 20 }, look: 'classic' });

describe('c4LayoutData.getData', () => {
  it('turns boundaries into group nodes and nests their contents', () => {
    const db = parse(`C4Context
Enterprise_Boundary(e1, "Bank") {
System(SystemAA, "Internet Banking System", "Allows customers to view information")
}
Person(customerA, "Banking Customer A")`);

    const { nodes } = getData(db, config());

    const boundary = nodes.find((n) => n.id === 'e1');
    expect(boundary).toMatchObject({ isGroup: true, shape: 'rect' });
    // the boundary is at the top level, so it has no parent
    expect(boundary?.parentId).toBeUndefined();

    // the element inside is nested under it, the element outside is not
    expect(nodes.find((n) => n.id === 'SystemAA')).toMatchObject({
      parentId: 'e1',
      isGroup: false,
    });
    expect(nodes.find((n) => n.id === 'customerA')?.parentId).toBeUndefined();
  });

  it('labels a boundary with its type only when the type adds something', () => {
    const db = parse(`C4Context
Enterprise_Boundary(e1, "Bank") {
System_Boundary(s1, "Internet Banking") {
System(sys, "SPA")
}
Boundary(b1, "Region", "us-east-1") {
System(sys2, "Reporting")
}
}`);

    const labelOf = (id: string) => getData(db, config()).nodes.find((n) => n.id === id)?.label;
    // the grammar injects its boundary kind in upper case
    expect(labelOf('e1')).toBe('Bank [Enterprise]');
    // `system` only restates System_Boundary, so it is left off
    expect(labelOf('s1')).toBe('Internet Banking');
    // a type that came from the diagram source is shown as written
    expect(labelOf('b1')).toBe('Region [us-east-1]');
  });

  it('does not label a deployment node with its implied node type', () => {
    const db = parse(`C4Deployment
Node(n1, "Server") {
Container(api, "API")
}
Node(n2, "Host", "Ubuntu 22.04") {
Container(store, "Store")
}`);

    const labelOf = (id: string) => getData(db, config()).nodes.find((n) => n.id === id)?.label;
    expect(labelOf('n1')).toBe('Server');
    expect(labelOf('n2')).toBe('Host [Ubuntu 22.04]');
  });

  it('never emits the implicit global boundary as a node', () => {
    const db = parse(`C4Context\nPerson(a, "A")`);
    const { nodes } = getData(db, config());
    expect(nodes.map((n) => n.id)).not.toContain('global');
  });

  it('resolves element shapes through the shared adapter', () => {
    const db = parse(`C4Context
Person(p, "P")
System(s, "S")
SystemDb(sdb, "SDB")
SystemQueue(sq, "SQ")`);

    const { nodes } = getData(db, config());
    const shapeOf = (id: string) => nodes.find((n) => n.id === id)?.shape;
    expect(shapeOf('p')).toBe('person');
    expect(shapeOf('s')).toBe('rounded');
    expect(shapeOf('sdb')).toBe('cylinder');
    expect(shapeOf('sq')).toBe('h-cyl');
  });

  it('carries the stereotype and description the label helper renders', () => {
    const db = parse(`C4Context\nContainer(c, "SPA", "JavaScript", "Front-end")`);
    const { nodes } = getData(db, config());
    expect(nodes.find((n) => n.id === 'c')).toMatchObject({
      label: 'SPA',
      stereotype: '[Container: JavaScript]',
      description: ['Front-end'],
      useHtmlLabels: false,
    });
  });

  // Each relationship needs its own pair of endpoints: c4Db.addRel merges any
  // relationship that repeats an existing from/to, so reusing a pair here would
  // collapse the three kinds into one.
  it('builds one edge per relationship, with arrowheads by direction', () => {
    const db = parse(`C4Context
Person(a, "A")
Person(b, "B")
Person(c, "C")
Person(d, "D")
Rel(a, b, "uses")
BiRel(b, c, "syncs")
Rel_Back(c, d, "returns")`);

    const { edges } = getData(db, config());
    expect(edges).toHaveLength(3);

    expect(edges[0]).toMatchObject({
      start: 'a',
      end: 'b',
      arrowTypeEnd: 'arrow_point',
      classes: 'c4-rel',
      curve: 'linear',
      labelpos: 'c',
    });
    expect(edges[0].arrowTypeStart).toBeUndefined();

    // BiRel gets an arrowhead at both ends
    expect(edges[1]).toMatchObject({ arrowTypeStart: 'arrow_point', arrowTypeEnd: 'arrow_point' });

    // Rel_Back points the other way only
    expect(edges[2].arrowTypeStart).toBe('arrow_point');
    expect(edges[2].arrowTypeEnd).toBeUndefined();
  });

  // A relationship may name a boundary rather than a shape (#4864). The legacy renderer
  // needed the boundary to carry its own intersect function for this; here the boundary is
  // an ordinary group node, so the edge is built the same way as any other.
  it('builds an edge whose endpoint is a boundary', () => {
    const db = parse(`C4Context
Container_Boundary(banking, "Internet Banking") {
Container(spa, "SPA", "JavaScript", "Front-end")
}
System_Ext(email, "Email System", "External mail")
Rel(banking, email, "Forwards alerts")`);

    const { nodes, edges } = getData(db, config());

    expect(nodes.find((n) => n.id === 'banking')).toMatchObject({ isGroup: true });
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ start: 'banking', end: 'email' });
  });

  it('numbers relationships in a C4Dynamic diagram', () => {
    const db = parse(`C4Dynamic
Person(a, "A")
Person(b, "B")
Rel(a, b, "first")
Rel(b, a, "second")`);

    const { edges } = getData(db, config());
    expect(edges[0].label).toContain('1: first');
    expect(edges[1].label).toContain('2: second');
  });

  it('does not number relationships outside C4Dynamic', () => {
    const db = parse(`C4Context\nPerson(a, "A")\nPerson(b, "B")\nRel(a, b, "plain")`);
    const { edges } = getData(db, config());
    expect(edges[0].label).toContain('plain');
    expect(edges[0].label).not.toContain('1:');
  });

  it('passes the db direction through', () => {
    const db = parse(`C4Context\nPerson(a, "A")`);
    const { direction } = getData(db, config());
    expect(typeof direction).toBe('string');
  });

  it('carries an UpdateRelStyle colour into the edge style', () => {
    const db = parse(`C4Context
Person(a, "A")
Person(b, "B")
Rel(a, b, "uses")
UpdateRelStyle(a, b, $lineColor="red", $textColor="blue")`);

    const { edges } = getData(db, config());
    expect(edges[0].style).toContain('stroke:red');
    expect(edges[0].labelStyle).toContain('color:blue');
  });

  // The colour is interpolated into a CSS declaration, so a value carrying `;` could
  // append further declarations. Anything that is not a colour on its own is dropped
  // rather than escaped, so no partial value reaches the style string.
  it('drops an UpdateRelStyle colour that is not a colour on its own', () => {
    const db = parse(`C4Context
Person(a, "A")
Person(b, "B")
Rel(a, b, "uses")
UpdateRelStyle(a, b, $lineColor="red;background:url(x)", $textColor="blue;content:'x'")`);

    const { edges } = getData(db, config());
    expect(edges[0].style).toHaveLength(0);
    expect(edges[0].labelStyle).toHaveLength(0);
  });

  it('carries a $link into the node', () => {
    const db = parse(`C4Context\nPerson(a, "A", "desc", $link="https://example.com")`);

    const { nodes } = getData(db, config());
    // Sanitizing normalises the URL, as it does for a flowchart `click ... href`.
    expect(nodes.find((node) => node.id === 'a')?.link).toBe('https://example.com/');
  });

  // The link is written to `xlink:href` unescaped, and the SVG-level DOMPurify pass is
  // skipped at `securityLevel: 'loose'`, so the scheme has to be rejected here.
  it('neutralises a $link that carries a javascript: scheme', () => {
    const db = parse(`C4Context\nPerson(a, "A", "desc", $link="javascript:alert(1)")`);

    const { nodes } = getData(db, config());
    expect(nodes.find((node) => node.id === 'a')?.link).not.toContain('javascript:');
  });

  // `UpdateElementStyle` resolves its alias against the elements first and then the
  // boundaries, so the same statement styles either.
  it('carries an UpdateElementStyle colour into the boundary style', () => {
    const db = parse(`C4Context
Enterprise_Boundary(b1, "Bank") {
Person(a, "A")
}
UpdateElementStyle(b1, $bgColor="red", $borderColor="blue", $fontColor="green")`);

    const { nodes } = getData(db, config());
    expect(nodes.find((node) => node.id === 'b1')?.cssStyles).toEqual([
      'fill:red',
      'stroke:blue',
      'color:green',
    ]);
  });

  // As for a relationship colour: a boundary colour is interpolated into a CSS
  // declaration, and a boundary has no palette to fall back to, so it is dropped.
  it('drops a boundary colour that is not a colour on its own', () => {
    const db = parse(`C4Context
Enterprise_Boundary(b1, "Bank") {
Person(a, "A")
}
UpdateElementStyle(b1, $bgColor="red;background:url(x)", $borderColor="blue;content:'x'")`);

    const { nodes } = getData(db, config());
    expect(nodes.find((node) => node.id === 'b1')?.cssStyles).toHaveLength(0);
  });

  // With HTML labels off the label is rendered as SVG text, where markup would show up
  // as literal characters rather than as emphasis.
  it('builds a plain relationship label when HTML labels are off', () => {
    const db = parse(`C4Context
Person(a, "A")
Person(b, "B")
Rel(a, b, "Uses", "HTTPS", "to read accounts")`);

    const { edges } = getData(db, { ...config(), htmlLabels: false });
    expect(edges[0].label).toBe('Uses<br/>[HTTPS]<br/>to read accounts');
    expect(edges[0].label).not.toContain('<b>');
  });
});
