// @ts-ignore: JISON doesn't support types
import c4 from './parser/c4Diagram.jison';
import c4Db from './c4Db.js';
import { getData } from './c4LayoutData.js';
import { setConfig } from '../../config.js';
import type { MermaidConfig } from '../../config.type.js';

setConfig({
  securityLevel: 'strict',
});

describe('C4 getData LayoutData adapter', () => {
  beforeEach(() => {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  const parse = (text: string) => {
    c4.parser.parse(text);
  };

  const data = () => getData(c4Db, { c4: {} } as MermaidConfig);

  it('maps elements to nodes with parentId from their boundary', () => {
    parse(`C4Context
title System Context diagram for Internet Banking System
Enterprise_Boundary(b0, "BankBoundary0") {
  Person(customerA, "Banking Customer A", "A customer of the bank.")
  System(SystemAA, "Internet Banking System", "Allows customers to view information.")
  Enterprise_Boundary(b1, "BankBoundary") {
    System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
  }
}
Person_Ext(customerC, "Banking Customer C")
`);
    const { nodes } = data();
    const byId = new Map(nodes.map((n) => [n.id, n]));

    expect(byId.get('b0')).toMatchObject({ isGroup: true, parentId: undefined });
    expect(byId.get('b1')).toMatchObject({ isGroup: true, parentId: 'b0' });
    expect(byId.get('customerA')).toMatchObject({ isGroup: false, parentId: 'b0' });
    expect(byId.get('SystemAA')).toMatchObject({ isGroup: false, parentId: 'b0' });
    expect(byId.get('SystemC')).toMatchObject({ isGroup: false, parentId: 'b1' });
    expect(byId.get('customerC')?.parentId).toBeUndefined();
  });

  it('maps relationship types to edges with correct arrows', () => {
    parse(`C4Context
Person(a, "A")
System(b, "B")
System(c, "C")
BiRel(a, b, "Uses")
Rel(b, c, "Sends e-mails", "SMTP")
`);
    const { edges } = data();
    expect(edges).toHaveLength(2);
    expect(edges[0]).toMatchObject({
      start: 'a',
      end: 'b',
      arrowTypeStart: 'arrow_point',
      arrowTypeEnd: 'arrow_point',
    });
    expect(edges[1]).toMatchObject({
      start: 'b',
      end: 'c',
      arrowTypeStart: undefined,
      arrowTypeEnd: 'arrow_point',
    });
    expect(edges[1].label).toContain('Sends e-mails');
    expect(edges[1].label).toContain('SMTP');
  });

  it('preserves UpdateElementStyle and UpdateRelStyle as css styles', () => {
    parse(`C4Context
Person(a, "A")
System(b, "B")
Rel(a, b, "Uses")
UpdateElementStyle(a, $fontColor="red", $bgColor="grey", $borderColor="blue")
UpdateRelStyle(a, b, $textColor="blue", $lineColor="green", $offsetX="5")
`);
    const { nodes, edges } = data();
    const a = nodes.find((n) => n.id === 'a');
    expect(a?.cssStyles).toEqual(expect.arrayContaining(['fill:grey', 'stroke:blue', 'color:red']));
    expect(edges[0].style).toEqual(expect.arrayContaining(['stroke:green']));
    expect(edges[0].labelStyle).toEqual(expect.arrayContaining(['color:blue']));
  });

  it('applies the configured C4 palette as an outline (border + text) over a light fill', () => {
    parse(`C4Context
Person(a, "A")
System_Ext(b, "B")
`);
    const { nodes } = getData(c4Db, {
      c4: { person_bg_color: '#08427B', external_system_bg_color: '#999999' },
    } as MermaidConfig);
    // #08427B is already dark, so it is used verbatim as border and text.
    expect(nodes.find((n) => n.id === 'a')?.cssStyles).toEqual(
      expect.arrayContaining(['fill:#ffffff', 'stroke:#08427b', 'color:#08427b'])
    );
    // #999999 is too light for text on white, so it is darkened for legibility.
    const ext = nodes.find((n) => n.id === 'b')?.cssStyles ?? [];
    expect(ext).toContain('fill:#ffffff');
    expect(ext.some((s) => /^stroke:#[\da-f]{6}$/.test(s) && s !== 'stroke:#999999')).toBe(true);
  });

  it('maps element variants to dedicated shapes', () => {
    parse(`C4Context
SystemDb(db1, "Database")
SystemQueue(q1, "Queue")
System(s1, "System")
Person(p1, "Person")
`);
    const { nodes } = data();
    expect(nodes.find((n) => n.id === 'db1')?.shape).toBe('cylinder');
    expect(nodes.find((n) => n.id === 'q1')?.shape).toBe('h-cyl');
    expect(nodes.find((n) => n.id === 's1')?.shape).toBe('rounded');
    expect(nodes.find((n) => n.id === 'p1')?.shape).toBe('c4-person');
  });

  it('resolves an explicit $shape over the element type', () => {
    parse(`C4Context
System(s1, "System")
SystemDb(s2, "Store")
UpdateElementStyle(s1, $shape="folder")
UpdateElementStyle(s2, $shape="browser")
`);
    const { nodes } = data();
    expect(nodes.find((n) => n.id === 's1')?.shape).toBe('c4-folder');
    expect(nodes.find((n) => n.id === 's2')?.shape).toBe('c4-browser');
  });

  it('resolves a recognised $sprite keyword when no $shape is set', () => {
    parse(`C4Context
System(s1, "S1", "Desc", $sprite="bucket")
System(s2, "S2", "Desc", $sprite="terminal")
`);
    const { nodes } = data();
    expect(nodes.find((n) => n.id === 's1')?.shape).toBe('c4-bucket');
    expect(nodes.find((n) => n.id === 's2')?.shape).toBe('c4-terminal');
  });

  it('renders Structurizr-style node labels', () => {
    parse(`C4Container
Container(c1, "API", "Spring Boot", "Handles requests")
System(s1, "Mainframe")
`);
    const { nodes } = data();
    const c1 = nodes.find((n) => n.id === 'c1');
    expect(c1?.label).toContain('<b>API</b>');
    expect(c1?.label).toContain('[Container: Spring Boot]');
    expect(c1?.label).toContain('Handles requests');
    expect(nodes.find((n) => n.id === 's1')?.label).toContain('[Software System]');
  });

  it('marks deployment nodes as group nodes', () => {
    parse(`C4Deployment
Deployment_Node(n1, "AWS", "Cloud") {
  Container(c1, "API", "Java")
}
`);
    const { nodes } = data();
    expect(nodes.find((n) => n.id === 'n1')).toMatchObject({ isGroup: true });
    expect(nodes.find((n) => n.id === 'c1')).toMatchObject({ isGroup: false, parentId: 'n1' });
  });
});
