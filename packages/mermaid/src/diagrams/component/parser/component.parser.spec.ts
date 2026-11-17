import { describe, expect, it } from 'vitest';
import { db } from '../componentDb.js';
import { parser } from './component.chevrotain.js';

describe('component parser', () => {
  it('parses nested components, ports and packages', async () => {
    await parser.parse(`component-beta
package Backend {
  component Payments {
    port api
  }
  component Ledger
}
`);
    expect(db.getPackages().has('Backend')).toBe(true);
    expect(db.getComponents().has('Payments')).toBe(true);
    expect(db.getComponents().has('Ledger')).toBe(true);
    expect(db.getPorts().has('Payments.api')).toBe(true);
    expect(db.getComponent('Payments')?.parentId).toBe('Backend');
    expect(db.getComponent('Ledger')?.parentId).toBe('Backend');
  });

  it('parses every relation kind', async () => {
    await parser.parse(`component-beta
component A
component B
interface I
A --() I
A --( I
A ..> B : dep
A --> B : assoc
A -- B
`);
    const kinds = db.getRelations().map((r) => r.kind);
    expect(kinds).toEqual(['provides', 'requires', 'dependency', 'association', 'link']);
    expect(db.getRelations()[2].label).toBe('dep');
    expect(db.getRelations()[3].label).toBe('assoc');
  });

  it('reports a line and column on a syntax error', async () => {
    await expect(parser.parse('component-beta\ncomponent\n')).rejects.toThrow(/line 2, column/);
  });

  it('rejects a relation to an unknown identifier', async () => {
    await expect(parser.parse('component-beta\nA --> B\n')).rejects.toThrow(/Unknown identifier/);
  });

  it('rejects a duplicate identifier', async () => {
    await expect(parser.parse('component-beta\ncomponent A\ninterface A\n')).rejects.toThrow(
      /already in use/
    );
  });

  it('allows a port declared on its own enclosing component', async () => {
    await expect(
      parser.parse('component-beta\ncomponent A {\n  port p\n}\n')
    ).resolves.toBeUndefined();
    expect(db.getPorts().has('A.p')).toBe(true);
  });

  it('parses actors with a label and a stereotype', async () => {
    await parser.parse(`component-beta
actor User
actor Bank["Central bank"] <<external>>
component Shop
User --> Shop
`);
    expect(db.getActors().get('User')).toMatchObject({ label: 'User' });
    expect(db.getActors().get('Bank')).toMatchObject({
      label: 'Central bank',
      stereotype: 'external',
    });
    expect(db.getRelations()[0]).toMatchObject({ source: 'User', target: 'Shop' });
  });

  it('keeps identifiers that start with the actor keyword', async () => {
    await parser.parse('component-beta\ncomponent actorRegistry\n');
    expect(db.getComponents().has('actorRegistry')).toBe(true);
  });
});
