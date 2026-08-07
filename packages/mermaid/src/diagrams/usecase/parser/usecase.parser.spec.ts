import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../usecaseDb.js';
import { ARROW_TYPE } from '../usecaseTypes.js';
import { parser } from './usecase.chevrotain.js';

describe('usecase Chevrotain parser', () => {
  beforeEach(() => db.clear());

  it('populates actors, boundaries, use cases, relationships, and direction', async () => {
    await parser.parse(`usecase
      direction TD
      actor User, "System Administrator"
      systemBoundary "Authentication System"
        Login
        "Reset password":::important
      end
      User --include--> Login
      "System Administrator" --> "Reset password"`);

    expect([...db.getActors().keys()]).toEqual(['User', 'System_Administrator']);
    expect(db.getDirection()).toBe('TB');
    expect(db.getSystemBoundary('Authentication_System')).toEqual({
      id: 'Authentication_System',
      name: 'Authentication_System',
      useCases: ['Login', 'Reset_password'],
    });
    expect(db.getUseCase('Reset_password')).toMatchObject({
      name: 'Reset password',
      classes: ['important'],
      systemBoundary: 'Authentication_System',
    });
    expect(db.getRelationships()).toMatchObject([
      {
        id: 'rel_0',
        from: 'User',
        to: 'Login',
        type: 'include',
        arrowType: ARROW_TYPE.SOLID_ARROW,
        label: 'include',
      },
      {
        id: 'rel_1',
        from: 'System_Administrator',
        to: 'Reset_password',
        type: 'association',
        arrowType: ARROW_TYPE.SOLID_ARROW,
      },
    ]);
  });

  it('supports every relationship operator and quoted labels', async () => {
    await parser.parse(`usecase
      A --> B
      B <-- C
      C -- D
      D --o E
      E o-- F
      F --x G
      G x-- H
      H <-- "extend" -- I`);

    expect(db.getRelationships().map(({ arrowType, label }) => ({ arrowType, label }))).toEqual([
      { arrowType: ARROW_TYPE.SOLID_ARROW, label: undefined },
      { arrowType: ARROW_TYPE.BACK_ARROW, label: undefined },
      { arrowType: ARROW_TYPE.LINE_SOLID, label: undefined },
      { arrowType: ARROW_TYPE.CIRCLE_ARROW, label: undefined },
      { arrowType: ARROW_TYPE.CIRCLE_ARROW_REVERSED, label: undefined },
      { arrowType: ARROW_TYPE.CROSS_ARROW, label: undefined },
      { arrowType: ARROW_TYPE.CROSS_ARROW_REVERSED, label: undefined },
      { arrowType: ARROW_TYPE.BACK_ARROW, label: 'extend' },
    ]);
    expect(db.getRelationships().at(-1)?.type).toBe('extend');
  });

  it('applies metadata, classes, direct styles, and boundary types', async () => {
    await parser.parse(`usecase
      actor User@{ "type": "primary", "icon": "user" }
      systemBoundary Auth
        Login
      end
      Auth@{ type: package }
      classDef important fill:#f96,stroke-width:4px
      class Login important
      style User fill:#fff,opacity:50%`);

    expect(db.getActor('User')).toMatchObject({
      metadata: { type: 'primary', icon: 'user' },
      styles: ['fill', ':', '#fff', 'opacity', ':', '50', '%'],
    });
    expect(db.getSystemBoundary('Auth')?.type).toBe('package');
    expect(db.getUseCase('Login')?.classes).toEqual(['important']);
    expect(db.getClassDef('important')?.styles).toEqual([
      'fill',
      ':',
      '#f96',
      'stroke',
      '-',
      'width',
      ':',
      '4px',
    ]);
  });

  it('stores a serializable normalized AST with end-exclusive source spans', async () => {
    const source = `usecase
direction TD
actor "System Administrator"@{ "icon": "user" }
systemBoundary "Authentication System"
  Login:::important
end
"System Administrator" -- "include" --> Login
classDef important fill:#f96
class Login important
style Login stroke:#333`;

    await parser.parse(source);

    const ast = db.getAST();
    expect(ast).toMatchObject({
      version: 1,
      diagramType: 'usecase',
      source,
      header: { keyword: 'usecase', direction: 'TB', span: [0, 7] },
      nodes: {
        System_Administrator: {
          label: 'System Administrator',
          shape: 'actor-icon',
          attrs: { kind: 'actor', metadata: { icon: 'user' } },
        },
        Login: {
          shape: 'ellipse',
          classes: ['important'],
          styles: ['stroke', ':', '#333'],
          attrs: { kind: 'usecase' },
        },
      },
      edges: [
        {
          id: 'rel_0',
          source: 'System_Administrator',
          target: 'Login',
          label: 'include',
          attrs: {
            relationshipType: 'include',
            arrowType: ARROW_TYPE.SOLID_ARROW,
          },
        },
      ],
      groups: {
        Authentication_System: {
          title: 'Authentication System',
          nodes: ['Login'],
          attrs: { type: 'rect' },
        },
      },
      classDefs: {
        important: { styles: ['fill', ':', '#f96'] },
      },
    });
    expect(ast?.statements.map(({ kind }) => kind)).toEqual([
      'direction',
      'node',
      'group',
      'edge',
      'classDef',
      'classAssign',
      'style',
    ]);

    const actorStatement = ast?.statements[1];
    const groupStatement = ast?.statements[2];
    const edgeStatement = ast?.statements[3];
    expect(source.slice(...actorStatement!.span)).toBe(
      'actor "System Administrator"@{ "icon": "user" }'
    );
    expect(source.slice(...actorStatement!.nodes![0].idSpan)).toBe('System Administrator');
    expect(source.slice(...groupStatement!.span)).toBe(
      'systemBoundary "Authentication System"\n  Login:::important\nend'
    );
    expect(source.slice(...groupStatement!.titleSpan!)).toBe('Authentication System');
    expect(source.slice(...groupStatement!.endSpan!)).toBe('end');
    expect(source.slice(...groupStatement!.children![0].nodes![0].idSpan)).toBe('Login');
    expect(source.slice(...edgeStatement!.edges![0].labelSpan!)).toBe('include');
    expect(JSON.parse(JSON.stringify(ast))).toEqual(ast);
  });

  it('captures explicit labels separately from every node id occurrence', async () => {
    const source = `usecase
Checkout(Complete checkout)
Checkout --> Done`;

    await parser.parse(source);

    const ast = db.getAST()!;
    expect(ast.nodes.Checkout).toMatchObject({
      label: 'Complete checkout',
      attrs: { kind: 'usecase' },
    });
    const definition = ast.statements[0].nodes![0];
    const reference = ast.statements[1].nodes![0];
    expect(source.slice(...definition.idSpan)).toBe('Checkout');
    expect(source.slice(...definition.labelSpan!)).toBe('Complete checkout');
    expect(source.slice(...reference.idSpan)).toBe('Checkout');
    expect(reference.labelSpan).toBeUndefined();
  });

  it('rejects malformed input and leaves the database empty', async () => {
    db.addActor({ id: 'stale', name: 'stale' });

    await expect(parser.parse('usecase\nactor')).rejects.toThrow('Error parsing usecase diagram');
    expect(db.getActors()).toHaveLength(0);
    expect(db.getAST()).toBeUndefined();
  });
});
