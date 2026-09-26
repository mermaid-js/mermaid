// cspell:words codastre yapf
/** Experimental, versioned annotations for ordinary Mermaid flowcharts. */
export interface ThreatModel {
  version: 1;
  id: string;
  title?: string;
  state: 'draft' | 'actual' | 'stale' | 'absent';
  identification?: {
    codastreProject?: string;
    codastreService?: string;
    yapfTicket?: string;
    securityReviewTicket?: string;
    owners?: string[];
  };
  context?: { id: string; description: string; source?: string }[];
  dependencies?: { model: string; description: string }[];
  assumptions?: string[];
  notes?: string[];
  assets?: { id: string; description: string; classification?: string }[];
  actors?: { id: string; description: string; intent?: string; access?: string }[];
  elements: {
    id: string;
    kind: 'process' | 'store' | 'actor' | 'flow' | 'boundary';
    description?: string;
    assets?: string[];
    actor?: string;
    entryPoint?: boolean;
  }[];
  threats: Threat[];
  changelog?: { date: string; author: string; description: string }[];
}

export interface Threat {
  id: string;
  title: string;
  description: string;
  targets: string[];
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'candidate' | 'open' | 'mitigated' | 'accepted' | 'transferred' | 'excluded';
  category?:
    | 'spoofing'
    | 'tampering'
    | 'repudiation'
    | 'information-disclosure'
    | 'denial-of-service'
    | 'elevation-of-privilege';
  framework?: string;
  score?: { value: number; method: string; rationale: string };
  actors?: string[];
  decision?: string;
  mitigation?: string;
  tickets?: string[];
  evidence?: string[];
  context?: string[];
}

// A small strict validator avoids adding a runtime schema-library dependency.
// Unknown keys are errors: a misspelled security decision must not silently vanish.
type Rule = (value: unknown, path: string) => void;
const fail = (path: string, message: string): never => {
  throw new Error(`Threat model ${path}: ${message}`);
};
const text: Rule = (v, p) => {
  if (typeof v !== 'string' || !v.trim() || v.length > 10000) {
    fail(p, 'expected non-empty text (at most 10000 characters)');
  }
};
const identifier: Rule = (v, p) => {
  if (typeof v !== 'string' || !/^[A-Z_a-z][\w-]*$/.test(v)) {
    fail(p, 'expected an identifier: letters, digits, underscores, hyphens');
  }
};
const choice =
  (...values: unknown[]): Rule =>
  (v, p) => {
    if (!values.includes(v)) {
      fail(p, `expected one of ${values.join(', ')}`);
    }
  };
const list =
  (rule: Rule): Rule =>
  (v, p) => {
    if (!Array.isArray(v) || v.length > 1000) {
      fail(p, 'expected an array (at most 1000 entries)');
    }
    (v as unknown[]).forEach((item, i) => rule(item, `${p}[${i}]`));
  };
const object =
  (required: Record<string, Rule>, optional: Record<string, Rule> = {}): Rule =>
  (v, p) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) {
      fail(p, 'expected an object');
    }
    const record = v as Record<string, unknown>;
    const fields = { ...required, ...optional };
    for (const key of Object.keys(record)) {
      if (!Object.hasOwn(fields, key)) {
        fail(`${p}.${key}`, 'unknown field');
      }
      fields[key](record[key], `${p}.${key}`);
    }
    for (const key of Object.keys(required)) {
      if (!Object.hasOwn(record, key)) {
        fail(`${p}.${key}`, 'required field');
      }
    }
  };
