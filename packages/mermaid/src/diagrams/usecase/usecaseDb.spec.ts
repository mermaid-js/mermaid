import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './usecaseDb.js';
import { ARROW_TYPE } from './usecaseTypes.js';
import type { GraphAST, UsecaseFields } from './usecaseTypes.js';

const ast = (source: string): GraphAST => ({
  version: 1,
  diagramType: 'usecase',
  source,
  header: { keyword: 'usecase', direction: 'LR', span: [0, 7] },
  nodes: {},
  edges: [],
  groups: {},
  classDefs: {},
  statements: [],
});

describe('usecase database', () => {
  beforeEach(() => db.clear());

  it('atomically replaces committed state with a detached model', () => {
    const first = db.createModel();
    first.actors.set('User', {
      id: 'User',
      label: 'User',
      labelType: 'text',
      type: 'normal',
      business: false,
      classes: [],
      styles: [],
    });
    first.notes.set('note_0', {
      id: 'note_0',
      target: 'User',
      label: 'First note',
      labelType: 'text',
    });
    first.notes.set('note_1', {
      id: 'note_1',
      target: 'User',
      label: 'Second note',
      labelType: 'markdown',
    });
    first.jsonNodes.set('Payload', {
      id: 'Payload',
      value: { second: 2, first: 1 },
      propertyOrder: { '': ['second', 'first'] },
      classes: ['payload'],
      styles: [],
    });
    first.relationships.push({
      id: 'edge',
      explicitId: true,
      source: 'User',
      target: 'User',
      type: 'association',
      arrowType: ARROW_TYPE.LINE_SOLID,
      minlen: 2,
      classes: ['important'],
      styles: ['stroke:#f00'],
      animate: true,
      animation: 'fast',
    });
    first.ast = ast('usecase\nactor User');

    db.commit(first);
    first.actors.get('User')!.label = 'mutated draft';
    first.notes.clear();
    first.relationships.length = 0;

    expect(db.getActor('User')?.label).toBe('User');
    expect([...db.getNotes().keys()]).toEqual(['note_0', 'note_1']);
    expect([...db.getJsonNodes().keys()]).toEqual(['Payload']);
    expect(db.getRelationships()).toHaveLength(1);
    expect(db.getAST()?.source).toBe('usecase\nactor User');

    const replacement = db.createModel();
    replacement.useCases.set('Login', {
      id: 'Login',
      label: 'Sign in',
      labelType: 'text',
      shape: 'ellipse',
      business: false,
      classes: [],
      styles: [],
    });
    db.commit(replacement);

    expect([...db.getActors()]).toEqual([]);
    expect([...db.getUseCases().keys()]).toEqual(['Login']);
    expect([...db.getNotes()]).toEqual([]);
    expect([...db.getJsonNodes()]).toEqual([]);
    expect(db.getRelationships()).toEqual([]);
    expect(db.getAST()).toBeUndefined();
  });

  it('keeps the previous commit when a replacement is incomplete', () => {
    const committed = db.createModel();
    committed.actors.set('User', {
      id: 'User',
      label: 'User',
      labelType: 'text',
      type: 'normal',
      business: false,
      classes: [],
      styles: [],
    });
    db.commit(committed);

    const incomplete = { ...db.createModel(), notes: undefined } as unknown as UsecaseFields;
    expect(() => db.commit(incomplete)).toThrow('Cannot commit an incomplete usecase model');
    expect([...db.getActors().keys()]).toEqual(['User']);
  });

  it('clears every collection, counter, AST, direction, config, title, and accessibility field', () => {
    const model = db.createModel();
    model.relationshipCounter = 4;
    model.noteCounter = 3;
    model.direction = 'RL';
    model.classDefs.set('important', { id: 'important', styles: ['fill:red'] });
    model.symbols.set('edge', 'edge');
    model.notes.set('note_0', {
      id: 'note_0',
      target: 'User',
      label: 'note',
      labelType: 'text',
    });
    model.jsonNodes.set('Payload', {
      id: 'Payload',
      value: {},
      propertyOrder: { '': [] },
      classes: [],
      styles: [],
    });
    model.ast = ast('usecase');
    db.commit(model);
    db.setDiagramTitle?.('Title');
    db.setAccTitle?.('Accessible title');
    db.setAccDescription?.('Accessible description');

    db.clear();

    const reset = db.createModel();
    expect(db.getActors()).toHaveLength(0);
    expect(db.getUseCases()).toHaveLength(0);
    expect(db.getSystemBoundaries()).toHaveLength(0);
    expect(db.getRelationships()).toHaveLength(0);
    expect(db.getNotes()).toHaveLength(0);
    expect(db.getJsonNodes()).toHaveLength(0);
    expect(db.getClassDefs()).toHaveLength(0);
    expect(db.getDirection()).toBe('LR');
    expect(db.getAST()).toBeUndefined();
    expect(db.getDiagramTitle?.()).toBe('');
    expect(db.getAccTitle?.()).toBe('');
    expect(db.getAccDescription?.()).toBe('');
    expect(reset.relationshipCounter).toBe(0);
    expect(reset.noteCounter).toBe(0);
    expect(reset.symbols).toHaveLength(0);
    expect(db.getConfig()).toEqual(reset.config);
  });
});
