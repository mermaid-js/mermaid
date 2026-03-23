import { describe, it, expect, beforeEach } from 'vitest';
import db from './usecaseDb.js';

beforeEach(() => db.clear());

describe('usecaseDb parser', () => {
  it('parses actors', () => {
    db.parseDiagram(`usecaseDiagram\nactor "Admin" as A`);
    expect(db.getActors()).toEqual({ A: 'Admin' });
  });

  it('parses usecases inside system', () => {
    db.parseDiagram(`usecaseDiagram\nsystem "App" {\nusecase "Login" as L\n}`);
    expect(db.getUseCases()).toHaveProperty('L', 'Login');
    expect(db.getSystem()).toBe('App');
  });

  it('parses association connections', () => {
    db.parseDiagram(`usecaseDiagram\nactor "User" as U\nusecase "Login" as L\nU --> L`);
    expect(db.getConnections()).toContainEqual({
      from: 'U',
      type: 'association',
      to: 'L',
      label: undefined,
    });
  });

  it('parses include rel-block', () => {
    db.parseDiagram(`usecaseDiagram\nusecase "A" as A\nusecase "B" as B\ninclude: A-->B`);
    expect(db.getConnections()[0]).toMatchObject({
      from: 'A',
      type: 'include',
      to: 'B',
      label: '<<include>>',
    });
  });

  it('rejects invalid connection and does not crash', () => {
    db.parseDiagram(`usecaseDiagram\nactor "U" as U\nusecase "L" as L\nanchor: U-->L`);
    expect(db.getConnections()).toHaveLength(0);
  });

  it('rejects actor in containment', () => {
    db.parseDiagram(`usecaseDiagram\nactor "U" as U\nusecase "L" as L\ncontainment: U-->L`);
    expect(db.getConnections()).toHaveLength(0);
  });

  it('allows note->actor via anchor', () => {
    db.parseDiagram(`usecaseDiagram\nactor "U" as U\nnote "N" as N1\nanchor: N1-->U`);
    expect(db.getConnections()).toHaveLength(1);
  });

  it('allows note->note only via constraint', () => {
    db.parseDiagram(`usecaseDiagram\nnote "A" as NA\nnote "B" as NB\nanchor: NA-->NB`);
    expect(db.getConnections()).toHaveLength(0); // anchor rejects note→note

    db.clear();
    db.parseDiagram(`usecaseDiagram\nnote "A" as NA\nnote "B" as NB\nconstraint: NA-->NB`);
    expect(db.getConnections()).toHaveLength(1); // constraint allows it
  });
});