const texts = list(text);
const ids = list(identifier);
const schema = object(
  {
    version: choice(1),
    id: identifier,
    state: choice('draft', 'actual', 'stale', 'absent'),
    elements: list(
      object(
        { id: identifier, kind: choice('process', 'store', 'actor', 'flow', 'boundary') },
        { description: text, assets: ids, actor: identifier, entryPoint: choice(true, false) }
      )
    ),
    threats: list(
      object(
        {
          id: identifier,
          title: text,
          description: text,
          targets: ids,
          severity: choice('critical', 'high', 'medium', 'low', 'info'),
          status: choice('candidate', 'open', 'mitigated', 'accepted', 'transferred', 'excluded'),
        },
        {
          category: choice(
            'spoofing',
            'tampering',
            'repudiation',
            'information-disclosure',
            'denial-of-service',
            'elevation-of-privilege'
          ),
          framework: text,
          score: object({
            value: (v, p) => {
              if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
                fail(p, 'expected a finite non-negative number');
              }
            },
            method: text,
            rationale: text,
          }),
          actors: ids,
          decision: text,
          mitigation: text,
          tickets: texts,
          evidence: texts,
          context: ids,
        }
      )
    ),
  },
  {
    title: text,
    identification: object(
      {},
      {
        codastreProject: text,
        codastreService: text,
        yapfTicket: text,
        securityReviewTicket: text,
        owners: texts,
      }
    ),
    context: list(object({ id: identifier, description: text }, { source: text })),
    dependencies: list(object({ model: text, description: text })),
    assumptions: texts,
    notes: texts,
    assets: list(object({ id: identifier, description: text }, { classification: text })),
    actors: list(object({ id: identifier, description: text }, { intent: text, access: text })),
    changelog: list(object({ date: text, author: text, description: text })),
  }
);

export function parseThreatModel(value: unknown): ThreatModel {
  schema(value, '');
  const model = value as ThreatModel;
  const index = (items: { id: string }[], path: string) => {
    const found = new Set<string>();
    for (const item of items) {
      if (found.has(item.id)) {
        fail(path, `duplicate id ${item.id}`);
      }
      found.add(item.id);
    }
    return found;
  };
  const elements = index(model.elements, 'elements');
  const actors = index(model.actors ?? [], 'actors');
  const assets = index(model.assets ?? [], 'assets');
  const context = index(model.context ?? [], 'context');
  index(model.threats, 'threats');
  const refs = (values: string[], known: Set<string>, path: string) => {
    for (const value of values) {
      if (!known.has(value)) {
        fail(path, `unknown reference ${value}`);
      }
    }
  };
  for (const element of model.elements) {
    refs(element.assets ?? [], assets, `elements.${element.id}.assets`);
    refs(element.actor ? [element.actor] : [], actors, `elements.${element.id}.actor`);
  }
  for (const threat of model.threats) {
    if (!threat.targets.length) {
      fail(threat.id, 'at least one target is required');
    }
    refs(threat.targets, elements, `${threat.id}.targets`);
    refs(threat.actors ?? [], actors, `${threat.id}.actors`);
    refs(threat.context ?? [], context, `${threat.id}.context`);
    if (threat.status === 'mitigated' && (!threat.mitigation || !threat.evidence?.length)) {
      fail(threat.id, 'mitigated threats require a mitigation and evidence');
    }
    if (['accepted', 'transferred', 'excluded'].includes(threat.status) && !threat.decision) {
      fail(threat.id, 'this status requires a decision rationale');
    }
    if (threat.status === 'accepted' && ['high', 'critical'].includes(threat.severity)) {
      fail(threat.id, 'high/critical threats cannot be accepted without mitigation');
    }
  }
  return model;
}

/** Advisory only: Mermaid does not enforce deployment policy or verify evidence. */
export function deploymentBlockers(model: ThreatModel): string[] {
  const blockers = model.state === 'actual' ? [] : [`Model is ${model.state}`];
  for (const threat of model.threats) {
    if (
      ['high', 'critical'].includes(threat.severity) &&
      !['mitigated', 'excluded'].includes(threat.status)
    ) {
      blockers.push(`${threat.id}: ${threat.severity} / ${threat.status}`);
    }
  }
  return blockers;
}
