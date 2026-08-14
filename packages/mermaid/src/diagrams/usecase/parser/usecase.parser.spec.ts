import { describe, expect, it } from 'vitest';
import { usecaseLexer } from './usecase.lexer.js';
import { usecaseParser } from './usecase.parser.js';

function parseGrammar(source: string) {
  const lexResult = usecaseLexer.tokenize(source);
  usecaseParser.input = lexResult.tokens;
  const cst = usecaseParser.start();
  return { cst, lexErrors: lexResult.errors, parseErrors: usecaseParser.errors };
}

function expectAccepted(source: string): void {
  const result = parseGrammar(source);
  expect(result.lexErrors, source).toEqual([]);
  expect(result.parseErrors, source).toEqual([]);
  expect(result.cst.name).toBe('start');
}

function expectRejected(source: string): void {
  const result = parseGrammar(source);
  expect(result.lexErrors.length + result.parseErrors.length, source).toBeGreaterThan(0);
}

describe('usecase canonical line-oriented grammar', () => {
  it.each([
    ['header at EOF', 'usecase-beta'],
    ['line feed', 'usecase-beta\nactor User'],
    ['carriage return and line feed', 'usecase-beta\r\nactor User\r\n'],
    ['carriage return', 'usecase-beta\ractor User\r'],
    ['blank and comment lines', 'usecase-beta\n\n  %% retained\nLogin'],
  ])('accepts %s', (_name, source) => {
    expectAccepted(source);
  });

  it('defines the stable canonical CST rule names', () => {
    const names = usecaseParser
      .getSerializedGastProductions()
      .flatMap((production) =>
        'name' in production && typeof production.name === 'string' ? [production.name] : []
      );
    expect(names).toEqual(
      expect.arrayContaining([
        'start',
        'line',
        'statement',
        'lineEnd',
        'blankLine',
        'commentLine',
        'actorStatement',
        'actorItem',
        'actorName',
        'accTitleStatement',
        'accDescrStatement',
        'actorDeclarationOnly',
        'entityStatement',
        'entityName',
        'nodeLabel',
        'useCaseMetadata',
        'relationTail',
        'arrow',
        'edgeLabel',
        'semanticRelation',
        'metadata',
        'metadataProperty',
        'metadataSeparator',
        'systemBoundaryStatement',
        'systemBoundaryName',
        'systemBoundaryContent',
        'boundaryElement',
        'metadataAssignmentStatement',
        'metadataAssignmentTarget',
        'noteStatement',
        'stereotype',
        'classSuffix',
        'jsonStatement',
        'directionStatement',
        'classDefStatement',
        'classStatement',
        'styleStatement',
        'styles',
        'styleValue',
      ])
    );
  });

  it('accepts canonical actors, use cases, metadata, stereotypes, and class suffixes', () => {
    expectAccepted(`usecase-beta
actor Admin("Main Administrator")@{ type: hollow, business: true } <<Human>>:::external
actor "System Administrator", "\`**Automation**\`"
Login(Sign in)@{ business: false } <<Primary>>:::critical
Report[Generate report]
"Reset password"
"\`**Markdown** use case\`"`);
  });

  it('accepts multiline metadata with newline and comma separators and a trailing comma', () => {
    expectAccepted(`usecase-beta
User@{
  business: true
  type: normal,
}`);
  });

  it.each([
    'A --> B',
    'A <-- B',
    'A -- B',
    'A --o B',
    'A o-- B',
    'A --x B',
    'A x-- B',
    'A -- "starts session" --> B',
    'A <-- "reverse label" -- B',
    'A -- label -- B',
    'A -- label --o B',
    'A o-- label -- B',
    'A -- label --x B',
    'A x-- label -- B',
    'A ..> : include B',
    'A ..> : INCLUDE B',
    'A ..> : ExTeNd B',
    'A --|> B',
    'A ---> B',
    'A <---- B',
    'A ---- B',
    'A -- longer ----> B',
    'A login@--> B',
    'A dependency@..> : include B',
  ])('accepts canonical relation %s', (relation) => {
    expectAccepted(`usecase-beta\n${relation}`);
  });

  it('accepts restricted system-boundary declarations, blanks, and comments', () => {
    expectAccepted(`usecase-beta
systemBoundary "Authentication System":::system
  %% boundary comment
  actor User, Admin("Administrator")

  Login("Sign in"):::critical
  Report[Generate report]
end
User --> Login`);
  });

  it('accepts explicit boundary ids with labels, inline metadata, and class suffixes', () => {
    expectAccepted(`usecase-beta
systemBoundary sb1["Payment service"]@{ type: package }:::system
  Authorize("Authorize payment")
end
systemBoundary sb2(Billing)@{
  type: rect
}:::billing
  Invoice[Create invoice]
end
systemBoundary sb3("\`**Support**\`")
  Refund[Issue refund]
end`);
  });

  it('accepts metadata assignments, notes, JSON, direction, classes, and styles', () => {
    expectAccepted(`usecase-beta
direction LR
Auth@{ type: package }
note for Login "\`Requires an **active session**\`"
json Payload@{
  "fruit": "Apple",
  "nested": { "brace": "}", "items": [1, 2] }
}:::data
classDef external,critical fill:#fff,stroke-width:3px
class Login,Payload external,critical
style Login fill:#fee,stroke-dasharray:5\\,5`);
  });

  it('accepts single-line and multiline accessibility statements', () => {
    expectAccepted(`usecase-beta
accTitle: Authentication use cases
accDescr: Actors and authentication flows`);
    expectAccepted(`usecase-beta
accDescr {
  Actors authenticate,
  reset credentials, and sign out.
}`);
  });

  it.each([
    ['uppercase header', 'Usecase\nA'],
    ['same-line statements', 'usecase-beta\nactor A actor B'],
    ['header statement on same line', 'usecase actor A'],
    ['ambiguous actor list relation', 'usecase-beta\nactor A, B --> C'],
    ['unknown directive', 'usecase-beta\nunknown command'],
    ['slash comment lookalike', 'usecase-beta\n// not a comment'],
    ['hash comment lookalike', 'usecase-beta\n# not a comment'],
    ['semicolon separator', 'usecase-beta\nA; B'],
    ['colon actor', 'usecase-beta\n:User:'],
    ['actor alias', 'usecase-beta\nactor User as U'],
    ['use-case alias', 'usecase-beta\nusecase "Login" as Login'],
    ['G16 newpage', 'usecase-beta\nnewpage'],
    ['PlantUML package', 'usecase-beta\npackage "Auth" {'],
    ['PlantUML rectangle', 'usecase-beta\nrectangle "Auth" {'],
    ['PlantUML skinparam', 'usecase-beta\nskinparam actorStyle awesome'],
    ['PlantUML allowmixing', 'usecase-beta\nallowmixing'],
    ['plain separator', 'usecase-beta\n== Section =='],
    ['literal backslash n separator', 'usecase-beta\nA \\n B'],
    ['relation direction hint', 'usecase-beta\nA -left-> B'],
    ['note placement', 'usecase-beta\nnote left of Login "text"'],
    ['note alias', 'usecase-beta\nnote for Login as N "text"'],
    ['multi-target note', 'usecase-beta\nnote for Login,Report "text"'],
    ['nested boundary', 'usecase-beta\nsystemBoundary A\nsystemBoundary B\nend\nend'],
    ['relation in boundary', 'usecase-beta\nsystemBoundary A\nUser --> Login\nend'],
    ['note in boundary', 'usecase-beta\nsystemBoundary A\nnote for User "text"\nend'],
    ['JSON in boundary', 'usecase-beta\nsystemBoundary A\njson Payload@{}\nend'],
    ['extra circle dash', 'usecase-beta\nA ---o B'],
    ['extra reversed circle dash', 'usecase-beta\nA o--- B'],
    ['extra cross dash', 'usecase-beta\nA ---x B'],
    ['extra generalization dash', 'usecase-beta\nA ---|> B'],
    ['extra include dot', 'usecase-beta\nA ...> : include B'],
    ['empty stereotype', 'usecase-beta\nA <<>>'],
    ['multiline stereotype', 'usecase-beta\nA <<first\nsecond>>'],
    ['unclosed stereotype', 'usecase-beta\nA <<primary'],
    ['unclosed JSON', 'usecase-beta\njson Payload@{"nested": {'],
    ['unclosed Markdown', 'usecase-beta\nA("`unfinished")'],
    ['semicolon CSS', 'usecase-beta\nstyle A fill:red;stroke:blue'],
    [
      'boundary class suffix before inline metadata',
      'usecase-beta\nsystemBoundary A:::system@{ type: package }\nend',
    ],
    ['boundary stereotype before inline metadata', 'usecase-beta\nsystemBoundary A <<S>>\nend'],
    ['boundary label without an id', 'usecase-beta\nsystemBoundary [Payment service]\nend'],
  ])('rejects %s', (_name, source) => {
    expectRejected(source);
  });
});
