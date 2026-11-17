/* cspell:ignore accdescr */

/**
 * The 37 shared probes of the c4-beta syntax and the verdict each one gets. An accepted probe
 * also states the model it builds: element ids in statement order, the ids that are boundaries,
 * and each relation as `from>to` (a `<--` is stored from its right-hand end).
 */

/** The kinds of dropped input a probe may warn about. */
export type WarningKind = 'technology' | 'instances' | 'step' | 'style';

export interface Accepted {
  verdict: 'accept';
  elements: string[];
  boundaries: string[];
  relations: string[];
  warnings?: WarningKind[];
}

export interface Rejected {
  verdict: 'reject';
}

export type Expected = Accepted | Rejected;

const reject: Rejected = { verdict: 'reject' };

export const EXPECTED: Record<string, Expected> = {
  'b01-header-only': { verdict: 'accept', elements: [], boundaries: [], relations: [] },
  'b02-basic-context': {
    verdict: 'accept',
    elements: ['clerk', 'ledger'],
    boundaries: [],
    relations: ['clerk>ledger'],
  },
  'b03-kind-keywords-as-ids': {
    verdict: 'accept',
    elements: ['softwareSystem', 'container'],
    boundaries: [],
    relations: ['container>softwareSystem'],
  },
  'b04-nesting-deployment': {
    verdict: 'accept',
    elements: ['dc', 'lb', 'web', 'app'],
    boundaries: ['dc', 'web'],
    relations: ['lb>app'],
  },
  'b05-empty-braces-and-group': {
    verdict: 'accept',
    elements: ['s', 'g', 'c'],
    boundaries: ['g'],
    relations: ['c>s'],
  },
  'b06-four-arrows': {
    verdict: 'accept',
    elements: ['a', 'b', 'c', 'd'],
    boundaries: [],
    relations: ['a>b', 'c>a', 'b>d', 'c>d'],
  },
  'b07-dynamic-steps': {
    verdict: 'accept',
    elements: ['spa', 'api', 'db'],
    boundaries: [],
    relations: ['spa>api', 'api>db', 'api>db', 'db>api'],
  },
  'b08-style-values': {
    verdict: 'accept',
    elements: ['api', 'db'],
    boundaries: [],
    relations: ['api>db'],
    warnings: ['style'],
  },
  'b09-multi-tags-external-boundary': {
    verdict: 'accept',
    elements: ['bank', 'core', 'p'],
    boundaries: ['bank'],
    relations: ['p>core'],
  },
  'b10-direction-legend-acc': {
    verdict: 'accept',
    elements: ['p', 'g'],
    boundaries: [],
    relations: ['p>g'],
  },
  'b11-quotes': { verdict: 'accept', elements: ['a', 'b'], boundaries: [], relations: ['a>b'] },
  'b12-comments-blank': {
    verdict: 'accept',
    elements: ['p', 'g'],
    boundaries: [],
    relations: ['p>g'],
  },
  'b13-unknown-header-kind': reject,
  'b14-relation-inside-body': reject,
  'b15-children-one-line': reject,
  'b16-arrow-without-spaces': {
    verdict: 'accept',
    elements: ['a', 'b'],
    boundaries: [],
    relations: ['a>b', 'a>b'],
  },
  'b17-digit-leading-id': {
    verdict: 'accept',
    elements: ['3ds', 'api'],
    boundaries: [],
    relations: ['api>3ds'],
  },
  'b18-keyword-ids': reject,
  'b19-unknown-end': reject,
  'b20-duplicate-id': reject,
  'b21-tech-on-person': {
    verdict: 'accept',
    elements: ['p', 's', 'c'],
    boundaries: [],
    relations: ['p>s'],
    warnings: ['technology', 'instances'],
  },
  'b22-relation-without-colon': reject,
  'b23-element-without-name': reject,
  'b24-instances-unquoted': reject,
  'b25-step-outside-dynamic': {
    verdict: 'accept',
    elements: ['a', 'b'],
    boundaries: [],
    relations: ['a>b'],
    warnings: ['step'],
  },
  'b26-nested-same-id': reject,
  'b27-boundary-to-boundary': {
    verdict: 'accept',
    elements: ['s1', 'a', 's2', 'b'],
    boundaries: ['s1', 's2'],
    relations: ['s1>s2'],
  },
  'b28-direction-in-body': reject,
  'b29-title-as-id': reject,
  'b30-label-with-html': { verdict: 'accept', elements: ['a'], boundaries: [], relations: [] },
  'b31-system-alias': reject,
  'b32-rel-before-elements': {
    verdict: 'accept',
    elements: ['a', 'b'],
    boundaries: [],
    relations: ['a>b'],
  },
  'b33-brace-next-line': reject,
  'b34-accdescr-block': { verdict: 'accept', elements: ['a'], boundaries: [], relations: [] },
  'b35-instances-after-tags': reject,
  'b36-tags-before-name': reject,
  'b37-relationship-tags-and-tech-only': {
    verdict: 'accept',
    elements: ['a', 'b'],
    boundaries: [],
    relations: ['a>b', 'a>b'],
  },
};
