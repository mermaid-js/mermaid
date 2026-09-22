import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from './cynefinParser.js';
import { db } from './cynefinDb.js';

describe('Cynefin Parsing - Basic', () => {
  beforeEach(() => db.clear());

  it('should parse basic cynefin diagram with domains', async () => {
    await parser.parse(`cynefin-beta
  complex
    "Emergent practice"
    "Probe-sense-respond"
  clear
    "Best practice"
`);
    const domains = db.getDomains();
    expect(domains.size).toBe(2);
    expect(domains.get('complex')!.items[0].label).toBe('Emergent practice');
    expect(domains.get('complex')!.items[1].label).toBe('Probe-sense-respond');
    expect(domains.get('clear')!.items[0].label).toBe('Best practice');
  });

  it('should parse all five domains', async () => {
    await parser.parse(`cynefin-beta
  complex
    "A"
  complicated
    "B"
  clear
    "C"
  chaotic
    "D"
  confusion
    "E"
`);
    const domains = db.getDomains();
    expect(domains.size).toBe(5);
    expect(domains.has('complex')).toBe(true);
    expect(domains.has('complicated')).toBe(true);
    expect(domains.has('clear')).toBe(true);
    expect(domains.has('chaotic')).toBe(true);
    expect(domains.has('confusion')).toBe(true);
  });

  it('should parse empty domains', async () => {
    await parser.parse(`cynefin-beta
  complex
`);
    const domains = db.getDomains();
    expect(domains.has('complex')).toBe(true);
    expect(domains.get('complex')!.items).toHaveLength(0);
  });

  it('should parse domain with multiple items', async () => {
    await parser.parse(`cynefin-beta
  complex
    "First item"
    "Second item"
    "Third item"
`);
    const items = db.getDomains().get('complex')!.items;
    expect(items).toHaveLength(3);
    expect(items[0].label).toBe('First item');
    expect(items[1].label).toBe('Second item');
    expect(items[2].label).toBe('Third item');
  });

  it('should parse comments', async () => {
    await parser.parse(`cynefin-beta
  %% This is a comment
  complex
    "Item"
  %% Another comment
`);
    const domains = db.getDomains();
    expect(domains.size).toBe(1);
    expect(domains.get('complex')!.items[0].label).toBe('Item');
  });
});

describe('Cynefin Parsing - Transitions', () => {
  beforeEach(() => db.clear());

  it('should parse transition between domains', async () => {
    await parser.parse(`cynefin-beta
  complex
    "Practice"
  complicated
    "Analysis"
  complex --> complicated : "Pattern found"
`);
    const transitions = db.getTransitions();
    expect(transitions).toHaveLength(1);
    expect(transitions[0].from).toBe('complex');
    expect(transitions[0].to).toBe('complicated');
    expect(transitions[0].label).toBe('Pattern found');
  });

  it('should parse transition without label', async () => {
    await parser.parse(`cynefin-beta
  complex
    "A"
  complicated
    "B"
  complex --> complicated
`);
    const transitions = db.getTransitions();
    expect(transitions).toHaveLength(1);
    expect(transitions[0].from).toBe('complex');
    expect(transitions[0].to).toBe('complicated');
    expect(transitions[0].label).toBeUndefined();
  });

  it('should parse multiple transitions', async () => {
    await parser.parse(`cynefin-beta
  complex
    "A"
  complicated
    "B"
  clear
    "C"
  complex --> complicated : "Analyzed"
  complicated --> clear : "Codified"
  chaotic --> complex : "Stabilized"
`);
    const transitions = db.getTransitions();
    expect(transitions).toHaveLength(3);
    expect(transitions[0].from).toBe('complex');
    expect(transitions[1].from).toBe('complicated');
    expect(transitions[2].from).toBe('chaotic');
  });
});

