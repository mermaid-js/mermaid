import { describe, it, expect, beforeEach } from 'vitest';
import type { DomainBlock, Transition } from '@mermaid-js/parser';
import { db } from './cynefinDb.js';
import {
  seededRandom,
  hashString,
  generateFoldPath,
  generateHorizontalBoundary,
  generateCliffPath,
  generateConfusionPath,
} from './cynefinBoundaries.js';

/** Test helper: build a partial DomainBlock with just the fields the DB reads. */
const block = (domain: string, items: { label: string }[] = []): DomainBlock =>
  ({ domain, items: items.map((i) => ({ label: i.label })) }) as unknown as DomainBlock;

/** Test helper: build a partial Transition with just the fields the DB reads. */
const tx = (from: string, to: string, label?: string): Transition =>
  ({ from, to, label: label ?? '' }) as unknown as Transition;

describe('Cynefin Database', () => {
  beforeEach(() => db.clear());

  it('should start empty', () => {
    expect(db.getDomains().size).toBe(0);
    expect(db.getTransitions().length).toBe(0);
  });

  it('should set domains from AST blocks', () => {
    db.setDomains([block('complex', [{ label: 'Test' }]), block('clear')]);
    expect(db.getDomains().size).toBe(2);
    expect(db.getDomains().get('complex')!.items).toHaveLength(1);
    expect(db.getDomains().get('clear')!.items).toHaveLength(0);
  });

  it('should set transitions', () => {
    db.setTransitions([tx('complex', 'complicated', 'Pattern found')]);
    const transitions = db.getTransitions();
    expect(transitions).toHaveLength(1);
    expect(transitions[0].from).toBe('complex');
    expect(transitions[0].to).toBe('complicated');
    expect(transitions[0].label).toBe('Pattern found');
  });

  it('should set transitions without labels', () => {
    db.setTransitions([tx('chaotic', 'complex')]);
    expect(db.getTransitions()[0].label).toBeUndefined();
  });

  it('should filter out self-loop transitions', () => {
    db.setTransitions([
      tx('complex', 'complex'),
      tx('complex', 'complicated', 'Pattern found'),
      tx('clear', 'clear'),
    ]);
    const transitions = db.getTransitions();
    expect(transitions).toHaveLength(1);
    expect(transitions[0].from).toBe('complex');
    expect(transitions[0].to).toBe('complicated');
  });

  it('should handle a list of only self-loops gracefully', () => {
    db.setTransitions([tx('complex', 'complex'), tx('chaotic', 'chaotic')]);
    expect(db.getTransitions()).toHaveLength(0);
  });

  it('should handle null/undefined blocks', () => {
    expect(() => db.setDomains(null as unknown as DomainBlock[])).not.toThrow();
    expect(() => db.setTransitions(null as unknown as Transition[])).not.toThrow();
  });

  it('should clear all data', () => {
    db.setDomains([block('complex', [{ label: 'A' }])]);
    db.setTransitions([tx('complex', 'chaotic')]);
    db.clear();
    expect(db.getDomains().size).toBe(0);
    expect(db.getTransitions().length).toBe(0);
  });

  it('should handle multiple domains', () => {
    db.setDomains([
      block('complex'),
      block('complicated'),
      block('clear'),
      block('chaotic'),
      block('confusion'),
    ]);
    expect(db.getDomains().size).toBe(5);
  });

  it('should handle domain with multiple items', () => {
    db.setDomains([
      block('complex', [{ label: 'A' }, { label: 'B' }, { label: 'C' }, { label: 'D' }]),
    ]);
    expect(db.getDomains().get('complex')!.items).toHaveLength(4);
  });

  it('should return config', () => {
    const config = db.getConfig();
    expect(typeof config).toBe('object');
  });
});

describe('Cynefin Boundaries', () => {
  it('seededRandom should return deterministic values', () => {
    expect(seededRandom(42)).toBe(seededRandom(42));
  });

  it('seededRandom should return values between 0 and 1', () => {
    for (const seed of [0, 1, 100, 999999, -50]) {
      const val = seededRandom(seed);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('hashString should return consistent hashes', () => {
    expect(hashString('cynefin')).toBe(hashString('cynefin'));
  });

  it('hashString should return different hashes for different strings', () => {
    expect(hashString('complex')).not.toBe(hashString('chaotic'));
  });

  it('generateFoldPath should return valid SVG path', () => {
    const path = generateFoldPath(800, 600, 42);
    expect(path).toMatch(/^M/);
    expect(path).toContain('C');
  });

  it('generateFoldPath should be deterministic', () => {
    const a = generateFoldPath(800, 600, 42);
    const b = generateFoldPath(800, 600, 42);
    expect(a).toBe(b);
  });

  it('generateHorizontalBoundary should return valid SVG path', () => {
    const path = generateHorizontalBoundary(800, 600, 42);
    expect(path).toMatch(/^M/);
    expect(path).toContain('C');
  });

  it('generateCliffPath should return valid SVG path', () => {
    const path = generateCliffPath(800, 600);
    expect(path).toMatch(/^M/);
    expect(path).toContain('C');
  });

  it('generateConfusionPath should return valid ellipse path', () => {
    const path = generateConfusionPath(400, 300, 50, 40);
    expect(path).toMatch(/^M/);
    expect(path).toContain('A');
    expect(path).toMatch(/Z$/);
  });

  it('generateConfusionPath should use provided center and radii', () => {
    const path = generateConfusionPath(400, 300, 50, 40);
    expect(path).toContain('350'); // cx - rx = 400 - 50
    expect(path).toContain('450'); // cx + rx = 400 + 50
    expect(path).toContain('300'); // cy
  });
});
