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
    ['header at EOF', 'usecase'],
    ['line feed', 'usecase\nactor User'],
    ['carriage return and line feed', 'usecase\r\nactor User\r\n'],
    ['carriage return', 'usecase\ractor User\r'],
    ['blank and comment lines', 'usecase\n\n  %% retained\nLogin'],
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
    expectAccepted(`usecase
actor Admin("Main Administrator")@{ type: hollow, business: true } <<Human>>:::external
actor "System Administrator", "\`**Automation**\`"
Login(Sign in)@{ business: false } <<Primary>>:::critical
Report[Generate report]
"Reset password"
"\`**Markdown** use case\`"`);
  });

  it('accepts multiline metadata with newline and comma separators and a trailing comma', () => {
    expectAccepted(`usecase
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
    expectAccepted(`usecase\n${relation}`);
  });

  it('accepts restricted system-boundary declarations, blanks, and comments', () => {
    expectAccepted(`usecase
systemBoundary "Authentication System":::system
  %% boundary comment
  actor User, Admin("Administrator")

  Login("Sign in"):::critical
  Report[Generate report]
end
User --> Login`);
  });

  it('accepts metadata assignments, notes, JSON, direction, classes, and styles', () => {
    expectAccepted(`usecase
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
    expectAccepted(`usecase
accTitle: Authentication use cases
accDescr: Actors and authentication flows`);
    expectAccepted(`usecase
accDescr {
  Actors authenticate,
  reset credentials, and sign out.
}`);
  });

  it.each([
    ['uppercase header', 'Usecase\nA'],
    ['same-line statements', 'usecase\nactor A actor B'],
    ['header statement on same line', 'usecase actor A'],
    ['ambiguous actor list relation', 'usecase\nactor A, B --> C'],
    ['unknown directive', 'usecase\nunknown command'],
    ['slash comment lookalike', 'usecase\n// not a comment'],
    ['hash comment lookalike', 'usecase\n# not a comment'],
    ['semicolon separator', 'usecase\nA; B'],
    ['colon actor', 'usecase\n:User:'],
    ['actor alias', 'usecase\nactor User as U'],
    ['use-case alias', 'usecase\nusecase "Login" as Login'],
    ['G16 newpage', 'usecase\nnewpage'],
    ['PlantUML package', 'usecase\npackage "Auth" {'],
    ['PlantUML rectangle', 'usecase\nrectangle "Auth" {'],
    ['PlantUML skinparam', 'usecase\nskinparam actorStyle awesome'],
    ['PlantUML allowmixing', 'usecase\nallowmixing'],
    ['plain separator', 'usecase\n== Section =='],
    ['literal backslash n separator', 'usecase\nA \\n B'],
    ['relation direction hint', 'usecase\nA -left-> B'],
    ['note placement', 'usecase\nnote left of Login "text"'],
    ['note alias', 'usecase\nnote for Login as N "text"'],
    ['multi-target note', 'usecase\nnote for Login,Report "text"'],
    ['nested boundary', 'usecase\nsystemBoundary A\nsystemBoundary B\nend\nend'],
    ['relation in boundary', 'usecase\nsystemBoundary A\nUser --> Login\nend'],
    ['note in boundary', 'usecase\nsystemBoundary A\nnote for User "text"\nend'],
    ['JSON in boundary', 'usecase\nsystemBoundary A\njson Payload@{}\nend'],
    ['extra circle dash', 'usecase\nA ---o B'],
    ['extra reversed circle dash', 'usecase\nA o--- B'],
    ['extra cross dash', 'usecase\nA ---x B'],
    ['extra generalization dash', 'usecase\nA ---|> B'],
    ['extra include dot', 'usecase\nA ...> : include B'],
    ['empty stereotype', 'usecase\nA <<>>'],
    ['multiline stereotype', 'usecase\nA <<first\nsecond>>'],
    ['semicolon CSS', 'usecase\nstyle A fill:red;stroke:blue'],
  ])('rejects %s', (_name, source) => {
    expectRejected(source);
  });
});
