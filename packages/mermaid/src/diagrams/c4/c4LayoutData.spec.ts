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

  it('applies the configured C4 palette per element type', () => {
    parse(`C4Context
Person(a, "A")
System_Ext(b, "B")
`);
    const { nodes } = getData(c4Db, {
      c4: { person_bg_color: '#08427B', external_system_bg_color: '#999999' },
    } as MermaidConfig);
    expect(nodes.find((n) => n.id === 'a')?.cssStyles).toEqual(
      expect.arrayContaining(['fill:#08427B'])
    );
    expect(nodes.find((n) => n.id === 'b')?.cssStyles).toEqual(
      expect.arrayContaining(['fill:#999999'])
    );
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
    expect(nodes.find((n) => n.id === 's1')?.shape).toBe('rect');
    expect(nodes.find((n) => n.id === 'p1')?.shape).toBe('c4-person');
  });

  it('passes the diagram direction to the layout data', () => {
    parse(`C4Context
direction LR
Person(a, "A")
`);
    expect(data().direction).toBe('LR');
  });

  it('defaults the layout direction to TB', () => {
    parse(`C4Context
Person(a, "A")
`);
    expect(data().direction).toBe('TB');
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
