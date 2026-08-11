import { beforeEach, describe, expect, it } from 'vitest';
import { getAccDescription, getAccTitle } from '../common/commonDb.js';
import { parser } from './parser/usecase.chevrotain.js';
import { db } from './usecaseDb.js';
import { ARROW_TYPE } from './usecaseTypes.js';

const sortedEntries = <T>(entries: ReadonlyMap<string, T>): [string, T][] =>
  [...entries].sort(([left], [right]) => left.localeCompare(right));

const publishedModel = () =>
  structuredClone({
    actors: sortedEntries(db.getActors()),
    useCases: sortedEntries(db.getUseCases()),
    boundaries: sortedEntries(db.getSystemBoundaries()),
    relationships: db.getRelationships(),
    notes: sortedEntries(db.getNotes()),
    jsonNodes: sortedEntries(db.getJsonNodes()),
    classDefs: sortedEntries(db.getClassDefs()),
    direction: db.getDirection(),
  });

const expectEmptyPublication = (): void => {
  expect(db.getActors().size).toBe(0);
  expect(db.getUseCases().size).toBe(0);
  expect(db.getSystemBoundaries().size).toBe(0);
  expect(db.getRelationships()).toEqual([]);
  expect(db.getNotes().size).toBe(0);
  expect(db.getJsonNodes().size).toBe(0);
  expect(db.getClassDefs().size).toBe(0);
  expect(db.getDirection()).toBe('LR');
  expect(db.getAST()).toBeUndefined();
  expect(getAccTitle()).toBe('');
  expect(getAccDescription()).toBe('');
};

const expectRejectedWithoutPublication = async (
  source: string,
  expectedReference: string
): Promise<void> => {
  await expect(parser.parse(source)).rejects.toThrow(expectedReference);
  expectEmptyPublication();
};

const sourceLocation = (source: string, start: number, end: number): string => {
  const lineStart = Math.max(
    source.lastIndexOf('\n', start - 1),
    source.lastIndexOf('\r', start - 1)
  );
  const line = source.slice(0, start).split(/\r\n|\r|\n/).length;
  return `line ${line}, column ${start - lineStart} [${start},${end})`;
};

const occurrenceLocation = (
  source: string,
  text: string,
  occurrence = 1,
  trimStart = 0,
  trimEnd = 0
): string => {
  let start = -1;
  for (let index = 0; index < occurrence; index++) {
    start = source.indexOf(text, start + 1);
  }
  expect(start).toBeGreaterThanOrEqual(0);
  return sourceLocation(source, start + trimStart, start + text.length - trimEnd);
};

