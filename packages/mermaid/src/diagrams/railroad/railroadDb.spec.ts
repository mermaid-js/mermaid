import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './railroadDb.js';

describe('Railroad Database', () => {
  beforeEach(() => {
    db.clear();
  });

  it('should store and retrieve rules', () => {
    const rule = {
      name: 'test',
      definition: { type: 'terminal' as const, value: 'test' },
    };

    db.addRule(rule);
    expect(db.getRules()).toHaveLength(1);
    expect(db.getRule('test')).toEqual(rule);
  });

  it('should handle title', () => {
    db.setTitle('Test Title');
    expect(db.getTitle()).toBe('Test Title');
  });

  it('should sanitize titles before storing them', () => {
    db.setTitle('<script>alert(1)</script>Safe Title');
    expect(db.getTitle()).not.toContain('<script>');
    expect(db.getTitle()).toContain('Safe Title');
  });

  it('should clear state', () => {
    db.setTitle('Test');
    db.addRule({
      name: 'rule',
      definition: { type: 'terminal', value: 'test' },
    });

    db.clear();

    expect(db.getTitle()).toBe('');
    expect(db.getRules()).toHaveLength(0);
  });

  it('should handle duplicate rules', () => {
    const rule1 = {
      name: 'test',
      definition: { type: 'terminal' as const, value: 'first' },
    };
    const rule2 = {
      name: 'test',
      definition: { type: 'terminal' as const, value: 'second' },
    };

    db.addRule(rule1);
    db.addRule(rule2); // Should overwrite

    expect(db.getRules()).toHaveLength(2); // Both are in the array
    expect(db.getRule('test')).toEqual(rule2); // Map has the second one
  });

  it('should handle accessibility title', () => {
    db.setAccTitle('Accessible Title');
    expect(db.getAccTitle()).toBe('Accessible Title');
  });

  it('should handle accessibility description', () => {
    db.setAccDescription('Accessible Description');
    expect(db.getAccDescription()).toBe('Accessible Description');
  });

  it('should share state between setTitle and setDiagramTitle', () => {
    db.setDiagramTitle('Diagram Title');
    expect(db.getDiagramTitle()).toBe('Diagram Title');
    expect(db.getTitle()).toBe('Diagram Title');
  });

  it('should return title via getDiagramTitle', () => {
    db.setTitle('Regular Title');
    expect(db.getDiagramTitle()).toBe('Regular Title');
  });

  it('should return undefined for non-existent rule', () => {
    expect(db.getRule('nonexistent')).toBeUndefined();
  });

  it('should sanitize rule names and terminal values at the db boundary', () => {
    db.addRule({
      name: 'rule<script>alert(1)</script>',
      definition: { type: 'terminal', value: 'value<script>alert(1)</script>' },
    });

    const storedRule = db.getRules()[0];
    expect(storedRule.name).not.toContain('<script>');
    expect(storedRule.name).toContain('rule');

    expect(storedRule.definition.type).toBe('terminal');
    if (storedRule.definition.type === 'terminal') {
      expect(storedRule.definition.value).not.toContain('<script>');
      expect(storedRule.definition.value).toContain('value');
    }
  });

  it('should clear all state including accessibility fields', () => {
    db.setTitle('Test Title');
    db.setAccTitle('Acc Title');
    db.setAccDescription('Acc Desc');
    db.setDiagramTitle('Diagram Title');
    db.addRule({
      name: 'rule',
      definition: { type: 'terminal', value: 'test' },
    });

    db.clear();

    expect(db.getTitle()).toBe('');
    expect(db.getAccTitle()).toBe('');
    expect(db.getAccDescription()).toBe('');
    expect(db.getDiagramTitle()).toBe('');
    expect(db.getRules()).toHaveLength(0);
  });
});
