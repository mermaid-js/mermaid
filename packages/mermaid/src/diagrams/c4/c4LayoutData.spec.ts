import { setConfig, setSiteConfig } from '../../config.js';
import c4Db from './c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './parser/c4Diagram.jison';
import { getData } from './c4LayoutData.js';
import type { MermaidConfig } from '../../config.type.js';
import type { Edge, Node } from '../../rendering-util/types.js';
import type { C4LabelNudge } from './c4Types.js';

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

  it('shows a deployment node description on a line under its name', () => {
    const db = parse(`C4Deployment
Node(n1, "Host", "Linux", "Runs the API") {
Container(api, "API")
}
Node(n2, "Server", $descr="Hosts the store") {
Container(store, "Store")
}
Node(n3, "Edge", "Linux") {
Container(proxy, "Proxy")
}`);

    const labelOf = (id: string) => getData(db, config()).nodes.find((n) => n.id === id)?.label;
    expect(labelOf('n1')).toBe('Host [Linux]<br/>Runs the API');
    expect(labelOf('n2')).toBe('Server<br/>Hosts the store');
    // without a description the label is the name and type alone
    expect(labelOf('n3')).toBe('Edge [Linux]');
  });

  it('shows a named $descr on any boundary', () => {
    const db = parse(`C4Context
System_Boundary(s1, "Shop", $descr="Sells books") {
System(web, "Web")
}`);

    expect(getData(db, config()).nodes.find((n) => n.id === 's1')?.label).toBe(
      'Shop<br/>Sells books'
    );
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

  it('neutralises a $link that carries a javascript: scheme', () => {
    const db = parse(`C4Context\nPerson(a, "A", "desc", $link="javascript:alert(1)")`);

    const { nodes } = getData(db, config());
    expect(nodes.find((node) => node.id === 'a')?.link).toBe('about:blank');
  });

  // A named `$link` can land in any optional slot, not only the one declared for it, and
  // `UpdateElementStyle` accepts it as well, so every route has to come out sanitized.
  it.each([
    ['the description slot of a person', 'Person(a, "A", $link="javascript:alert(1)")'],
    ['the technology slot of a container', 'Container(a, "A", $link="javascript:alert(1)")'],
    ['the technology slot of a component', 'Component(a, "A", $link="javascript:alert(1)")'],
    [
      'an UpdateElementStyle attribute',
      'Person(a, "A")\nUpdateElementStyle(a, $link="javascript:alert(1)")',
    ],
    [
      'the type slot of a boundary',
      'Boundary(a, "A", $link="javascript:alert(1)") {\nPerson(p, "P")\n}',
    ],
    [
      'the description slot of a deployment node',
      'Node(a, "A", "t", $link="javascript:alert(1)") {\nContainer(c, "C")\n}',
    ],
  ])('neutralises a javascript: $link given through %s', (_route, statements) => {
    const db = parse(`C4Context\n${statements}`);

    const { nodes } = getData(db, config());
    expect(nodes.find((node) => node.id === 'a')?.link).toBe('about:blank');
  });

  it('keeps a safe $link given through the description slot', () => {
    const db = parse(`C4Context\nPerson(a, "A", $link="https://example.com")`);

    const { nodes } = getData(db, config());
    expect(nodes.find((node) => node.id === 'a')?.link).toBe('https://example.com/');
  });

  // Like a flowchart link, `securityLevel: 'loose'` is the author's explicit trust choice.
  it('keeps a $link as written at securityLevel loose', () => {
    setSiteConfig({ securityLevel: 'loose' });
    try {
      const db = parse(`C4Context\nPerson(a, "A", "desc", $link="javascript:alert(1)")`);

      const { nodes } = getData(db, { ...config(), securityLevel: 'loose' });
      expect(nodes.find((node) => node.id === 'a')?.link).toBe('javascript:alert(1)');
    } finally {
      setSiteConfig({ securityLevel: 'strict' });
    }
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

  it('carries UpdateRelStyle offsets onto the edge for the renderer to apply', () => {
    const db = parse(`C4Context
Person(a, "A")
System(b, "B")
Rel(a, b, "Uses")
UpdateRelStyle(a, b, $offsetX="30", $offsetY="-20")`);

    const { edges } = getData(db, config());
    // the shared pipeline places labels, so the nudge travels as data and is applied after layout
    expect(edges[0]).toMatchObject({ labelOffsetX: 30, labelOffsetY: -20 });
  });

  it('leaves the offsets off an edge that does not set them', () => {
    const db = parse(`C4Context
Person(a, "A")
System(b, "B")
Rel(a, b, "Uses")`);

    const { edges } = getData(db, config());
    const [edge] = edges as (Edge & C4LabelNudge)[];
    expect(edge.labelOffsetX).toBeUndefined();
    expect(edge.labelOffsetY).toBeUndefined();
  });

  describe('relationship label wrapping', () => {
    const db = () =>
      parse(`C4Context
Person(a, "A")
System(b, "B")
Rel(a, b, "Uses")`);

    it('leaves the shared default wrap width in place by default', () => {
      expect(getData(db(), config()).edges[0].labelWrapWidth).toBeUndefined();
    });

    it('stops wrapping when c4.wrap is false', () => {
      const { edges } = getData(db(), { ...config(), c4: { ...config().c4, wrap: false } });
      expect(edges[0].labelWrapWidth).toBe(Number.POSITIVE_INFINITY);
    });

    it('stops wrapping when the root wrap is false', () => {
      const { edges } = getData(db(), { ...config(), wrap: false });
      expect(edges[0].labelWrapWidth).toBe(Number.POSITIVE_INFINITY);
    });

    it('lets the root wrap override c4.wrap', () => {
      const { edges } = getData(db(), { ...config(), wrap: true, c4: { wrap: false } });
      expect(edges[0].labelWrapWidth).toBeUndefined();
    });

    it('lets the root wrap: false win over an explicit c4.wrap: true', () => {
      const { edges } = getData(db(), { ...config(), wrap: false, c4: { wrap: true } });
      expect(edges[0].labelWrapWidth).toBe(Number.POSITIVE_INFINITY);
    });
  });
});

describe('c4LayoutData.getData: boundary direction', () => {
  const dirOf = (nodes: Node[], id: string) => nodes.find((n) => n.id === id)?.dir;

  it('gives a boundary the direction its statement asks for', () => {
    const db = parse(`C4Container
Container_Boundary(shop, "Web shop") {
  direction LR
  Container(cart, "Cart")
}
Container_Boundary(warehouse, "Warehouse") {
  direction BT
  Container(pick, "Pick")
}`);

    const { nodes } = getData(db, config());
    expect(dirOf(nodes, 'shop')).toBe('LR');
    expect(dirOf(nodes, 'warehouse')).toBe('BT');
  });

  it('leaves dir unset on a boundary without a statement and on every element', () => {
    const db = parse(`C4Container
Container_Boundary(shop, "Web shop") {
  direction LR
  Container(cart, "Cart")
}
Container_Boundary(warehouse, "Warehouse") {
  Container(pick, "Pick")
}
Person(buyer, "Buyer")`);

    const { nodes } = getData(db, config());
    expect(dirOf(nodes, 'warehouse')).toBeUndefined();
    expect(nodes.filter((n) => !n.isGroup).map((n) => n.dir)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('sets nothing for a diagram that never asks', () => {
    const db = parse(`C4Container
Container_Boundary(shop, "Web shop") {
  Container(cart, "Cart")
}`);

    const { nodes } = getData(db, config());
    expect(nodes.every((n) => n.dir === undefined)).toBe(true);
  });
});

describe('c4LayoutData.getData: c4.boundaryDirection', () => {
  const dirsOf = (nodes: Node[]) =>
    Object.fromEntries(nodes.filter((n) => n.isGroup).map((n) => [n.id, n.dir]));

  const nested = `C4Container
Container_Boundary(shop, "Web shop") {
  Container(cart, "Cart")
  Container_Boundary(checkout, "Checkout") {
    Container(order, "Order")
  }
}
Container_Boundary(warehouse, "Warehouse") {
  Container(pick, "Pick")
}`;

  it.each([['LR'], ['RL'], ['BT'], ['TB']] as const)(
    'gives every boundary %s, nested ones included',
    (boundaryDirection) => {
      const { nodes } = getData(parse(nested), {
        ...config(),
        c4: { ...config().c4, boundaryDirection },
      });

      expect(dirsOf(nodes)).toEqual({
        shop: boundaryDirection,
        checkout: boundaryDirection,
        warehouse: boundaryDirection,
      });
    }
  );

  it('does not give an element a dir', () => {
    const { nodes } = getData(parse(nested), {
      ...config(),
      c4: { ...config().c4, boundaryDirection: 'LR' },
    });

    expect(nodes.filter((n) => !n.isGroup).map((n) => n.dir)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('yields to the statement of a boundary that has one', () => {
    const db = parse(`C4Container
Container_Boundary(shop, "Web shop") {
  direction TB
  Container(cart, "Cart")
}
Container_Boundary(warehouse, "Warehouse") {
  Container(pick, "Pick")
}`);

    const { nodes } = getData(db, { ...config(), c4: { ...config().c4, boundaryDirection: 'LR' } });

    expect(dirsOf(nodes)).toEqual({ shop: 'TB', warehouse: 'LR' });
  });

  it('sets nothing when the key is absent', () => {
    expect(dirsOf(getData(parse(nested), config()).nodes)).toEqual({
      shop: undefined,
      checkout: undefined,
      warehouse: undefined,
    });
  });
});