const expectExactSemanticError = async (source: string, expectedMessage: string): Promise<void> => {
  let error: unknown;
  try {
    await parser.parse(source);
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toBe(expectedMessage);
  expectEmptyPublication();
};

const expectGrammarErrorAt = async (
  source: string,
  tokenImage: string,
  locationText: string
): Promise<void> => {
  let error: unknown;
  try {
    await parser.parse(source);
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(Error);
  const message = (error as Error).message;
  expect(
    [`but found: '${tokenImage}'`, `but found --> '${tokenImage}' <--`].some((fragment) =>
      message.includes(fragment)
    )
  ).toBe(true);
  expect(message.endsWith(`at ${locationText}`)).toBe(true);
  expectEmptyPublication();
};

describe('usecase parser publication and normalized AST', () => {
  beforeEach(() => db.clear());

  it('accepts the header at EOF and publishes an empty AST', async () => {
    await parser.parse('usecase-beta');

    expect(publishedModel()).toEqual({
      actors: [],
      useCases: [],
      boundaries: [],
      relationships: [],
      notes: [],
      jsonNodes: [],
      classDefs: [],
      direction: 'LR',
    });
    expect(db.getAST()).toEqual({
      version: 1,
      diagramType: 'usecase',
      source: 'usecase-beta',
      header: { keyword: 'usecase', direction: 'LR', span: [0, 12] },
      nodes: {},
      edges: [],
      groups: {},
      classDefs: {},
      statements: [],
    });
  });

  it('publishes accessibility text through common DB and normalized AST transactionally', async () => {
    const source = `usecase-beta
accTitle: Authentication use cases
accDescr {
  First line
  Second line
}
actor User`;
    await parser.parse(source);

    expect(getAccTitle()).toBe('Authentication use cases');
    expect(getAccDescription()).toBe('First line\nSecond line');
    expect(db.getAST()).toMatchObject({
      accTitle: 'Authentication use cases',
      accDescr: 'First line\n  Second line',
      statements: [
        {
          kind: 'accTitle',
          span: [
            source.indexOf('accTitle'),
            source.indexOf('accTitle') + 'accTitle: Authentication use cases'.length,
          ],
        },
        {
          kind: 'accDescr',
          span: [source.indexOf('accDescr'), source.indexOf('}') + 1],
        },
        {
          kind: 'node',
          span: [source.indexOf('actor User'), source.length],
        },
      ],
    });

    await expectRejectedWithoutPublication(
      `usecase-beta
accTitle: Draft title
accDescr: Draft description
note for Missing "invalid"`,
      'Missing'
    );
  });

  it('accepts a final statement without a newline and keeps end-exclusive source spans', async () => {
    const source = 'usecase-beta\nactor User';
    await parser.parse(source);

    expect(db.getActors().get('User')).toMatchObject({ id: 'User', label: 'User' });
    expect(db.getAST()?.source).toBe(source);
    expect(db.getAST()?.statements).toEqual([
      {
        kind: 'node',
        span: [13, 23],
        nodes: [
          {
            id: 'User',
            span: [19, 23],
            idSpan: [19, 23],
            labelSpan: [19, 23],
            defines: true,
          },
        ],
      },
    ]);
  });

  it('isolates success, clear, failure, and a second success across singleton reuse', async () => {
    await parser.parse(`usecase-beta
actor First
First --> Login
note for Login "First note"`);
    expect([...db.getActors().keys()]).toEqual(['First']);
    expect([...db.getUseCases().keys()]).toEqual(['Login']);
    expect(db.getRelationships().map(({ id }) => id)).toEqual(['edge-0']);
    expect([...db.getNotes().keys()]).toEqual(['note-0']);
    expect(db.getAST()).toBeDefined();

    db.clear();
    expectEmptyPublication();

    await expectRejectedWithoutPublication(
      `usecase-beta
actor Draft
Draft --> Pending
note for Missing "invalid"`,
      'Missing'
    );

    await parser.parse(`usecase-beta
actor Second
Second --> Done
note for Done "Second note"`);
    expect([...db.getActors().keys()]).toEqual(['Second']);
    expect([...db.getUseCases().keys()]).toEqual(['Done']);
    expect(db.getRelationships().map(({ id }) => id)).toEqual(['edge-0']);
    expect([...db.getNotes().keys()]).toEqual(['note-0']);
    expect(db.getAST()?.source).toContain('Second');
    expect(db.getAST()?.source).not.toContain('First');
    expect(db.getAST()?.source).not.toContain('Draft');
  });

  it.each([
    {
      refinement: 'actor',
      declaration: 'actor User',
      relation: 'User --> Login',
      expectedActor: 'User',
      expectedUseCase: 'Login',
      expectedShape: 'ellipse',
    },
    {
      refinement: 'rectangular use case',
      declaration: 'Login[Sign in]',
      relation: 'User --> Login',
      expectedActor: undefined,
      expectedUseCase: 'Login',
      expectedShape: 'rect',
    },
  ])(
    'resolves forward $refinement refinement independently of declaration order',
    async (testCase) => {
      await parser.parse(`usecase-beta\n${testCase.declaration}\n${testCase.relation}`);
      const declarationFirst = publishedModel();

      await parser.parse(`usecase-beta\n${testCase.relation}\n${testCase.declaration}`);
      const relationFirst = publishedModel();

      expect(relationFirst).toEqual(declarationFirst);
      expect([...db.getActors().keys()]).toEqual(
        testCase.expectedActor ? [testCase.expectedActor] : []
      );
      expect(db.getUseCases().get(testCase.expectedUseCase)?.shape).toBe(testCase.expectedShape);
    }
  );

  it('finalizes unresolved relation endpoints as ellipse use cases without actor inference', async () => {
    await parser.parse(`usecase-beta
Left --> Right`);

    expect(db.getActors().size).toBe(0);
    expect([...db.getUseCases()]).toEqual([
      [
        'Left',
        {
          id: 'Left',
          label: 'Left',
          labelType: 'text',
          shape: 'ellipse',
          business: false,
          classes: [],
          styles: [],
        },
      ],
      [
        'Right',
        {
          id: 'Right',
          label: 'Right',
          labelType: 'text',
          shape: 'ellipse',
          business: false,
          classes: [],
          styles: [],
        },
      ],
    ]);
  });

  it('merges equivalent repeated declarations, including equivalent parent ownership', async () => {
    await parser.parse(`usecase-beta
systemBoundary Auth
actor User("Person")@{ type: hollow } <<Human>>
actor User("Person")@{ type: hollow } <<Human>>
Login[Sign in] <<Primary>>
Login[Sign in] <<Primary>>
end`);

    expect([...db.getActors().values()]).toEqual([
      {
        id: 'User',
        label: 'Person',
        labelType: 'text',
        type: 'hollow',
        business: false,
        stereotype: 'Human',
        parentId: 'Auth',
        classes: [],
        styles: [],
      },
    ]);
    expect([...db.getUseCases().values()]).toEqual([
      {
        id: 'Login',
        label: 'Sign in',
        labelType: 'text',
        shape: 'rect',
        business: false,
        stereotype: 'Primary',
        parentId: 'Auth',
        classes: [],
        styles: [],
      },
    ]);
    expect(db.getSystemBoundary('Auth')?.members).toEqual(['User', 'Login']);
  });

  it.each([
    ['kind', 'actor Shared\nShared', 'Shared'],
    ['shape', 'Login(Sign in)\nLogin[Sign in]', 'Login'],
    ['label', 'Login(First label)\nLogin(Second label)', 'Login'],
    ['stereotype', 'Login <<Primary>>\nLogin <<Secondary>>', 'Login'],
    ['parent', 'systemBoundary First\nLogin\nend\nsystemBoundary Second\nLogin\nend', 'Login'],
  ])('rejects conflicting %s declarations transactionally', async (_conflict, body, id) => {
    await expectRejectedWithoutPublication(`usecase-beta\n${body}`, id);
  });

  it.each([
    ['generated ID', '"A-B"\n"A B"', 'A_B'],
    ['generated and explicit ID', '"A B"\nA_B(Explicit)', 'A_B'],
    ['global cross-kind ID', 'actor Shared\njson Shared@{}', 'Shared'],
    ['element and explicit edge ID', 'actor link\nA link@--> B', 'link'],
    ['duplicate explicit edge ID', 'A link@--> B\nB link@--> C', 'link'],
  ])('rejects a %s collision in the diagram-global namespace', async (_collision, body, id) => {
    await expectRejectedWithoutPublication(`usecase-beta\n${body}`, id);
  });

  it.each([
    ['note', 'note for Ghost "Missing"'],
    ['class', 'class Ghost important'],
    ['style', 'style Ghost fill:red'],
    ['metadata', 'Ghost@{ type: package }'],
  ])('rejects an unresolved %s target', async (_targetKind, statement) => {
    await expectRejectedWithoutPublication(`usecase-beta\n${statement}`, 'Ghost');
  });

  it('publishes no draft collection or AST when final semantic resolution fails', async () => {
    await parser.parse(`usecase-beta
actor Previous
Previous --> Published`);
    expect(db.getAST()).toBeDefined();

    await expectRejectedWithoutPublication(
      `usecase-beta
direction TB
classDef important fill:red
actor User:::important
Login[Sign in]
User link@--> Login
link@{ animation: fast }
json Payload@{"ok": true}
note for Missing "late failure"`,
      'Missing'
    );
  });

  it('allocates anonymous edge and note IDs deterministically in source order', async () => {
    const source = `usecase-beta
actor User
User --> Login
note for User "first"
Login --> Logout
note for Logout "second"`;

    await parser.parse(source);
    const first = {
      edges: db.getRelationships().map(({ id }) => id),
      notes: [...db.getNotes().keys()],
    };
    expect(first).toEqual({ edges: ['edge-0', 'edge-1'], notes: ['note-0', 'note-1'] });

    await parser.parse(source);
    expect({
      edges: db.getRelationships().map(({ id }) => id),
      notes: [...db.getNotes().keys()],
    }).toEqual(first);
  });

  it('distinguishes generated and explicit IDs and records their exact occurrences', async () => {
    const source = `usecase-beta
"Reset password"
Login("Reset password")`;
    await parser.parse(source);

    expect([...db.getUseCases().keys()]).toEqual(['Reset_password', 'Login']);
    expect(db.getAST()?.nodes).toMatchObject({
      Reset_password: {
        label: 'Reset password',
        shape: 'ellipse',
        attrs: { kind: 'usecase', labelType: 'text' },
      },
      Login: {
        label: 'Reset password',
        shape: 'ellipse',
        attrs: { kind: 'usecase', labelType: 'text' },
      },
    });
    expect(db.getAST()?.statements).toMatchObject([
      {
        nodes: [
          {
            id: 'Reset_password',
            idSpan: [
              source.indexOf('"Reset password"') + 1,
              source.indexOf('"Reset password"') + 15,
            ],
            labelSpan: [
              source.indexOf('"Reset password"') + 1,
              source.indexOf('"Reset password"') + 15,
            ],
          },
        ],
      },
      {
        nodes: [
          {
            id: 'Login',
            idSpan: [source.indexOf('Login'), source.indexOf('Login') + 5],
            labelSpan: [source.lastIndexOf('"Reset password"') + 1, source.length - 2],
          },
        ],
      },
    ]);
  });

  it('names both exact locations for generated and explicit ID collisions', async () => {
    const generated = `usecase-beta
"A-B"
"A B"`;
    await expectExactSemanticError(
      generated,
      `Generated ID 'A_B' collides with another declaration at ${occurrenceLocation(generated, '"A B"', 1, 1, 1)}; previous declaration at ${occurrenceLocation(generated, '"A-B"', 1, 1, 1)}`
    );

    const generatedAndExplicit = `usecase-beta
"A B"
A_B(Explicit)`;
    await expectExactSemanticError(
      generatedAndExplicit,
      `Generated ID 'A_B' collides with another declaration at ${occurrenceLocation(generatedAndExplicit, 'A_B')}; previous declaration at ${occurrenceLocation(generatedAndExplicit, '"A B"', 1, 1, 1)}`
    );

    const explicitEdges = `usecase-beta
A link@--> B
B link@--> C`;
    await expectExactSemanticError(
      explicitEdges,
      `ID 'link' is declared more than once (edge and edge) at ${occurrenceLocation(explicitEdges, 'link', 2)}; previous declaration at ${occurrenceLocation(explicitEdges, 'link')}`
    );
  });

  it('preserves entity codes and literal backslash-n while accepting physical newlines only in Markdown labels', async () => {
    const source = [
      'usecase-beta',
      'classDef decorated fill:#fee',
      'actor User("`**User**',
      'role`") <<Human>>:::decorated',
      'Login("`Sign',
      'in`") <<Primary>>:::decorated',
      'Escaped("Open #40;safe#41; #91;now#93;")',
      'Literal("First\\nSecond")',
    ].join('\n');
    await parser.parse(source);

    expect(db.getActors().get('User')).toMatchObject({
      label: '**User**\nrole',
      labelType: 'markdown',
      stereotype: 'Human',
      classes: ['decorated'],
    });
    expect(db.getUseCases().get('Login')).toMatchObject({
      label: 'Sign\nin',
      labelType: 'markdown',
      stereotype: 'Primary',
      classes: ['decorated'],
    });
    expect(db.getUseCases().get('Escaped')?.label).toBe('Open #40;safe#41; #91;now#93;');
    expect(db.getUseCases().get('Literal')?.label).toBe('First\\nSecond');
    expect(db.getAST()?.nodes).toMatchObject({
      User: {
        label: '**User**\nrole',
        classes: ['decorated'],
        attrs: { labelType: 'markdown', stereotype: 'Human' },
      },
      Login: {
        label: 'Sign\nin',
        classes: ['decorated'],
        attrs: { labelType: 'markdown', stereotype: 'Primary' },
      },
      Escaped: { label: 'Open #40;safe#41; #91;now#93;', attrs: { labelType: 'text' } },
      Literal: { label: 'First\\nSecond', attrs: { labelType: 'text' } },
    });

    await expectRejectedWithoutPublication(
      ['usecase-beta', 'Broken("First', 'Second")'].join('\n'),
      'Error lexing usecase diagram'
    );
  });

  it('reports exact actor metadata and incompatible icon locations', async () => {
    const invalidType = `usecase-beta
actor User@{ type: giant }`;
    await expectExactSemanticError(
      invalidType,
      `Metadata property 'type' is invalid for actor 'User' at ${occurrenceLocation(invalidType, 'type')}`
    );

    const invalidKey = `usecase-beta
actor User@{ fillColor: red }`;
    await expectExactSemanticError(
      invalidKey,
      `Metadata property 'fillColor' is invalid for actor 'User' at ${occurrenceLocation(invalidKey, 'fillColor')}`
    );

    const iconAndAwesome = `usecase-beta
actor User@{ icon: "fa:user", type: awesome }`;
    await expectExactSemanticError(
      iconAndAwesome,
      `Actor 'User' cannot combine icon with type 'awesome' at ${occurrenceLocation(iconAndAwesome, 'User')}`
    );
  });

  it('rejects mixed-kind generalization and actor include at the exact relation span', async () => {
    const generalization = `usecase-beta
actor User
Login
User --|> Login`;
    await expectExactSemanticError(
      generalization,
      `Generalization requires actor-to-actor or use-case-to-use-case endpoints at ${occurrenceLocation(generalization, '--|> Login')}`
    );

    const actorInclude = `usecase-beta
actor User
actor Admin
User ..> : include Admin`;
    await expectExactSemanticError(
      actorInclude,
      `include relationship requires use-case endpoints at ${occurrenceLocation(actorInclude, '..> : include Admin')}`
    );
  });

  it('rejects duplicate and unknown edge class/style targets with exact locations', async () => {
    const duplicate = `usecase-beta
A link@--> B
B link@--> C`;
    await expectExactSemanticError(
      duplicate,
      `ID 'link' is declared more than once (edge and edge) at ${occurrenceLocation(duplicate, 'link', 2)}; previous declaration at ${occurrenceLocation(duplicate, 'link')}`
    );

    const unknownClass = `usecase-beta
A known@--> B
class missingEdge decorated`;
    await expectExactSemanticError(
      unknownClass,
      `Class/style target 'missingEdge' is unresolved or anonymous at ${occurrenceLocation(unknownClass, 'missingEdge')}`
    );

    const unknownStyle = `usecase-beta
A known@--> B
style missingEdge stroke:red`;
    await expectExactSemanticError(
      unknownStyle,
      `Class/style target 'missingEdge' is unresolved or anonymous at ${occurrenceLocation(unknownStyle, 'missingEdge')}`
    );
  });

  it('publishes exact true, fast, slow, and false animation state and rejects invalid values', async () => {
    const source = `usecase-beta
A trueEdge@--> B
trueEdge@{ animate: true }
A fastEdge@--> B
fastEdge@{ animation: fast }
A slowEdge@--> B
slowEdge@{ animation: slow }
A offEdge@--> B
offEdge@{ animate: false }`;
    await parser.parse(source);

    expect(
      db.getRelationships().map(({ id, animate, animation }) => ({ id, animate, animation }))
    ).toEqual([
      { id: 'trueEdge', animate: true, animation: undefined },
      { id: 'fastEdge', animate: true, animation: 'fast' },
      { id: 'slowEdge', animate: true, animation: 'slow' },
      { id: 'offEdge', animate: false, animation: undefined },
    ]);
    expect(
      db.getAST()?.edges.map(({ id, attrs }) => ({
        id,
        animate: attrs?.animate,
        animation: attrs?.animation,
      }))
    ).toEqual([
      { id: 'trueEdge', animate: true, animation: undefined },
      { id: 'fastEdge', animate: true, animation: 'fast' },
      { id: 'slowEdge', animate: true, animation: 'slow' },
      { id: 'offEdge', animate: false, animation: undefined },
    ]);

    const invalidAnimation = `usecase-beta
A link@--> B
link@{ animation: medium }`;
    await expectExactSemanticError(
      invalidAnimation,
      `Metadata property 'animation' is invalid for edge 'link' at ${occurrenceLocation(invalidAnimation, 'animation')}`
    );

    const invalidAnimate = `usecase-beta
A link@--> B
link@{ animate: fast }`;
    await expectExactSemanticError(
      invalidAnimate,
      `Metadata property 'animate' is invalid for edge 'link' at ${occurrenceLocation(invalidAnimate, 'animate')}`
    );
  });

  it.each([
    { kind: 'relation', statement: 'User --> Login', unexpected: '-->', occurrence: 1 },
    { kind: 'note', statement: 'note for User "inside"', unexpected: 'note', occurrence: 1 },
    { kind: 'JSON', statement: 'json Payload@{}', unexpected: 'json Payload@', occurrence: 1 },
    {
      kind: 'nested boundary',
      statement: 'systemBoundary Nested\nend',
      unexpected: 'systemBoundary',
      occurrence: 2,
    },
  ])(
    'locates rejected $kind content inside a boundary',
    async ({ statement, unexpected, occurrence }) => {
      const source = `usecase-beta
systemBoundary Auth
${statement}
end`;
      await expectGrammarErrorAt(
        source,
        unexpected,
        occurrenceLocation(source, unexpected, occurrence)
      );
    }
  );

  it('rejects notes targeting JSON, boundary, and explicit edge IDs with both locations', async () => {
    const json = `usecase-beta
json Payload@{}
note for Payload "invalid"`;
    await expectExactSemanticError(
      json,
      `Note target 'Payload' must be an actor or use case, not json at ${occurrenceLocation(json, 'Payload', 2)}; previous declaration at ${occurrenceLocation(json, 'Payload')}`
    );

    const boundary = `usecase-beta
systemBoundary Auth
Login
end
note for Auth "invalid"`;
    await expectExactSemanticError(
      boundary,
      `Note target 'Auth' must be an actor or use case, not boundary at ${occurrenceLocation(boundary, 'Auth', 2)}; previous declaration at ${occurrenceLocation(boundary, 'Auth')}`
    );

    const edge = `usecase-beta
A link@--> B
note for link "invalid"`;
    await expectExactSemanticError(
      edge,
      `Note target 'link' must be an actor or use case, not edge at ${occurrenceLocation(edge, 'link', 2)}; previous declaration at ${occurrenceLocation(edge, 'link')}`
    );
  });

  it.each([
    ['boundary', 'systemBoundary Auth <<System>>\nLogin\nend'],
    ['note', 'Login\nnote for Login "text" <<Memo>>'],
    ['JSON', 'json Payload@{} <<Data>>'],
    ['edge', 'A link@--> B\nlink@{ animate: true } <<Link>>'],
  ])('locates a stereotype on invalid %s syntax', async (_kind, body) => {
    const source = `usecase-beta
${body}`;
    await expectGrammarErrorAt(source, '<<', occurrenceLocation(source, '<<'));
  });

  it('rejects business icon, awesome, and rectangular declarations at exact locations', async () => {
    const icon = `usecase-beta
actor Icon@{ icon: "fa:user", business: true }`;
    await expectExactSemanticError(
      icon,
      `Business actor 'Icon' must use normal or hollow geometry at ${occurrenceLocation(icon, 'Icon')}`
    );

    const awesome = `usecase-beta
actor Awesome@{ type: awesome, business: true }`;
    await expectExactSemanticError(
      awesome,
      `Business actor 'Awesome' must use normal or hollow geometry at ${occurrenceLocation(awesome, 'Awesome')}`
    );

    const rectangle = `usecase-beta
Report[Generate report]@{ business: true }`;
    await expectExactSemanticError(
      rectangle,
      `Rectangular use case 'Report' cannot be a business use case at ${occurrenceLocation(rectangle, 'Report')}`
    );
  });

  it('rejects JSON in boundaries and JSON semantic or circle relations at exact locations', async () => {
    const boundary = `usecase-beta
systemBoundary Auth
json Payload@{}
end`;
    await expectGrammarErrorAt(
      boundary,
      'json Payload@',
      occurrenceLocation(boundary, 'json Payload@')
    );

    const semantic = `usecase-beta
json Payload@{}
Inspect
Payload ..> : include Inspect`;
    await expectExactSemanticError(
      semantic,
      `include relationship requires use-case endpoints at ${occurrenceLocation(semantic, '..> : include Inspect')}`
    );

    const circle = `usecase-beta
json Payload@{}
Inspect --o Payload`;
    await expectExactSemanticError(
      circle,
      `JSON relationship 'Inspect' to 'Payload' permits only point, reversed-point, or markerless solid association at ${occurrenceLocation(circle, '--o Payload')}`
    );
  });

  it('publishes a complete serializable AST v1 with ordered statements and exact spans', async () => {
    const source = `usecase-beta

%% representative
systemBoundary Auth
actor User@{ type: hollow } <<Human>>
Login[Sign in]
end
Auth@{ type: package }
json Payload@{"ok": true}
Login includeEdge@..> : include Login
includeEdge@{ animation: fast }
note for Login "Remember"`;
    await parser.parse(source);

    const ast = db.getAST();
    expect(ast).toBeDefined();
    expect(ast).toMatchObject({
      version: 1,
      diagramType: 'usecase',
      source,
      header: { keyword: 'usecase', direction: 'LR', span: [0, 12] },
      classDefs: {},
      nodes: {
        User: {
          shape: 'actor-hollow',
          attrs: {
            kind: 'actor',
            actorType: 'hollow',
            business: false,
            stereotype: 'Human',
            labelType: 'text',
            parentId: 'Auth',
          },
        },
        Login: {
          label: 'Sign in',
          shape: 'rect',
          attrs: {
            kind: 'usecase',
            useCaseShape: 'rect',
            business: false,
            labelType: 'text',
            parentId: 'Auth',
          },
        },
        Payload: {
          label: 'Payload',
          shape: 'json-table',
          attrs: {
            kind: 'json',
            value: { ok: true },
            propertyOrder: { '': ['ok'] },
          },
        },
        'note-0': {
          label: 'Remember',
          shape: 'note',
          attrs: { kind: 'note', target: 'Login', labelType: 'text' },
        },
      },
      groups: {
        Auth: {
          nodes: ['User', 'Login'],
          attrs: { kind: 'systemBoundary', boundaryType: 'package', labelType: 'text' },
        },
      },
    });

    expect(ast?.edges[0]).toEqual({
      id: 'includeEdge',
      source: 'Login',
      target: 'Login',
      label: 'include',
      attrs: {
        relationshipType: 'include',
        arrowType: ARROW_TYPE.SOLID_ARROW,
        minlen: 1,
        explicitId: true,
        animate: true,
        animation: 'fast',
        labelType: 'text',
      },
    });
    expect(ast?.edges[1]).toMatchObject({
      source: 'note-0',
      target: 'Login',
      attrs: { relationshipType: 'note', internal: true },
    });

    expect(ast?.statements.map(({ kind, span }) => ({ kind, span }))).toEqual([
      { kind: 'blank', span: [13, 14] },
      { kind: 'comment', span: [14, 31] },
      { kind: 'group', span: [32, 108] },
      { kind: 'metadata', span: [109, 131] },
      { kind: 'json', span: [132, 157] },
      { kind: 'edge', span: [158, 195] },
      { kind: 'edgeMetadata', span: [196, 227] },
      { kind: 'note', span: [228, 253] },
    ]);

    const group = ast?.statements[2];
    expect(group).toMatchObject({
      group: 'Auth',
      idSpan: [47, 51],
      titleSpan: [47, 51],
      endSpan: [105, 108],
    });
    expect(group?.children?.map(({ kind, span }) => ({ kind, span }))).toEqual([
      { kind: 'node', span: [52, 89] },
      { kind: 'node', span: [90, 104] },
    ]);
    expect(group?.children?.[0]).toMatchObject({
      nodes: [
        {
          id: 'User',
          idSpan: [58, 62],
          stereotypeSpan: [82, 87],
          metadata: [{ key: 'type', span: [65, 77], keySpan: [65, 69], valueSpan: [71, 77] }],
        },
      ],
    });
    expect(group?.children?.[1]).toMatchObject({
      nodes: [{ id: 'Login', idSpan: [90, 95], labelSpan: [96, 103] }],
    });
    expect(ast?.statements[3]).toMatchObject({
      nodes: [{ id: 'Auth', idSpan: [109, 113] }],
      metadata: [{ key: 'type', span: [116, 129], keySpan: [116, 120], valueSpan: [122, 129] }],
    });
    expect(ast?.statements[4]).toMatchObject({
      nodes: [{ id: 'Payload', idSpan: [137, 144] }],
    });
    expect(ast?.statements[5]).toMatchObject({
      nodes: [
        { id: 'Login', idSpan: [158, 163] },
        { id: 'Login', idSpan: [190, 195] },
      ],
      edges: [{ id: 'includeEdge', idSpan: [164, 175], labelSpan: [182, 189] }],
    });
    expect(ast?.statements[6]).toMatchObject({
      edges: [{ id: 'includeEdge', idSpan: [196, 207] }],
      metadata: [
        {
          key: 'animation',
          span: [210, 225],
          keySpan: [210, 219],
          valueSpan: [221, 225],
        },
      ],
    });
    expect(ast?.statements[7]).toMatchObject({
      ref: 'note-0',
      refSpan: [244, 252],
      nodes: [{ id: 'Login', idSpan: [237, 242] }],
    });
    expect(JSON.parse(JSON.stringify(ast))).toEqual(ast);
  });
});