describe('Cynefin Parsing - Accessibility', () => {
  beforeEach(() => db.clear());

  it('should parse accTitle', async () => {
    await parser.parse(`cynefin-beta
  accTitle: Cynefin Framework Overview
  complex
    "Emergent"
`);
    expect(db.getAccTitle()).toBe('Cynefin Framework Overview');
  });

  it('should parse accDescr', async () => {
    await parser.parse(`cynefin-beta
  accDescr: A diagram showing the five Cynefin domains
  complex
    "Emergent"
`);
    expect(db.getAccDescription()).toBe('A diagram showing the five Cynefin domains');
  });

  it('should parse title', async () => {
    await parser.parse(`cynefin-beta
  title My Cynefin Map
  complex
    "Emergent"
`);
    expect(db.getDiagramTitle()).toBe('My Cynefin Map');
  });
});

describe('Cynefin Parsing - Complex diagram', () => {
  beforeEach(() => db.clear());

  it('should parse a full diagram with all features', async () => {
    await parser.parse(`cynefin-beta
  title Team Practices
  accTitle: Cynefin for team practices
  complex
    "Retrospectives"
    "Pair programming"
  complicated
    "Code review"
    "Architecture decisions"
  clear
    "Deployment checklist"
  chaotic
    "Incident response"
  confusion
    "New initiative"
  complex --> complicated : "Pattern emerges"
  complicated --> clear : "Best practice found"
  chaotic --> complex : "Stabilized"
  confusion --> chaotic : "Crisis detected"
`);
    expect(db.getDiagramTitle()).toBe('Team Practices');
    expect(db.getAccTitle()).toBe('Cynefin for team practices');

    const domains = db.getDomains();
    expect(domains.size).toBe(5);
    expect(domains.get('complex')!.items).toHaveLength(2);
    expect(domains.get('complicated')!.items).toHaveLength(2);
    expect(domains.get('clear')!.items).toHaveLength(1);
    expect(domains.get('chaotic')!.items).toHaveLength(1);
    expect(domains.get('confusion')!.items).toHaveLength(1);

    const transitions = db.getTransitions();
    expect(transitions).toHaveLength(4);
    expect(transitions[0]).toMatchObject({
      from: 'complex',
      to: 'complicated',
      label: 'Pattern emerges',
    });
    expect(transitions[3]).toMatchObject({
      from: 'confusion',
      to: 'chaotic',
      label: 'Crisis detected',
    });
  });
});

describe('Cynefin Parsing - Self-loop transitions', () => {
  beforeEach(() => db.clear());

  it('should drop self-loop transitions and keep valid ones', async () => {
    await parser.parse(`cynefin-beta
  complex
    "A"
  complicated
    "B"
  complex --> complex : "Self-reflection"
  complex --> complicated : "Pattern found"
  complicated --> complicated
`);
    const transitions = db.getTransitions();
    expect(transitions).toHaveLength(1);
    expect(transitions[0].from).toBe('complex');
    expect(transitions[0].to).toBe('complicated');
    expect(transitions[0].label).toBe('Pattern found');
  });

  it('should produce zero transitions when all are self-loops', async () => {
    await parser.parse(`cynefin-beta
  complex
    "A"
  complex --> complex
`);
    expect(db.getTransitions()).toHaveLength(0);
  });
});

describe('Cynefin Parsing - Re-parse after clear', () => {
  beforeEach(() => db.clear());

  it('should have fresh state after clear and re-parse', async () => {
    await parser.parse(`cynefin-beta
  title First Diagram
  complex
    "Alpha"
    "Beta"
  complicated
    "Gamma"
  complex --> complicated : "Move"
`);
    expect(db.getDomains().size).toBe(2);
    expect(db.getTransitions()).toHaveLength(1);
    expect(db.getDiagramTitle()).toBe('First Diagram');

    db.clear();

    await parser.parse(`cynefin-beta
  title Second Diagram
  chaotic
    "Delta"
`);
    expect(db.getDomains().size).toBe(1);
    expect(db.getDomains().has('chaotic')).toBe(true);
    expect(db.getDomains().has('complex')).toBe(false);
    expect(db.getTransitions()).toHaveLength(0);
    expect(db.getDiagramTitle()).toBe('Second Diagram');
  });
});
