import { describe, expect, it } from 'vitest';
import { db } from './componentDb.js';
import { parser } from './parser/component.chevrotain.js';

describe('componentDb getData', () => {
  it('builds nodes, groups and edges from the model', async () => {
    await parser.parse(`component-beta
direction LR
component Web["Web shop"]
component Orders["Order service"] <<service>>
interface IOrders["Orders API"]
package Backend {
  component Payments {
    port api
  }
  component Ledger
}
Orders --() IOrders
Web --( IOrders
Payments.api --() IOrders
Payments ..> Ledger : writes to
Web --> Orders : calls
Web -- Ledger
note for Orders "handles checkout"
`);
    const data = db.getData();

    expect(data.type).toBe('component');
    expect(data.direction).toBe('LR');

    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    expect(byId.get('Web')?.shape).toBe('umlComponent');
    expect(byId.get('Orders')?.shape).toBe('umlComponent');
    expect(byId.get('Orders')?.stereotype).toBe('service');
    expect(byId.get('IOrders')?.shape).toBe('umlInterface');
    expect(byId.get('Backend')?.isGroup).toBe(true);
    expect(byId.get('Backend')?.shape).toBe('umlComponentGroup');
    // Payments has a port, so it becomes a group even though it has no quoted label.
    expect(byId.get('Payments')?.isGroup).toBe(true);
    expect(byId.get('Payments')?.parentId).toBe('Backend');
    expect(byId.get('Ledger')?.isGroup).toBe(false);
    expect(byId.get('Ledger')?.parentId).toBe('Backend');
    expect(byId.get('Payments.api')?.shape).toBe('umlPort');
    expect(byId.get('Payments.api')?.parentId).toBe('Payments');

    const relationKinds = data.edges.filter((e) => !e.internal).map((e) => e.relationKind);
    expect(relationKinds).toEqual(
      expect.arrayContaining(['provides', 'requires', 'dependency', 'association', 'link'])
    );

    const provides = data.edges.find(
      (e) => e.relationKind === 'provides' && e.source === 'Orders'
    )!;
    // The interface node itself is the ball, so the provided edge has no marker.
    expect(provides).toMatchObject({
      end: 'IOrders',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'none',
    });

    // A required edge is laid out from the interface to the requirer, so the interface
    // ranks between provider and requirer and the socket sits on the interface end.
    const requires = data.edges.find((e) => e.relationKind === 'requires')!;
    expect(requires).toMatchObject({
      start: 'IOrders',
      end: 'Web',
      source: 'IOrders',
      target: 'Web',
      sourceLabel: 'Web shop',
      targetLabel: 'Orders API',
      arrowTypeStart: 'socket',
      arrowTypeEnd: 'none',
    });

    expect(byId.get('IOrders')?.captionSide).toBe('bottom');
    expect(byId.get('Payments.api')?.captionSide).toBe('bottom');

    const noteEdge = data.edges.find((e) => e.internal);
    expect(noteEdge?.target).toBe('Orders');
  });

  it('captions interfaces and ports on the side in vertical layouts', async () => {
    await parser.parse(`component-beta
direction TB
component A {
  port p
}
interface I
A.p --() I
`);
    const byId = new Map(db.getData().nodes.map((n) => [n.id, n]));
    expect(byId.get('I')?.captionSide).toBe('right');
    expect(byId.get('A.p')?.captionSide).toBe('right');
  });

  it('lays out actors with the shared actor shape', async () => {
    await parser.parse(`component-beta
actor User["Customer"] <<human>>
component Shop
interface I
Shop --() I
User --( I
classDef vip stroke:#c00
class User vip
`);
    const data = db.getData();
    const user = data.nodes.find((n) => n.id === 'User')!;
    expect(user).toMatchObject({ shape: 'umlActor', label: 'Customer', stereotype: 'human' });
    expect(user.cssClasses).toContain('component-actor');
    expect(user.cssClasses).toContain('vip');
    const requires = data.edges.find((e) => e.relationKind === 'requires')!;
    expect(requires).toMatchObject({ start: 'I', end: 'User', sourceLabel: 'Customer' });
  });

  it('applies classDef/class/style', async () => {
    await parser.parse(`component-beta
component A
classDef hot fill:#f96
class A hot
style A stroke:#333
`);
    const node = db.getData().nodes.find((n) => n.id === 'A')!;
    expect(node.cssClasses).toContain('hot');
    expect(node.cssStyles).toContain('stroke:#333');
  });

  it('clears state between parses', async () => {
    await parser.parse('component-beta\ncomponent A\n');
    expect(db.getComponents().has('A')).toBe(true);
    await parser.parse('component-beta\ncomponent B\n');
    expect(db.getComponents().has('A')).toBe(false);
    expect(db.getComponents().has('B')).toBe(true);
  });

  it('keeps an interface declared in a package inside that package', async () => {
    await parser.parse(`component-beta
package P {
  interface I
  component C
}
interface Top
C --() I
`);
    const data = db.getData();
    expect(data.nodes.find((n) => n.id === 'I')?.parentId).toBe('P');
    expect(data.nodes.find((n) => n.id === 'Top')?.parentId).toBeUndefined();
    expect(db.getPackage('P')?.children).toEqual(['I', 'C']);
  });

  it('gives a note an id no declared element uses', async () => {
    await parser.parse(`component-beta
component note0
note for note0 "description"
component note0_1
note for note0_1 "second"
`);
    const data = db.getData();
    const notes = data.nodes.filter((n) => n.shape === 'note');
    expect(notes.map((n) => n.id)).toEqual(['note0_2', 'note1']);
    expect(new Set(data.nodes.map((n) => n.id)).size).toBe(data.nodes.length);
    const noteEdge = data.edges.find((e) => e.relationKind === 'note' && e.end === 'note0');
    expect(noteEdge).toMatchObject({ start: 'note0_2', id: 'note0_2-edge' });
  });
});
